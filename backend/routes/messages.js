const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');

router.get('/', optionalAuth, messageController.getMessages);
router.post('/', optionalAuth, messageController.createMessage);
router.post('/:id/reply', optionalAuth, messageController.replyMessage);
router.delete('/:id', auth, messageController.deleteMessage);

module.exports = router;
