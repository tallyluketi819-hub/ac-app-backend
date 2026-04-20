const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const authMiddleware = require('../middleware/auth');

// All group routes are protected
router.use(authMiddleware);

router.post('/', groupController.createGroup);
router.get('/', groupController.getGroups);
router.get('/:id', groupController.getGroupDetail);
router.post('/:id/members', groupController.addMember);
router.post('/:id/bills', groupController.addGroupBill);
router.put('/debts/:debtId/settle', groupController.settleDebt);

module.exports = router;
