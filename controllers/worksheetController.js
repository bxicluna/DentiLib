const User = require("../models/user.mysql.model.js");
const UserActe = require("../models/userActe.mysql.model.js");
const Acte = require("../models/acte.mysql.model.js");
const WorkSheet = require("../models/worksheet.model.js");
const Counter = require("../models/counter.model.js");
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
      include: [Acte],
    });

    const counter = await Counter.findOneAndUpdate(
      { name: "worksheet" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const actesValides = actesSelectiones.map((item) => {
      if (!item.acteName) throw new Error("Un acte sélectionné est invalide ou manquant");

      const actePro = actesList.find(
        (a) =>
          a.Acte &&
          a.Acte.acteName.trim().toLowerCase() === item.acteName.trim().toLowerCase()
      );

      if (!actePro) throw new Error(`Acte non disponible dans le catalogue du prothésiste: ${item.acteName}`);

      return {
        acteId: actePro.Acte.id,
        acteName: actePro.Acte.acteName,
        price: actePro.price,
        quantity: item.quantity || 1,
      };
    });

    const total = actesValides.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);

    const worksheet = await WorkSheet.create({
      numWorkSheet: counter.seq,
      comment: comment || "",
      patientFirstName,
      patientLastName,
      patientEmail,
      patientNumSecu,
      actes: actesValides,
      total,
      dentisteId: dentiste.id,
      prothesisteId: prothesiste.id,
    });

    res.status(201).json(worksheet);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || "Erreur serveur" });
  }
};

exports.getWorksheetByUser = async (req, res) => {
  try {
    const user = req.user;

    if (user.role === "dentiste") {
      const worksheets = await WorkSheet.find({ dentisteId: user.id }).sort({ createdAt: -1 });

      const prothesisteIds = [...new Set(worksheets.map((w) => w.prothesisteId))];
      const prothesistes = await User.findAll({
        where: { id: prothesisteIds },
        attributes: ["id", "firstName", "lastName"],
      });
      const prothesisteMap = Object.fromEntries(prothesistes.map((p) => [p.id, p]));

      const enriched = worksheets.map((w) => ({
        ...w.toObject(),
        prothesisteId: prothesisteMap[w.prothesisteId] || { id: w.prothesisteId },
      }));

      return res.status(200).json(enriched);
    }

    if (user.role === "prothesiste") {
      const worksheets = await WorkSheet.find({ prothesisteId: user.id }).sort({ createdAt: -1 });

      const dentisteIds = [...new Set(worksheets.map((w) => w.dentisteId))];
      const dentistes = await User.findAll({
        where: { id: dentisteIds },
        attributes: ["id", "firstName", "lastName"],
      });
      const dentisteMap = Object.fromEntries(dentistes.map((d) => [d.id, d]));

      const enriched = worksheets.map((w) => ({
        ...w.toObject(),
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

    const worksheet = await WorkSheet.findById(id);
    if (!worksheet) {
      return res.status(404).json({ message: "Fiche introuvable" });
    }

    const [dentiste, prothesiste] = await Promise.all([
      User.findByPk(worksheet.dentisteId, { attributes: ["id", "firstName", "lastName", "email"] }),
      User.findByPk(worksheet.prothesisteId, { attributes: ["id", "firstName", "lastName", "email"] }),
    ]);

    if (req.user.role === "dentiste" && worksheet.dentisteId !== req.user.id) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    if (req.user.role === "prothesiste" && worksheet.prothesisteId !== req.user.id) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    res.status(200).json({ ...worksheet.toObject(), dentisteId: dentiste, prothesisteId: prothesiste });
  } catch (error) {
    console.error("Erreur getWorksheetById :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.deleteWorksheet = async (req, res) => {
  try {
    const worksheet = await WorkSheet.findById(req.params.id);
    if (!worksheet) return res.status(404).json({ message: "Fiche introuvable" });

    if (req.user.role !== "dentiste" || worksheet.dentisteId !== req.user.id) {
      return res.status(403).json({ message: "Action non autorisée" });
    }

    await worksheet.deleteOne();
    res.json({ message: "Fiche supprimée avec succès" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.updateWorksheet = async (req, res) => {
  try {
    const worksheet = await WorkSheet.findById(req.params.id);
    if (!worksheet) return res.status(404).json({ message: "Fiche introuvable" });

    if (req.user.role !== "dentiste" || worksheet.dentisteId !== req.user.id) {
      return res.status(403).json({ message: "Action non autorisée" });
    }

    const { patientFirstName, patientLastName, patientEmail, patientNumSecu, actes, comment, total } = req.body;
    worksheet.patientFirstName = patientFirstName;
    worksheet.patientLastName = patientLastName;
    worksheet.patientEmail = patientEmail;
    worksheet.patientNumSecu = patientNumSecu;
    worksheet.actes = actes;
    worksheet.comment = comment;
    worksheet.total = total;

    await worksheet.save();
    res.json(worksheet);
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

    const ws = await WorkSheet.findById(id);
    if (!ws) return res.status(404).json({ message: "Fiche introuvable" });

    if (req.user.role !== "prothesiste" || ws.prothesisteId !== req.user.id) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    ws.status = status;
    await ws.save();

    res.status(200).json({ message: "Statut mis à jour", status });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err });
  }
};
