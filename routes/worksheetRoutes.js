const express = require('express')
const router = express.Router()
const worksheetController = require('../controllers/worksheetController')
const authMiddleware = require('../middlewares/authMiddleware')
const { createWorksheetValidator, updateWorksheetValidator, updateStatusValidator } = require('../middlewares/validators')

router.post('/createWorksheet', authMiddleware, createWorksheetValidator, worksheetController.createWorksheet)
router.get('/getWorksheetByUser', authMiddleware, worksheetController.getWorksheetByUser)
router.get('/getWorksheetById/:id', authMiddleware, worksheetController.getWorksheetById)
router.delete('/deleteWorksheet/:id', authMiddleware, worksheetController.deleteWorksheet)
router.put('/updateWorksheet/:id', authMiddleware, updateWorksheetValidator, worksheetController.updateWorksheet)
router.put('/updateStatus/:id', authMiddleware, updateStatusValidator, worksheetController.updateStatus)

module.exports = router