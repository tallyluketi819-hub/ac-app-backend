const express = require('express');
const router = express.Router();
const billController = require('../controllers/billController');
const authMiddleware = require('../middleware/auth');

// All bill routes are protected
router.use(authMiddleware);

router.post('/', billController.addBill);
router.get('/', billController.getBills);
router.get('/stats', billController.getStats);
router.get('/trend', billController.getTrend);
router.put('/:id', billController.updateBill);
router.delete('/:id', billController.deleteBill);

module.exports = router;
