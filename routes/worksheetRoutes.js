const express = require('express')
const router = express.Router()
const worksheetController = require('../controllers/worksheetController')
const authMiddleware = require('../middlewares/authMiddlerware')

router.post('/createWorksheet', authMiddleware, worksheetController.createWorksheet)
router.get('/getWorksheetByUser', authMiddleware, worksheetController.getWorksheetByUser)
router.get('/getWorksheetById/:id', authMiddleware, worksheetController.getWorksheetById)
router.delete('/deleteWorksheet/:id', authMiddleware, worksheetController.deleteWorksheet)
router.put('/updateWorksheet/:id', authMiddleware, worksheetController.updateWorksheet)

module.exports = router