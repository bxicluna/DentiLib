const bcrypt = require("bcrypt");
const User = require("../models/user.model.js");
const Acte = require("../models/acte.model.js");
const WorkSheet = require("../models/worksheet.model.js");
const Counter = require("../models/counter.model.js");
require("dotenv").config();

exports.addActe = async (req, res) => {
  try {
    const { acteName, price } = req.body

    if(!acteName || !price) {
        return res.status(400).json({ message: "Nom de l'acte et prix requis"})
    }

    let acte = await Acte.findOne({ acteName })
    if(!acte) {
        return res.status(404).json({ message: "Acte inexistant dans le catalogue"})
    }

    const prothesiste = await User.findById(req.user.id)
    if(!prothesiste || prothesiste.role !== "prothesiste"){
        return res.status(403).json({ message: "Seul un prothésiste peut ajouter des actes à son catalogue" })
    }

    // Vérifie si l'acte est déjà dans sa liste
    const exists = prothesiste.actesList.some(a => a.acte.toString() === acte._id.toString());
    if (exists) {
      return res.status(400).json({ message: "Cet acte est déjà dans votre catalogue" });
    }

    prothesiste.actesList.push({ acte: acte._id, price })
    await prothesiste.save()

    res.status(201).json({ message: "Acte ajouté à votre catalogue", actesListe: prothesiste.actesList })

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateActePrice = async (req, res) => {
  try {
    const prothesiste = await User.findById(req.user.id);
    if (!prothesiste || prothesiste.role !== "prothesiste") {
      return res
        .status(403)
        .json({ message: "Seul un prothésiste peut modifier son catalogue" });
    }

    const { acteId } = req.params;
    const { price } = req.body;

    if (!price) return res.status(400).json({ message: "Prix requis" });
console.log(prothesiste.actesList)
console.log(acteId)

    const acteIndex = prothesiste.actesList.findIndex(
      (a) => a._id.toString() === acteId
    );
    if (acteIndex === -1)
      return res
        .status(404)
        .json({ message: "Acte introuvable dans votre catalogue" });

    prothesiste.actesList[acteIndex].price = price;
    await prothesiste.save();

    res.json({ message: "Prix mis à jour", actesList: prothesiste.actesList });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteActe = async (req, res) => {
  try {
    const prothesiste = await User.findById(req.user.id);
    if (!prothesiste || prothesiste.role !== "prothesiste") {
      return res.status(403).json({ message: "Seul un prothésiste peut modifier son catalogue" });
    }

    const { acteId } = req.params;

    const actesLengthBefore = prothesiste.actesList.length;

    prothesiste.actesList = prothesiste.actesList.filter(a => a._id.toString() !== acteId);

    if (prothesiste.actesList.length === actesLengthBefore) {
      return res.status(404).json({ message: "Acte introuvable dans votre catalogue" });
    }

    await prothesiste.save();
    res.json({ message: "Acte supprimé", actesList: prothesiste.actesList });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getMyActes = async (req, res) => {
  try {
    // Vérifier que l'utilisateur est bien un prothésiste
    if (req.user.role !== "prothesiste") {
      return res.status(403).json({ message: "Accès refusé" });
    }

    // Récupérer le prothésiste et populater chaque référence acte
    const prothesiste = await User.findById(req.user.id).populate({
      path: "actesList.acte", // populate chaque acte
      model: "Acte"
    });

    if (!prothesiste) {
      return res.status(404).json({ message: "Prothésiste introuvable" });
    }

    // Retourner la liste d'actes
    res.json(prothesiste.actesList);

  } catch (error) {
    console.error("Erreur getMyActes :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
