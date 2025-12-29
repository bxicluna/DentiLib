const express = require('express')
const router = express.Router()
const actesController = require('../controllers/actesController')
const authMiddleware = require('../middlewares/authMiddlerware')

router.post('/addActe', authMiddleware, actesController.addActe)
router.put('/updateActe/:acteId', authMiddleware, actesController.updateActePrice)
router.delete('/deleteActe/:acteId', authMiddleware, actesController.deleteActe)
router.get('/getMyActes', authMiddleware, actesController.getMyActes)

module.exports = router