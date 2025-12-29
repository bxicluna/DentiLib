const bcrypt = require("bcrypt");
const User = require("../models/user.model.js");
const Acte = require("../models/acte.model.js");
const WorkSheet = require("../models/worksheet.model.js");
const Counter = require("../models/counter.model.js");
require("dotenv").config();

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
      prosthetistId: prothesiste._id,
    });

    res.status(201).json(worksheet);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getWorksheetByUser = async (req, res) => {};

exports.getWorksheetById = async (req, res) => {};

exports.getWorksheetStatus = async (req, res) => {};


