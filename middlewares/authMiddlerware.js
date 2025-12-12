const jwt = require('jsonwebtoken')
require('dotenv').config()

const authMiddlware = (req, res, next) => {
    const authHeader = req.headers.authorization

    if(!authHeader || !authHeader.startWith('Bearer ')) {
        return res.status(403).json({ message: 'Token manquant ou invalide'})
    }

    const token = authHeader.split(' ')[1]

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
}

module.exports = authMiddlware