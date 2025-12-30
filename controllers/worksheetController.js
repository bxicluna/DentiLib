const bcrypt = require("bcrypt");
const User = require("../models/user.model.js");
const Acte = require("../models/acte.model.js");
const WorkSheet = require("../models/worksheet.model.js");
const Counter = require("../models/counter.model.js");
require("dotenv").config();
const mongoose = require("mongoose");

exports.createWorksheet = async (req, res) => {
  try {
    if (req.user.role !== "dentiste") {
      return res.status(403).json({
        message:
          "Vous n'avez pas les droits necessaires pour créer une fiche de travail",
      });
    }
    const {
      comment,
      actes: actesSelectiones = [],
      patientFirstName,
      patientLastName,
      patientEmail,
      patientNumSecu,
    } = req.body;

    if (
      !patientEmail ||
      !patientFirstName ||
      !patientLastName ||
      !patientNumSecu
    ) {
      return res
        .status(400)
        .json({ message: "Merci de remplir tous les champs" });
    }

    const regex = /^((?!\.)[\w\-_.]*[^.])(@\w+)(\.\w+(\.\w+)?[^.\W])$/;

    if (!patientEmail.match(regex)) {
      return res
        .status(400)
        .json({ message: "Le format de l'email est invalide" });
    }

    const dentiste = await User.findById(req.user.id).populate({
      path: "associatedUser", // populate le prothésiste
      populate: {
        // puis populate les actes dans sa liste
        path: "actesList.acte",
        model: "Acte",
      },
    });

    if (!dentiste) {
      return res.status(404).json({ message: "Dentiste introuvable" });
    }

    const prothesiste = dentiste.associatedUser;
    const actesList = prothesiste.actesList || [];

    if (!prothesiste) {
      return res
        .status(400)
        .json({ message: "Le dentiste n'a pas de prothésiste associé" });
    }

    const counter = await Counter.findOneAndUpdate(
      { name: "worksheet" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const numWorkSheet = counter.seq;

    const actesValides = actesSelectiones.map((item) => {
      if (!item.acteName) {
        throw new Error("Un acte sélectionné est invalide ou manquant");
      }
      const actePro = actesList.find(
        (a) =>
          a.acte &&
          a.acte.acteName.trim().toLowerCase() ===
            item.acteName.trim().toLowerCase()
      );

      if (!actePro)
        throw new Error(
          `Acte non disponible dans le catalogue du prothésiste: ${item.acteName}`
        );
      return {
        acteId: actePro.acte._id,
        acteName: actePro.acte.acteName,
        price: actePro.price,
        quantity: item.quantity || 1,
      };
    });

    const total = actesValides.reduce(
      (acc, curr) => acc + curr.price * curr.quantity,
      0
    );

    const worksheet = await WorkSheet.create({
      numWorkSheet,
      comment: comment || "",
      patientFirstName,
      patientLastName,
      patientEmail,
      patientNumSecu,
      actes: actesValides,
      total,
      dentisteId: dentiste._id,
      prothesisteId: prothesiste._id,
    });

    res.status(201).json(worksheet);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getWorksheetByUser = async (req, res) => {
  try {
    const user = req.user;

    if (user.role == "dentiste") {
      const worksheets = await WorkSheet.find({ dentisteId: user.id })
        .populate("prothesisteId", "firstName lastName")
        .sort({ createdAt: -1 });

      res.status(200).json(worksheets);
    } else if (user.role == "prothesiste") {
      const worksheets = await WorkSheet.find({ prothesisteId: user.id })
        .populate("dentisteId", "firstName lastName")
        .sort({ createdAt: -1 });

      res.status(200).json(worksheets);
    } else {
      return res.status(403).json({ message: "Accès refusé" });
    }
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

exports.getWorksheetById = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérification ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID de fiche invalide" });
    }

    const worksheet = await WorkSheet.findById(id)
      .populate("prothesisteId", "firstName lastName email")
      .populate("dentisteId", "firstName lastName email");

    if (!worksheet) {
      return res.status(404).json({ message: "Fiche introuvable" });
    }

    /**
     * Sécurité :
     * - un dentiste ne peut voir que SES fiches
     * - un prothésiste ne peut voir que les fiches qui lui sont attribuées
     */
    if (
      req.user.role === "dentiste" &&
      worksheet.dentisteId._id.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    if (
      req.user.role === "prothesiste" &&
      worksheet.prothesisteId._id.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    res.status(200).json(worksheet);
  } catch (error) {
    console.error("Erreur getWorksheetById :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.deleteWorksheet = async (req, res) => {
  try {
    const worksheet = await WorkSheet.findById(req.params.id);
    if (!worksheet)
      return res.status(404).json({ message: "Fiche introuvable" });

    // Vérifier que le dentiste connecté est le propriétaire
    if (
      req.user.role !== "dentiste" ||
      req.user.id !== worksheet.dentisteId.toString()
    ) {
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
    if (!worksheet)
      return res.status(404).json({ message: "Fiche introuvable" });

    // Vérifier que c’est bien le dentiste qui modifie
    if (
      req.user.role !== "dentiste" ||
      req.user.id !== worksheet.dentisteId.toString()
    ) {
      return res.status(403).json({ message: "Action non autorisée" });
    }

    // Mettre à jour les champs
    const {
      patientFirstName,
      patientLastName,
      patientEmail,
      patientNumSecu,
      actes,
      comment,
      total,
    } = req.body;
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
