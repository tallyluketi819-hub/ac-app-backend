const express = require('express');
const router = express.Router();
const wallController = require('../controllers/wallController');
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');

router.get('/:userId', optionalAuth, wallController.getWall);
router.post('/:userId', optionalAuth, wallController.createWallMessage);
router.post('/:userId/:id/reply', optionalAuth, wallController.replyWallMessage);
router.delete('/:userId/:id', auth, wallController.deleteWallMessage);

module.exports = router;
