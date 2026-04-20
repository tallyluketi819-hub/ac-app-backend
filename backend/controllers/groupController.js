const Group = require('../models/Group');
const Debt = require('../models/Debt');
const User = require('../models/User');
const { calculateGroupDebts } = require('../utils/debtCalculator');

const groupController = {
  async createGroup(req, res) {
    try {
      const { name, description } = req.body;
      const userId = req.user.id;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: '群组名称不能为空'
        });
      }

      // Create group
      const result = await Group.create({
        name,
        description: description || '',
        creator_id: userId
      });

      const groupId = result.insertId;

      // Add creator as member
      await Group.addMember(groupId, userId);

      const group = await Group.findById(groupId);
      const members = await Group.getMembers(groupId);

      return res.status(201).json({
        success: true,
        message: '群组创建成功',
        data: { group: { ...group, members } }
      });
    } catch (err) {
      console.error('Create group error:', err);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  },

  async getGroups(req, res) {
    try {
      const userId = req.user.id;
      const groups = await Group.findByUser(userId);

      // For each group, calculate user's net balance
      const groupsWithBalance = await Promise.all(groups.map(async (group) => {
        const debts = await Debt.findByGroup(group.id);
        const activeDebts = debts.filter(d => !d.is_settled);

        let netBalance = 0;
        for (const debt of activeDebts) {
          if (debt.to_user_id === userId) {
            netBalance += parseFloat(debt.amount); // Others owe you
          } else if (debt.from_user_id === userId) {
            netBalance -= parseFloat(debt.amount); // You owe others
          }
        }

        return {
          ...group,
          net_balance: Math.round(netBalance * 100) / 100
        };
      }));

      return res.json({
        success: true,
        data: { groups: groupsWithBalance }
      });
    } catch (err) {
      console.error('Get groups error:', err);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  },

  async getGroupDetail(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Check group exists
      const group = await Group.findById(id);
      if (!group) {
        return res.status(404).json({
          success: false,
          message: '群组不存在'
        });
      }

      // Check user is a member
      const isMember = await Group.isMember(id, userId);
      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: '您不是该群组成员'
        });
      }

      const members = await Group.getMembers(id);
      const bills = await Group.getGroupBills(id);
      const debts = await Debt.findByGroup(id);

      return res.json({
        success: true,
        data: {
          group,
          members,
          bills,
          debts
        }
      });
    } catch (err) {
      console.error('Get group detail error:', err);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  },

  async addMember(req, res) {
    try {
      const { id } = req.params;
      const { phone } = req.body;
      const userId = req.user.id;

      if (!phone) {
        return res.status(400).json({
          success: false,
          message: '手机号不能为空'
        });
      }

      // Check group exists
      const group = await Group.findById(id);
      if (!group) {
        return res.status(404).json({
          success: false,
          message: '群组不存在'
        });
      }

      // Check requester is a member
      const isMember = await Group.isMember(id, userId);
      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: '您不是该群组成员'
        });
      }

      // Find user to add
      const userToAdd = await User.findByPhone(phone);
      if (!userToAdd) {
        return res.status(404).json({
          success: false,
          message: '该手机号用户不存在'
        });
      }

      // Check if already member
      const alreadyMember = await Group.isMember(id, userToAdd.id);
      if (alreadyMember) {
        return res.status(400).json({
          success: false,
          message: '该用户已是群组成员'
        });
      }

      await Group.addMember(id, userToAdd.id);
      const members = await Group.getMembers(id);

      return res.json({
        success: true,
        message: '成员添加成功',
        data: { members }
      });
    } catch (err) {
      console.error('Add member error:', err);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  },

  async addGroupBill(req, res) {
    try {
      const { id } = req.params;
      const { payer_id, amount, description, participants } = req.body;
      const userId = req.user.id;

      // Validate required fields
      if (!payer_id || !amount || !participants || participants.length === 0) {
        return res.status(400).json({
          success: false,
          message: '付款人、金额和参与者不能为空'
        });
      }

      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: '金额必须大于0'
        });
      }

      // Check group exists
      const group = await Group.findById(id);
      if (!group) {
        return res.status(404).json({
          success: false,
          message: '群组不存在'
        });
      }

      // Check requester is a member
      const isMember = await Group.isMember(id, userId);
      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: '您不是该群组成员'
        });
      }

      // Add the group bill
      await Group.addGroupBill({
        group_id: id,
        payer_id,
        amount: parsedAmount,
        description: description || '',
        participants
      });

      // Recalculate all debts for this group
      const allBills = await Group.getGroupBills(id);
      const simplifiedDebts = calculateGroupDebts(allBills);

      // Delete existing unsettled debts and replace with new ones
      await Debt.deleteByGroup(id);

      if (simplifiedDebts.length > 0) {
        const debtsToCreate = simplifiedDebts.map(d => ({
          group_id: parseInt(id),
          from_user_id: d.from,
          to_user_id: d.to,
          amount: d.amount
        }));
        await Debt.bulkCreate(debtsToCreate);
      }

      const updatedDebts = await Debt.findByGroup(id);
      const bills = await Group.getGroupBills(id);

      return res.status(201).json({
        success: true,
        message: '账单添加成功',
        data: {
          bills,
          debts: updatedDebts
        }
      });
    } catch (err) {
      console.error('Add group bill error:', err);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  },

  async settleDebt(req, res) {
    try {
      const { debtId } = req.params;
      const userId = req.user.id;

      await Debt.settleDebt(debtId, userId);

      return res.json({
        success: true,
        message: '债务已结清'
      });
    } catch (err) {
      console.error('Settle debt error:', err);
      if (err.message === '债务不存在或无权操作') {
        return res.status(403).json({
          success: false,
          message: err.message
        });
      }
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
};

module.exports = groupController;
