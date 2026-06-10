const User = require("../models/user.mysql.model.js");
const Acte = require("../models/acte.mysql.model.js");
const UserActe = require("../models/userActe.mysql.model.js");
require("dotenv").config();

exports.addActe = async (req, res) => {
  try {
    const { acteName, price } = req.body;

    if (!acteName || !price) {
      return res.status(400).json({ message: "Nom de l'acte et prix requis" });
    }

    const acte = await Acte.findOne({ where: { acteName } });
    if (!acte) {
      return res.status(404).json({ message: "Acte inexistant dans le catalogue" });
    }

    const prothesiste = await User.findByPk(req.user.id);
    if (!prothesiste || prothesiste.role !== "prothesiste") {
      return res.status(403).json({ message: "Seul un prothésiste peut ajouter des actes à son catalogue" });
    }

    const exists = await UserActe.findOne({ where: { userId: prothesiste.id, acteId: acte.id } });
    if (exists) {
      return res.status(400).json({ message: "Cet acte est déjà dans votre catalogue" });
    }

    const userActe = await UserActe.create({ userId: prothesiste.id, acteId: acte.id, price });

    res.status(201).json({ message: "Acte ajouté à votre catalogue", userActe });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.updateActePrice = async (req, res) => {
  try {
    const prothesiste = await User.findByPk(req.user.id);
    if (!prothesiste || prothesiste.role !== "prothesiste") {
      return res.status(403).json({ message: "Seul un prothésiste peut modifier son catalogue" });
    }

    const { acteId } = req.params;
    const { price } = req.body;

    if (!price) return res.status(400).json({ message: "Prix requis" });
    if (price < 0) return res.status(400).json({ message: "Le prix doit être supérieur à 0" });

    const userActe = await UserActe.findOne({ where: { id: acteId, userId: prothesiste.id } });
    if (!userActe) {
      return res.status(404).json({ message: "Acte introuvable dans votre catalogue" });
    }

    userActe.price = price;
    await userActe.save();

    res.json({ message: "Prix mis à jour", userActe });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.deleteActe = async (req, res) => {
  try {
    const prothesiste = await User.findByPk(req.user.id);
    if (!prothesiste || prothesiste.role !== "prothesiste") {
      return res.status(403).json({ message: "Seul un prothésiste peut modifier son catalogue" });
    }

    const { acteId } = req.params;

    const userActe = await UserActe.findOne({ where: { id: acteId, userId: prothesiste.id } });
    if (!userActe) {
      return res.status(404).json({ message: "Acte introuvable dans votre catalogue" });
    }

    await userActe.destroy();
    res.json({ message: "Acte supprimé" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.getMyActes = async (req, res) => {
  try {
    if (req.user.role !== "prothesiste") {
      return res.status(403).json({ message: "Accès refusé" });
    }

    const actesList = await UserActe.findAll({
      where: { userId: req.user.id },
      include: [{ model: Acte, as: "acte" }],
    });

    res.json(actesList);
  } catch (error) {
    console.error("Erreur getMyActes :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.getProthesisteActes = async (req, res) => {
  try {
    const prothesisteId = req.params.prothesisteId;

    const prothesiste = await User.findByPk(prothesisteId);
    if (!prothesiste) {
      return res.status(404).json({ message: "Prothésiste introuvable" });
    }

    const actesList = await UserActe.findAll({
      where: { userId: prothesisteId },
      include: [{ model: Acte, as: "acte" }],
    });

    res.json({
      prothesisteName: `${prothesiste.firstName} ${prothesiste.lastName}`,
      actesList,
    });
  } catch (error) {
    console.error("Erreur getProthesisteActes :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
