const express = require('express')
const router = express.Router()
const userController = require('../controllers/userController')
const authMiddleware = require('../middlewares/authMiddlerware')


router.post('/user/registerUser', userController.registerUser)
router.post('/user/registerAdmin', userController.registerAdmin)
router.get('/user/login', userController.login)

module.exports = router