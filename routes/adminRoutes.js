const express = require('express')
const router = express.Router()
const adminController = require('../controllers/adminController')
const authMiddleware = require('../middlewares/authMiddleware')
const { createAccountValidator, updateUserValidator, createActeAdminValidator } = require('../middlewares/validators')

router.get('/admin/getUserWithoutAdmin', authMiddleware, adminController.getUserWithoutAdmin)
router.get('/admin/getAllDentistes', authMiddleware, adminController.getAllDentistes)
router.get('/admin/getAllActes', authMiddleware, adminController.getAllActes)
router.post('/admin/createActe', authMiddleware, createActeAdminValidator, adminController.createActe)
router.post('/admin/createAccount', authMiddleware, createAccountValidator, adminController.createAccount)
router.put("/admin/updateUser/:id", authMiddleware, updateUserValidator, adminController.updateUser);
router.put("/admin/updateActe/:acteId", authMiddleware, createActeAdminValidator, adminController.updateActe);
router.delete("/admin/deleteActe/:acteId", authMiddleware, adminController.deleteActe);

module.exports = router 