const Bill = require('../models/Bill');
const User = require('../models/User');

const campusController = {
  async getSchoolStats(req, res) {
    try {
      const userId = req.user.id;
      const { month } = req.query;

      const targetMonth = month || new Date().toISOString().slice(0, 7);

      // Get user's school
      const user = await User.findById(userId);
      if (!user || !user.school) {
        return res.status(400).json({
          success: false,
          message: '请先完善个人信息（学校）'
        });
      }

      const school = user.school;

      // Get school-level stats
      const schoolStats = await Bill.getSchoolStats(school, targetMonth);
      const userCount = await Bill.getSchoolUserCount(school);

      // Compute total expense for the school in this month
      const totalSchoolExpense = schoolStats.reduce((sum, s) => sum + parseFloat(s.total_amount), 0);
      const avgMonthlyExpense = userCount > 0
        ? Math.round((totalSchoolExpense / userCount) * 100) / 100
        : 0;

      return res.json({
        success: true,
        data: {
          school,
          month: targetMonth,
          user_count: userCount,
          avg_monthly_expense: avgMonthlyExpense,
          category_stats: schoolStats.map(s => ({
            category: s.category,
            avg_amount: Math.round((parseFloat(s.avg_amount)) * 100) / 100,
            total_amount: parseFloat(s.total_amount),
            user_count: s.user_count
          }))
        }
      });
    } catch (err) {
      console.error('Get school stats error:', err);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  },

  async getComparison(req, res) {
    try {
      const userId = req.user.id;
      const { month } = req.query;

      const targetMonth = month || new Date().toISOString().slice(0, 7);

      // Get user info
      const user = await User.findById(userId);
      if (!user || !user.school) {
        return res.status(400).json({
          success: false,
          message: '请先完善个人信息（学校）'
        });
      }

      const school = user.school;

      // Get user's stats for this month
      const userMonthlyStats = await Bill.getMonthlyStats(userId, targetMonth);
      const userCategoryStats = await Bill.getCategoryStats(userId, targetMonth);

      const userTotalIncome = parseFloat(userMonthlyStats.total_income) || 0;
      const userTotalExpense = parseFloat(userMonthlyStats.total_expense) || 0;

      // Get school average stats
      const schoolStats = await Bill.getSchoolStats(school, targetMonth);
      const userCount = await Bill.getSchoolUserCount(school);

      const totalSchoolExpense = schoolStats.reduce((sum, s) => sum + parseFloat(s.total_amount), 0);
      const schoolAvgExpense = userCount > 0
        ? Math.round((totalSchoolExpense / userCount) * 100) / 100
        : 0;

      // Calculate health score (0-100)
      let healthScore = 60; // Base score

      // Deduct points if any single category exceeds 50% of total expense
      const expenseCategories = userCategoryStats.filter(s => s.type === 'expense');
      for (const cat of expenseCategories) {
        const percentage = userTotalExpense > 0
          ? (parseFloat(cat.total) / userTotalExpense)
          : 0;
        if (percentage > 0.5) {
          healthScore -= 15; // Deduct 15 points for each overweight category
        }
      }

      // Add points if savings rate > 20%
      if (userTotalIncome > 0) {
        const savingsRate = (userTotalIncome - userTotalExpense) / userTotalIncome;
        if (savingsRate > 0.2) {
          healthScore += 20;
        } else if (savingsRate > 0.1) {
          healthScore += 10;
        }
      }

      // Add points for diversified spending (more than 3 categories)
      if (expenseCategories.length >= 3) {
        healthScore += 10;
      }

      // Deduct points if spending much more than school average
      if (schoolAvgExpense > 0 && userTotalExpense > schoolAvgExpense * 1.5) {
        healthScore -= 10;
      }

      // Clamp score between 0 and 100
      healthScore = Math.max(0, Math.min(100, healthScore));

      // Determine health score feedback text
      let healthFeedback;
      if (healthScore >= 80) {
        healthFeedback = '消费结构良好，继续保持！';
      } else if (healthScore >= 60) {
        healthFeedback = '消费较为合理，还有优化空间';
      } else {
        healthFeedback = '消费结构需要调整，建议控制非必要支出';
      }

      // Build comparison data per category
      const userCategoryMap = {};
      expenseCategories.forEach(cat => {
        userCategoryMap[cat.category] = parseFloat(cat.total);
      });

      const schoolCategoryMap = {};
      schoolStats.forEach(s => {
        schoolCategoryMap[s.category] = parseFloat(s.avg_amount);
      });

      // Merge all categories
      const allCategories = [...new Set([
        ...Object.keys(userCategoryMap),
        ...Object.keys(schoolCategoryMap)
      ])];

      const categoryComparison = allCategories.map(cat => ({
        category: cat,
        user_amount: userCategoryMap[cat] || 0,
        school_avg: schoolCategoryMap[cat] || 0
      }));

      return res.json({
        success: true,
        data: {
          month: targetMonth,
          school,
          user_stats: {
            total_income: userTotalIncome,
            total_expense: userTotalExpense,
            net: userTotalIncome - userTotalExpense,
            categories: expenseCategories
          },
          school_avg: {
            monthly_expense: schoolAvgExpense,
            user_count: userCount,
            categories: schoolStats.map(s => ({
              category: s.category,
              avg_amount: parseFloat(s.avg_amount)
            }))
          },
          health_score: healthScore,
          health_feedback: healthFeedback,
          category_comparison: categoryComparison
        }
      });
    } catch (err) {
      console.error('Get comparison error:', err);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
};

module.exports = campusController;
