const bcrypt = require("bcrypt");
const User = require("../models/user.mysql.model.js");
const UserActe = require("../models/userActe.mysql.model.js");
const Acte = require("../models/acte.mysql.model.js");
const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.registerAdmin = async (req, res) => {
  try {
    const { email, firstName, lastName, password } = req.body;

    if (!email || !password || !lastName || !firstName) {
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
    const admin = await User.create({ email, password: hashedPassword, firstName, lastName, role: "admin" });

    res.status(201).json({ message: "Utilisateur créé", admin });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Merci de remplir tous les champs" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "L'utilisateur n'existe pas" });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: "Mot de passe incorrect" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, firstName: user.firstName, lastName: user.lastName },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({ message: "Vous êtes connecté", token, role: user.role });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "L'utilisateur n'existe pas" });
    }

    await user.destroy();
    res.status(200).json({ message: "Utilisateur supprimé avec succès" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.deleteMyAccount = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "Admin inexistant" });
    }
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Accès refusé." });
    }

    await user.destroy();
    return res.status(200).json({ message: "Utilisateur supprimé avec succès" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId, {
      include: [
        {
          model: User,
          as: "associatedUser",
          include: [{ model: UserActe, as: "actesList", include: [{ model: Acte, as: "acte" }] }],
        },
        { model: UserActe, as: "actesList", include: [{ model: Acte, as: "acte" }] },
      ],
    });

    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
