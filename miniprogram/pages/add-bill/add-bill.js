const http = require('../../utils/request');
const { formatDate } = require('../../utils/util');

Page({
  data: {
    billType: 'expense', // 'income' or 'expense'
    amount: '',
    selectedCategory: '',
    note: '',
    date: '',
    loading: false,

    expenseCategories: [
      { name: '餐饮', icon: '🍜' },
      { name: '交通', icon: '🚗' },
      { name: '娱乐', icon: '🎮' },
      { name: '学习', icon: '📚' },
      { name: '日用', icon: '🛒' },
      { name: '医疗', icon: '💊' },
      { name: '服装', icon: '👕' },
      { name: '其他', icon: '📦' }
    ],

    incomeCategories: [
      { name: '生活费', icon: '💰' },
      { name: '兼职', icon: '💼' },
      { name: '奖学金', icon: '🏆' },
      { name: '其他', icon: '💵' }
    ],

    currentCategories: []
  },

  onLoad(options) {
    const today = formatDate(new Date());
    this.setData({
      date: today,
      currentCategories: this.data.expenseCategories,
      billType: options.type || 'expense'
    });
    if (options.type) {
      this.updateCategories(options.type);
    }
  },

  switchType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ billType: type, selectedCategory: '' });
    this.updateCategories(type);
  },

  updateCategories(type) {
    const cats = type === 'income'
      ? this.data.incomeCategories
      : this.data.expenseCategories;
    this.setData({ currentCategories: cats });
  },

  selectCategory(e) {
    const name = e.currentTarget.dataset.name;
    this.setData({ selectedCategory: name });
  },

  onAmountInput(e) {
    let val = e.detail.value;
    // Only allow numbers and one decimal point
    val = val.replace(/[^0-9.]/g, '');
    const parts = val.split('.');
    if (parts.length > 2) {
      val = parts[0] + '.' + parts.slice(1).join('');
    }
    if (parts[1] && parts[1].length > 2) {
      val = parts[0] + '.' + parts[1].slice(0, 2);
    }
    this.setData({ amount: val });
  },

  onNoteInput(e) {
    this.setData({ note: e.detail.value });
  },

  onDateChange(e) {
    this.setData({ date: e.detail.value });
  },

  async onSave() {
    const { amount, billType, selectedCategory, note, date } = this.data;

    if (!amount || parseFloat(amount) <= 0) {
      wx.showToast({ title: '请输入金额', icon: 'none' });
      return;
    }

    if (!selectedCategory) {
      wx.showToast({ title: '请选择分类', icon: 'none' });
      return;
    }

    if (!date) {
      wx.showToast({ title: '请选择日期', icon: 'none' });
      return;
    }

    this.setData({ loading: true });

    try {
      const res = await http.post('/bills', {
        amount: parseFloat(amount),
        type: billType,
        category: selectedCategory,
        note: note.trim(),
        date
      });

      if (res.success) {
        wx.showToast({ title: '保存成功', icon: 'success', duration: 1000 });
        setTimeout(() => {
          wx.navigateBack();
        }, 1000);
      } else {
        wx.showToast({ title: res.message || '保存失败', icon: 'none' });
      }
    } catch (err) {
      wx.showToast({ title: err.message || '网络错误', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  }
});
