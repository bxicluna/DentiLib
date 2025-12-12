const bcrypt = require('bcrypt')
const User = require('../models/user.model.js');
const jwt = require('jsonwebtoken')
require('dotenv').config()

exports.registerUser = async (req, res) => {
    const {email, password, lastName, firstName, role, siret, associatedUser, actesList} = req.body

    const existing = await User.findOne({email})

    if(existing) {
        return res.status(409).json({error: 'Email déjà utilisé'})
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await User.create({
        email,
        password: hashedPassword,
        lastName,
        firstName,
        role,
        siret,
        associatedUser,
        actesList
    })

    res.status(201).json({
        message: 'Utilisateur créé',
        user
    })
}

exports.registerAdmin = async (req, res) => {
    const {email, firstName, lastName, password} = req.body

    const existing = await User.findOne({email})

    if(existing) {
        return res.status(409).json({error: 'Email déjà utilisé'})
    }
    const hashedPassword = await bcrypt.hash(password,10)

    const admin = await User.create({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: "admin"
    })

    res.status(201).json({
        message: 'Utilisateur créé',
        admin
    })
}

exports.login = async (req, res) => {
    const {email, password} = req.body
    const user = await User.findOne({ email })

    if(!user) {
        return res.status(404).json({ message: `L'utilisateur ${user.email} n'existe pas`})
    }

    const isValid = await bcrypt.compare(password, user.password)

    if(!isValid) {
        return res.status(401).json({ message: 'Mot de passe incorrect'})
    }

    const token = jwt.sign({id: user.id}, process.env.JWT_SECRET, {expiresIn: '2h'})

    res.json({ message: `Vous êtes connecté ${user.firstName}`, token})
}