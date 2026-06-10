const express = require('express')
const router = express.Router()
const userController = require('../controllers/userController')
const authMiddleware = require('../middlewares/authMiddleware')
const { loginLimiter } = require('../middlewares/rateLimiter')
const { loginValidator, registerAdminValidator } = require('../middlewares/validators')

router.post('/user/registerAdmin', registerAdminValidator, userController.registerAdmin)
router.post('/user/login', loginLimiter, loginValidator, userController.login)
router.delete('/user/deleteUser/:userId', authMiddleware, userController.deleteUser)
router.delete('/user/deleteMyAccount', authMiddleware, userController.deleteMyAccount)
router.get("/user/getUser/:userId", authMiddleware, userController.getUserById);

module.exports = router