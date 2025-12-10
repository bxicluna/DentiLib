//const {models} = require('../models/user')
const bcrypt = require('bcrypt')
const User = require('../models/user');

exports.register = async (req, res) => {
    const {email, password, nom, prenom, role} = req.body

    const existing = await User.findOne({where: {email}})

    if(existing) {
        return res.Status(409).json({error: 'Email déjà utilisé'})
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await User.create({
        email,
        password: hashedPassword,
        nom,
        prenom,
        role
    })

    res.status(201).json({
        message: 'Utilisateur créé',
        user
    })
}