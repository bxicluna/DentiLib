const express = require('express')
const router = express.Router()
const adminController = require('../controllers/adminController')
const authMiddleware = require('../middlewares/authMiddlerware')

router.get('/admin/getUserWithoutAdmin', authMiddleware, adminController.getUserWithoutAdmin)
router.get('/admin/getAllDentistes', authMiddleware, adminController.getAllDentistes)
router.get('/admin/getAllActes', authMiddleware, adminController.getAllActes)
router.post('/admin/createActe', authMiddleware, adminController.createActe)
router.post('/admin/createAccount', authMiddleware, adminController.createAccount)
router.put("/admin/updateUser/:id", authMiddleware, adminController.updateUser);
router.put("/admin/updateActe/:acteId", authMiddleware, adminController.updateActe);
router.delete("/admin/deleteActe/:acteId", authMiddleware, adminController.deleteActe);

module.exports = router 