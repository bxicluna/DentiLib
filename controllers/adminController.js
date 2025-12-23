const bcrypt = require("bcrypt");
const User = require("../models/user.model.js");
const Acte = require("../models/acte.model.js");
const sendMail = require("../utils/sendEmail");
require("dotenv").config();

exports.createAccount = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      role,
      siret,
      actesList,
      dentisteId,
    } = req.body;

    if (!email || !password || !lastName || !firstName || !role) {
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

    const user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
      siret,
      actesList,
      associatedUser: null,
    });

    if (role === "dentiste") {
      await user.save();
      // Envoie de l'email avec les credentials
      await sendMail(
        user.email,
        "Vos identifiants DentiLib",
        "credential.html",
        {
          firstName: user.firstName,
          email: user.email,
          password: password, // mot de passe temporaire ou fourni
        }
      );
      return res.status(201).json({
        message: "Dentiste créé",
        user,
      });
    }

    if (role === "prothesiste") {
      if (!dentisteId) {
        return res.status(400).json({
          message: "dentisteId est necessaire pour un prothesiste",
        });
      }

      const dentiste = await User.findById(dentisteId);

      if (!dentiste || dentiste.role !== "dentiste") {
        return res.status(404).json({
          message: "Dentiste inexistant",
        });
      }

      user.associatedUser = dentiste._id;
      dentiste.associatedUser = user._id;

      await user.save();
      await dentiste.save();

      // Envoie de l'email avec les credentials
      await sendMail(
        user.email,
        "Vos identifiants DentiLib",
        "credential.html",
        {
          firstName: user.firstName,
          email: user.email,
          password: password, // mot de passe temporaire ou fourni
        }
      );

      return res.status(201).json({
        message: "Prothesiste créé et lié à un dentiste",
        prothesiste: user,
        dentiste,
      });
    }

    if (role == "admin") {
      await user.save();

      res.status(201).json({
        message: "Utilisateur créé",
        user,
      });

      // Envoie de l'email avec les credentials
      await sendMail(
        user.email,
        "Vos identifiants DentiLib",
        "credential.html",
        {
          firstName: user.firstName,
          email: user.email,
          password: password, // mot de passe temporaire ou fourni
        }
      );
    }

    return res.status(400).json({ message: "Ce role n'existe pas" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getUserWithoutAdmin = async (req, res) => {
  try {
    const users = await User.find({
      role: { $ne: "admin" },
    }).populate({
      path: "associatedUser",
      select: "firstName lastName email role",
    });
    res.json(users);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error.",
    });
  }
};

exports.getAllDentistes = async (req, res) => {
  try {
    const users = await User.find({ role: "dentiste" });
    res.json(users);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error.",
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { firstName, lastName, email } = req.body;

    // Vérifier les champs obligatoires
    if (!firstName || !lastName || !email) {
      return res
        .status(400)
        .json({ message: "Merci de remplir tous les champs" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    const existing = await User.findOne({ email });
    if (existing && existing._id.toString() !== userId) {
      return res.status(409).json({ message: "Email déjà utilisé" });
    }

    // Mise à jour
    user.firstName = firstName;
    user.lastName = lastName;
    user.email = email;

    await user.save();

    res
      .status(200)
      .json({ message: "Utilisateur mis à jour avec succès", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.getAllActes = async (req, res) => {
  try {
    const actes = await Acte.find();
    res.json(actes);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

exports.createActe = async (req, res) => {
  try {
    const { acteName, acteDescription } = req.body;

    if (!acteName) {
      res.status(400).json({ message: "Le nom de l'acte est requis" });
    }

    const existing = await Acte.find({ acteName });

    if (existing) {
      res.status(409).json({ message: "Cet acte existe déjà" });
    }

    const acte = Acte.create({ acteName, acteDescription });
    res.status(201).json({
      message: "Acte créé",
      acte,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

exports.deleteActe = async (req, res) => {
  try {
    const acteId = req.params.acteId;
    const acte = await Acte.findById(acteId);

    if (!acte) {
      return res.status(404).json({ message: "L'acte n'existe pas" });
    }

    await Acte.findByIdAndDelete(acteId);
    res.status(200).json({ message: "Acte supprimé avec succès" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

exports.updateActe = async (req, res) => {
  try {
    const acteId = req.params.acteId;
    const { acteName, acteDescription } = req.body;

    // Vérifier les champs obligatoires
    if (!acteName) {
      return res.status(400).json({ message: "Le nom est requis" });
    }

    const acte = await Acte.findById(acteId);
    if (!acte) {
      return res.status(404).json({ message: "Acte non trouvé" });
    }

    // Vérifier si le nom est déjà utilisé par un autre acte
    const existing = await Acte.findOne({ acteName });
    if (existing && existing._id.toString() !== acteId) {
      return res.status(409).json({ message: "Nom déjà utilisé" });
    }

    // Mise à jour
    acte.acteName = acteName;
    acte.acteDescription = acteDescription;

    await acte.save();

    res.status(200).json({ message: "Acte mis à jour avec succès", acte });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
