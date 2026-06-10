const rateLimit = require('express-rate-limit')

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { message: "Trop de tentatives de connexion. Réessayez dans 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
})

module.exports = { loginLimiter }
