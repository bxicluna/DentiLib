const express = require('express')
const router = express.Router()
const worksheetController = require('../controllers/worksheetController')
const authMiddleware = require('../middlewares/authMiddlerware')

router.post('/createWorsheet', authMiddleware, worksheetController.createWorksheet)

module.exports = router