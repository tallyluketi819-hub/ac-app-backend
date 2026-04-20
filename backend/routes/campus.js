const express = require('express');
const router = express.Router();
const campusController = require('../controllers/campusController');
const authMiddleware = require('../middleware/auth');

// All campus routes are protected
router.use(authMiddleware);

router.get('/stats', campusController.getSchoolStats);
router.get('/comparison', campusController.getComparison);

module.exports = router;
