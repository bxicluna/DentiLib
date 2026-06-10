const bcrypt = require("bcrypt");
const { Op } = require("sequelize");
const User = require("../models/user.mysql.model.js");
const UserActe = require("../models/userActe.mysql.model.js");
const Acte = require("../models/acte.mysql.model.js");
const sendMail = require("../utils/sendEmail");
require("dotenv").config();

exports.createAccount = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, siret, dentisteId } = req.body;

    if (!email || !password || !lastName || !firstName || !role) {
      return res.status(400).json({ message: "Merci de remplir tous les champs" });
    }

    const regex = /^((?!\.)[\w\-_.]*[^.])(@\w+)(\.\w+(\.\w+)?[^.\W])$/;
    if (!email.match(regex)) {
      return res.status(400).json({ message: "Le format de l'email est invalide" });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: "Email déjà utilisé" });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{12,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ message: "Le mot de passe doit contenir au moins 12 caractères, une majuscule, un chiffre et un caractère spécial." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (role === "dentiste") {
      const user = await User.create({ firstName, lastName, email, password: hashedPassword, role, siret });

      await sendMail(user.email, "Vos identifiants DentiLib", "credential.html", {
        firstName: user.firstName,
        email: user.email,
        password,
      });

      return res.status(201).json({ message: "Dentiste créé", user });
    }

    if (role === "prothesiste") {
      if (!dentisteId) {
        return res.status(400).json({ message: "Veuillez sélectionner un dentiste à associer au prothésiste" });
      }

      const dentiste = await User.findByPk(dentisteId);
      if (!dentiste || dentiste.role !== "dentiste") {
        return res.status(404).json({ message: "Dentiste inexistant" });
      }

      const user = await User.create({
        firstName, lastName, email, password: hashedPassword, role, siret,
        associatedUserId: dentiste.id,
      });

      dentiste.associatedUserId = user.id;
      await dentiste.save();

      await sendMail(user.email, "Vos identifiants DentiLib", "credential.html", {
        firstName: user.firstName,
        email: user.email,
        password,
      });

      return res.status(201).json({ message: "Prothesiste créé et lié à un dentiste", prothesiste: user, dentiste });
    }

    if (role === "admin") {
      const user = await User.create({ firstName, lastName, email, password: hashedPassword, role });

      res.status(201).json({ message: "Utilisateur créé", user });

      await sendMail(user.email, "Vos identifiants DentiLib", "credential.html", {
        firstName: user.firstName,
        email: user.email,
        password,
      });

      return;
    }

    return res.status(400).json({ message: "Ce role n'existe pas" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.getUserWithoutAdmin = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { role: { [Op.ne]: "admin" } },
      include: [{ model: User, as: "associatedUser", attributes: ["id", "firstName", "lastName", "email", "role"] }],
    });
    res.json(users);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.getAllDentistes = async (req, res) => {
  try {
    const users = await User.findAll({ where: { role: "dentiste" } });
    res.json(users);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ message: "Merci de remplir tous les champs" });
    }

    const emailRegex = /^((?!\.)[\w\-_.]*[^.])(@\w+)(\.\w+(\.\w+)?[^.\W])$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Le format de l'email est invalide" });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing && existing.id !== user.id) {
      return res.status(409).json({ message: "Email déjà utilisé" });
    }

    user.firstName = firstName;
    user.lastName = lastName;
    user.email = email;
    await user.save();

    res.status(200).json({ message: "Utilisateur mis à jour avec succès", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.getAllActes = async (req, res) => {
  try {
    const actes = await Acte.findAll();
    res.json(actes);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.createActe = async (req, res) => {
  try {
    const { acteName, acteDescription } = req.body;

    if (!acteName) {
      return res.status(400).json({ message: "Le nom de l'acte est requis" });
    }

    const existing = await Acte.findOne({ where: { acteName } });
    if (existing) {
      return res.status(409).json({ message: "Cet acte existe déjà" });
    }

    const acte = await Acte.create({ acteName, acteDescription });
    return res.status(201).json({ message: "Acte créé", acte });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.deleteActe = async (req, res) => {
  try {
    const acte = await Acte.findByPk(req.params.acteId);
    if (!acte) {
      return res.status(404).json({ message: "L'acte n'existe pas" });
    }

    await acte.destroy();
    res.status(200).json({ message: "Acte supprimé avec succès" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.updateActe = async (req, res) => {
  try {
    const { acteName, acteDescription } = req.body;

    if (!acteName) {
      return res.status(400).json({ message: "Le nom est requis" });
    }

    const acte = await Acte.findByPk(req.params.acteId);
    if (!acte) {
      return res.status(404).json({ message: "Acte non trouvé" });
    }

    const existing = await Acte.findOne({ where: { acteName } });
    if (existing && existing.id !== acte.id) {
      return res.status(409).json({ message: "Nom déjà utilisé" });
    }

    acte.acteName = acteName;
    acte.acteDescription = acteDescription;
    await acte.save();

    res.status(200).json({ message: "Acte mis à jour avec succès", acte });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
