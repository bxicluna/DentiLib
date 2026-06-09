const express = require('express')
const router = express.Router()
const actesController = require('../controllers/actesController')
const authMiddleware = require('../middlewares/authMiddleware')
const { addActeValidator, updateActePriceValidator } = require('../middlewares/validators')

router.post('/addActe', authMiddleware, addActeValidator, actesController.addActe)
router.put('/updateActe/:acteId', authMiddleware, updateActePriceValidator, actesController.updateActePrice)
router.delete('/deleteActe/:acteId', authMiddleware, actesController.deleteActe)
router.get('/getMyActes', authMiddleware, actesController.getMyActes)
router.get('/getProthesisteActes/:prothesisteId', authMiddleware, actesController.getProthesisteActes)

module.exports = router