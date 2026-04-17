const http = require('../../utils/request');
const { formatAmount, getCurrentMonth, formatMonthDisplay, getCategoryIcon } = require('../../utils/util');
const app = getApp();

Page({
  data: {
    school: '',
    currentMonth: '',
    currentMonthDisplay: '',
    userCount: 0,
    avgMonthlyExpense: 0,
    healthScore: 0,
    healthFeedback: '',
    categoryComparison: [],
    userStats: null,
    loading: false,
    maxCategoryAmount: 1
  },

  onLoad() {
    const currentMonth = getCurrentMonth();
    this.setData({
      currentMonth,
      currentMonthDisplay: formatMonthDisplay(currentMonth)
    });
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  async loadData() {
    this.setData({ loading: true });
    try {
      const res = await http.get('/campus/comparison', { month: this.data.currentMonth });
      if (res.success) {
        const { school, user_stats, school_avg, health_score, health_feedback, category_comparison } = res.data;

        // Process category comparison for display
        const maxAmount = category_comparison.reduce((max, c) => {
          return Math.max(max, c.user_amount, c.school_avg);
        }, 1);

        const processedCategories = category_comparison.map(c => ({
          ...c,
          icon: getCategoryIcon(c.category),
          userBarWidth: Math.round((c.user_amount / maxAmount) * 100),
          schoolBarWidth: Math.round((c.school_avg / maxAmount) * 100),
          userAmountDisplay: formatAmount(c.user_amount),
          schoolAvgDisplay: formatAmount(c.school_avg)
        }));

        this.setData({
          school,
          userCount: school_avg.user_count,
          avgMonthlyExpense: formatAmount(school_avg.monthly_expense),
          healthScore: health_score,
          healthFeedback: health_feedback,
          categoryComparison: processedCategories,
          userStats: {
            total_income: formatAmount(user_stats.total_income),
            total_expense: formatAmount(user_stats.total_expense),
            net: formatAmount(user_stats.net)
          },
          maxCategoryAmount: maxAmount
        });
      }
    } catch (err) {
      if (err.message && err.message.includes('学校')) {
        wx.showToast({ title: '请先在个人资料填写学校信息', icon: 'none', duration: 2500 });
      } else {
        console.error('Campus load error:', err);
      }
    } finally {
      this.setData({ loading: false });
    }
  },

  getScoreColor() {
    const score = this.data.healthScore;
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FF9800';
    return '#F44336';
  },

  onRefresh() {
    this.loadData();
  }
});
