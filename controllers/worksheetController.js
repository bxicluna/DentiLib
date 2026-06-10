const User = require("../models/user.mysql.model.js");
const UserActe = require("../models/userActe.mysql.model.js");
const Acte = require("../models/acte.mysql.model.js");
const WorkSheet = require("../models/worksheet.mysql.model.js");
const WorksheetActe = require("../models/worksheetActe.mysql.model.js");
require("dotenv").config();

exports.createWorksheet = async (req, res) => {
  try {
    if (req.user.role !== "dentiste") {
      return res.status(403).json({ message: "Vous n'avez pas les droits necessaires pour créer une fiche de travail" });
    }

    const {
      comment,
      actes: actesSelectiones = [],
      patientFirstName,
      patientLastName,
      patientEmail,
      patientNumSecu,
    } = req.body;

    if (!patientEmail || !patientFirstName || !patientLastName || !patientNumSecu) {
      return res.status(400).json({ message: "Merci de remplir tous les champs" });
    }

    const regex = /^((?!\.)[\w\-_.]*[^.])(@\w+)(\.\w+(\.\w+)?[^.\W])$/;
    if (!patientEmail.match(regex)) {
      return res.status(400).json({ message: "Le format de l'email est invalide" });
    }

    const dentiste = await User.findByPk(req.user.id, {
      include: [{ model: User, as: "associatedUser" }],
    });

    if (!dentiste) {
      return res.status(404).json({ message: "Dentiste introuvable" });
    }

    const prothesiste = dentiste.associatedUser;
    if (!prothesiste) {
      return res.status(400).json({ message: "Le dentiste n'a pas de prothésiste associé" });
    }

    const actesList = await UserActe.findAll({
      where: { userId: prothesiste.id },
      include: [{ model: Acte, as: "acte" }],
    });

    const actesValides = actesSelectiones.map((item) => {
      if (!item.acteName) throw new Error("Un acte sélectionné est invalide ou manquant");

      const actePro = actesList.find(
        (a) =>
          a.acte &&
          a.acte.acteName.trim().toLowerCase() === item.acteName.trim().toLowerCase()
      );

      if (!actePro) throw new Error(`Acte non disponible dans le catalogue du prothésiste: ${item.acteName}`);

      return {
        acteName: actePro.acte.acteName,
        price: actePro.price,
        quantity: item.quantity || 1,
      };
    });

    const total = actesValides.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);

    const worksheet = await WorkSheet.create({
      comment: comment || "",
      patientFirstName,
      patientLastName,
      patientEmail,
      patientNumSecu,
      total,
      dentisteId: dentiste.id,
      prothesisteId: prothesiste.id,
    });

    await Promise.all(
      actesValides.map((a) => WorksheetActe.create({ worksheetId: worksheet.id, ...a }))
    );

    const result = await WorkSheet.findByPk(worksheet.id, { include: [{ model: WorksheetActe, as: "actes" }] });
    res.status(201).json({ ...result.toJSON(), numWorkSheet: result.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || "Erreur serveur" });
  }
};

exports.getWorksheetByUser = async (req, res) => {
  try {
    const user = req.user;

    if (user.role === "dentiste") {
      const worksheets = await WorkSheet.findAll({
        where: { dentisteId: user.id },
        include: [{ model: WorksheetActe, as: "actes" }],
        order: [["createdAt", "DESC"]],
      });

      const prothesisteIds = [...new Set(worksheets.map((w) => w.prothesisteId))];
      const prothesistes = await User.findAll({
        where: { id: prothesisteIds },
        attributes: ["id", "firstName", "lastName"],
      });
      const prothesisteMap = Object.fromEntries(prothesistes.map((p) => [p.id, p]));

      const enriched = worksheets.map((w) => ({
        ...w.toJSON(),
        numWorkSheet: w.id,
        prothesisteId: prothesisteMap[w.prothesisteId] || { id: w.prothesisteId },
      }));

      return res.status(200).json(enriched);
    }

    if (user.role === "prothesiste") {
      const worksheets = await WorkSheet.findAll({
        where: { prothesisteId: user.id },
        include: [{ model: WorksheetActe, as: "actes" }],
        order: [["createdAt", "DESC"]],
      });

      const dentisteIds = [...new Set(worksheets.map((w) => w.dentisteId))];
      const dentistes = await User.findAll({
        where: { id: dentisteIds },
        attributes: ["id", "firstName", "lastName"],
      });
      const dentisteMap = Object.fromEntries(dentistes.map((d) => [d.id, d]));

      const enriched = worksheets.map((w) => ({
        ...w.toJSON(),
        numWorkSheet: w.id,
        dentisteId: dentisteMap[w.dentisteId] || { id: w.dentisteId },
      }));

      return res.status(200).json(enriched);
    }

    return res.status(403).json({ message: "Accès refusé" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

exports.getWorksheetById = async (req, res) => {
  try {
    const { id } = req.params;

    const worksheet = await WorkSheet.findByPk(id, {
      include: [{ model: WorksheetActe, as: "actes" }],
    });
    if (!worksheet) {
      return res.status(404).json({ message: "Fiche introuvable" });
    }

    if (req.user.role === "dentiste" && worksheet.dentisteId !== req.user.id) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    if (req.user.role === "prothesiste" && worksheet.prothesisteId !== req.user.id) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    const [dentiste, prothesiste] = await Promise.all([
      User.findByPk(worksheet.dentisteId, { attributes: ["id", "firstName", "lastName", "email"] }),
      User.findByPk(worksheet.prothesisteId, { attributes: ["id", "firstName", "lastName", "email"] }),
    ]);

    res.status(200).json({
      ...worksheet.toJSON(),
      numWorkSheet: worksheet.id,
      dentisteId: dentiste,
      prothesisteId: prothesiste,
    });
  } catch (error) {
    console.error("Erreur getWorksheetById :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.deleteWorksheet = async (req, res) => {
  try {
    const worksheet = await WorkSheet.findByPk(req.params.id);
    if (!worksheet) return res.status(404).json({ message: "Fiche introuvable" });

    if (req.user.role !== "dentiste" || worksheet.dentisteId !== req.user.id) {
      return res.status(403).json({ message: "Action non autorisée" });
    }

    await WorksheetActe.destroy({ where: { worksheetId: worksheet.id } });
    await worksheet.destroy();
    res.json({ message: "Fiche supprimée avec succès" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.updateWorksheet = async (req, res) => {
  try {
    const worksheet = await WorkSheet.findByPk(req.params.id);
    if (!worksheet) return res.status(404).json({ message: "Fiche introuvable" });

    if (req.user.role !== "dentiste" || worksheet.dentisteId !== req.user.id) {
      return res.status(403).json({ message: "Action non autorisée" });
    }

    const { patientFirstName, patientLastName, patientEmail, patientNumSecu, actes, comment, total } = req.body;

    await worksheet.update({ patientFirstName, patientLastName, patientEmail, patientNumSecu, comment, total });

    if (actes) {
      await WorksheetActe.destroy({ where: { worksheetId: worksheet.id } });
      await Promise.all(
        actes.map((a) => WorksheetActe.create({ worksheetId: worksheet.id, acteName: a.acteName, price: a.price, quantity: a.quantity || 1 }))
      );
    }

    const result = await WorkSheet.findByPk(worksheet.id, { include: [{ model: WorksheetActe, as: "actes" }] });
    res.json({ ...result.toJSON(), numWorkSheet: result.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.getWorksheetStatus = async (req, res) => {};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (status !== "En attente" && status !== "En cours" && status !== "Termine") {
      return res.status(400).json({ message: "status invalide" });
    }

    const ws = await WorkSheet.findByPk(id);
    if (!ws) return res.status(404).json({ message: "Fiche introuvable" });

    if (req.user.role !== "prothesiste" || ws.prothesisteId !== req.user.id) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    await ws.update({ status });
    res.status(200).json({ message: "Statut mis à jour", status });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err });
  }
};
