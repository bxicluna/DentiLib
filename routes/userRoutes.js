const express = require('express')
const router = express.Router()
const userController = require('../controllers/userController')
const authMiddleware = require('../middlewares/authMiddlerware')


router.post('/user/registerUser', authMiddleware, userController.registerUser)
router.post('/user/registerAdmin', userController.registerAdmin)
router.post('/user/login', userController.login)
router.delete('/user/deleteUser/:userId', authMiddleware, userController.deleteUser)
router.delete('/user/deleteMyAccount', authMiddleware, userController.deleteMyAccount)

module.exports = router