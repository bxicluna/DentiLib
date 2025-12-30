const bcrypt = require("bcrypt");
const User = require("../models/user.model.js");
const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.registerAdmin = async (req, res) => {
  try {
    const { email, firstName, lastName, password } = req.body;

    if (!email || !password || !lastName || !firstName) {
      return res
        .status(400)
        .json({ message: "Merci de remplir tous les champs" });
    }

    const regex = /^((?!\.)[\w\-_.]*[^.])(@\w+)(\.\w+(\.\w+)?[^.\W])$/;

    if (!email.match(regex)) {
      return res
        .status(400)
        .json({ message: "Le format de l'email est invalide" });
    }

    const existing = await User.findOne({ email });

    if (existing) {
      return res.status(409).json({ message: "Email déjà utilisé" });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Le mot de passe doit contenir au moins 6 caractères",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: "admin",
    });

    res.status(201).json({
      message: "Utilisateur créé",
      admin,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Merci de remplir tous les champs" });
    }
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: `L'utilisateur n'existe pas` });
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

    res.json({
      message: `Vous êtes connecté ${user.firstName}`,
      token,
      role: user.role,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "L'utilisateur n'existe pas" });
    }

    await User.findByIdAndDelete(userId);
    res.status(200).json({ message: "Utilisateur supprimé avec succès" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

exports.deleteMyAccount = async (req, res) => {
  try {
    const userIdToDelete = req.user.id;
    const connectedUser = req.user;

    if (connectedUser.role !== "admin") {
      return res.status(403).json({
        message: "Access denied. Admin only.",
      });
    }

    //3️⃣ Vérifier si l'admin existe
    const user = await User.findById(userIdToDelete);

    if (!user) {
      return res.status(404).json({
        message: "Admin inexistant",
      });
    }

    await User.findByIdAndDelete(userIdToDelete);

    return res.status(200).json({
      message: "Utilisateur supprimé avec succès",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error.",
    });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate({
      path: "associatedUser", // le prothésiste
      populate: {
        path: "actesList.acte", // chaque acte
        model: "Acte",
      },
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
