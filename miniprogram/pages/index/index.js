const http = require('../../utils/request');
const { formatAmount, formatDate, getCategoryIcon, getCurrentMonth, formatMonthDisplay } = require('../../utils/util');
const app = getApp();

Page({
  data: {
    userInfo: null,
    currentMonth: '',
    currentMonthDisplay: '',
    totalIncome: 0,
    totalExpense: 0,
    netBalance: 0,
    recentBills: [],
    loading: false
  },

  onLoad() {
    const currentMonth = getCurrentMonth();
    this.setData({
      currentMonth,
      currentMonthDisplay: formatMonthDisplay(currentMonth),
      userInfo: app.getUserInfo()
    });
  },

  onShow() {
    this.loadData();
  },

  async loadData() {
    this.setData({ loading: true });
    try {
      await Promise.all([
        this.loadMonthStats(),
        this.loadRecentBills()
      ]);
    } catch (err) {
      console.error('Load data error:', err);
    } finally {
      this.setData({ loading: false });
    }
  },

  async loadMonthStats() {
    try {
      const res = await http.get('/bills/stats', { month: this.data.currentMonth });
      if (res.success) {
        const { total_income, total_expense, net } = res.data;
        this.setData({
          totalIncome: formatAmount(total_income),
          totalExpense: formatAmount(total_expense),
          netBalance: formatAmount(net)
        });
      }
    } catch (err) {
      console.error('Load stats error:', err);
    }
  },

  async loadRecentBills() {
    try {
      const res = await http.get('/bills', { month: this.data.currentMonth });
      if (res.success) {
        const bills = res.data.bills.slice(0, 10).map(bill => ({
          ...bill,
          icon: getCategoryIcon(bill.category),
          amountDisplay: formatAmount(bill.amount),
          dateDisplay: formatDate(bill.date)
        }));
        this.setData({ recentBills: bills });
      }
    } catch (err) {
      console.error('Load bills error:', err);
    }
  },

  goToAddBill() {
    wx.navigateTo({ url: '/pages/add-bill/add-bill' });
  },

  goToStatistics() {
    wx.navigateTo({ url: '/pages/statistics/statistics' });
  },

  onBillTap(e) {
    const bill = e.currentTarget.dataset.bill;
    // Could navigate to bill detail/edit page
    wx.showActionSheet({
      itemList: ['删除该账单'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.confirmDeleteBill(bill.id);
        }
      }
    });
  },

  confirmDeleteBill(billId) {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条账单吗？',
      confirmColor: '#F44336',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await http.delete(`/bills/${billId}`);
            if (result.success) {
              wx.showToast({ title: '删除成功', icon: 'success' });
              this.loadData();
            }
          } catch (err) {
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  },

  onRefresh() {
    this.loadData();
  }
});
