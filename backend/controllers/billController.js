const Bill = require('../models/Bill');

const billController = {
  async addBill(req, res) {
    try {
      const { amount, type, category, note, date } = req.body;
      const userId = req.user.id;

      // Validate required fields
      if (!amount || !type || !category || !date) {
        return res.status(400).json({
          success: false,
          message: '金额、类型、分类和日期不能为空'
        });
      }

      // Validate type
      if (!['income', 'expense'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: '类型必须为 income 或 expense'
        });
      }

      // Validate amount
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: '金额必须大于0'
        });
      }

      const result = await Bill.create({
        user_id: userId,
        amount: parsedAmount,
        type,
        category,
        note: note || '',
        date
      });

      const newBill = await Bill.findById(result.insertId);

      return res.status(201).json({
        success: true,
        message: '账单添加成功',
        data: { bill: newBill }
      });
    } catch (err) {
      console.error('Add bill error:', err);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  },

  async getBills(req, res) {
    try {
      const userId = req.user.id;
      const { month } = req.query; // format: YYYY-MM

      const bills = await Bill.findByUser(userId, month || null);

      return res.json({
        success: true,
        data: { bills }
      });
    } catch (err) {
      console.error('Get bills error:', err);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  },

  async updateBill(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { amount, type, category, note, date } = req.body;

      // Check bill exists and belongs to user
      const existingBill = await Bill.findById(id);
      if (!existingBill) {
        return res.status(404).json({
          success: false,
          message: '账单不存在'
        });
      }

      if (existingBill.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: '无权修改该账单'
        });
      }

      // Validate fields
      if (!amount || !type || !category || !date) {
        return res.status(400).json({
          success: false,
          message: '金额、类型、分类和日期不能为空'
        });
      }

      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: '金额必须大于0'
        });
      }

      await Bill.update(id, { amount: parsedAmount, type, category, note, date });
      const updatedBill = await Bill.findById(id);

      return res.json({
        success: true,
        message: '账单更新成功',
        data: { bill: updatedBill }
      });
    } catch (err) {
      console.error('Update bill error:', err);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  },

  async deleteBill(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Check bill exists and belongs to user
      const existingBill = await Bill.findById(id);
      if (!existingBill) {
        return res.status(404).json({
          success: false,
          message: '账单不存在'
        });
      }

      if (existingBill.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: '无权删除该账单'
        });
      }

      await Bill.delete(id);

      return res.json({
        success: true,
        message: '账单删除成功'
      });
    } catch (err) {
      console.error('Delete bill error:', err);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  },

  async getTrend(req, res) {
    try {
      const userId = req.user.id;
      const months = Math.min(parseInt(req.query.months) || 6, 24);

      const rows = await Bill.getTrend(userId, months);

      return res.json({
        success: true,
        data: { trend: rows }
      });
    } catch (err) {
      console.error('Get trend error:', err);
      return res.status(500).json({ success: false, message: '服务器内部错误' });
    }
  },

  async getStats(req, res) {
    try {
      const userId = req.user.id;
      const { month } = req.query;

      // Default to current month if not specified
      const targetMonth = month || new Date().toISOString().slice(0, 7);

      const monthlyStats = await Bill.getMonthlyStats(userId, targetMonth);
      const categoryStats = await Bill.getCategoryStats(userId, targetMonth);

      const totalIncome = parseFloat(monthlyStats.total_income) || 0;
      const totalExpense = parseFloat(monthlyStats.total_expense) || 0;

      // Calculate percentages for expense categories
      const expenseCategories = categoryStats.filter(s => s.type === 'expense');
      const incomeCategories = categoryStats.filter(s => s.type === 'income');

      expenseCategories.forEach(cat => {
        cat.percentage = totalExpense > 0
          ? Math.round((parseFloat(cat.total) / totalExpense) * 100)
          : 0;
      });

      incomeCategories.forEach(cat => {
        cat.percentage = totalIncome > 0
          ? Math.round((parseFloat(cat.total) / totalIncome) * 100)
          : 0;
      });

      return res.json({
        success: true,
        data: {
          month: targetMonth,
          total_income: totalIncome,
          total_expense: totalExpense,
          net: totalIncome - totalExpense,
          expense_categories: expenseCategories,
          income_categories: incomeCategories
        }
      });
    } catch (err) {
      console.error('Get stats error:', err);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
};

module.exports = billController;
