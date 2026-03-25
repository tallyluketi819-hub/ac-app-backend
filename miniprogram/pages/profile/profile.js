const http = require('../../utils/request');
const { formatAmount, getCurrentMonth } = require('../../utils/util');
const app = getApp();

Page({
  data: {
    userInfo: null,
    totalBills: 0,
    thisMonthExpense: '0.00',
    loading: false,
    editing: false,
    editName: '',
    editSchool: '',
    editGrade: '大一',
    editGradeIndex: 0,
    gradeOptions: ['大一', '大二', '大三', '大四', '研究生'],
    saving: false
  },

  onLoad() {
    this.loadProfile();
  },

  onShow() {
    this.loadProfile();
  },

  async loadProfile() {
    this.setData({ loading: true });
    try {
      // Load user info
      const profileRes = await http.get('/auth/profile');
      if (profileRes.success) {
        const userInfo = profileRes.data.user;
        app.setUserInfo(userInfo);
        this.setData({ userInfo });
      }

      // Load this month bills count and expense
      const currentMonth = getCurrentMonth();
      const statsRes = await http.get('/bills/stats', { month: currentMonth });
      if (statsRes.success) {
        const { total_expense } = statsRes.data;
        this.setData({ thisMonthExpense: formatAmount(total_expense) });
      }

      // Load total bills count
      const billsRes = await http.get('/bills');
      if (billsRes.success) {
        this.setData({ totalBills: billsRes.data.bills.length });
      }
    } catch (err) {
      console.error('Load profile error:', err);
    } finally {
      this.setData({ loading: false });
    }
  },

  startEdit() {
    const { userInfo, gradeOptions } = this.data;
    const gradeIndex = gradeOptions.indexOf(userInfo.grade) >= 0
      ? gradeOptions.indexOf(userInfo.grade)
      : 0;

    this.setData({
      editing: true,
      editName: userInfo.name,
      editSchool: userInfo.school || '',
      editGrade: userInfo.grade || '大一',
      editGradeIndex: gradeIndex
    });
  },

  cancelEdit() {
    this.setData({ editing: false });
  },

  onEditNameInput(e) {
    this.setData({ editName: e.detail.value });
  },

  onEditSchoolInput(e) {
    this.setData({ editSchool: e.detail.value });
  },

  onEditGradeChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      editGradeIndex: index,
      editGrade: this.data.gradeOptions[index]
    });
  },

  async saveProfile() {
    const { editName, editSchool, editGrade } = this.data;

    if (!editName.trim()) {
      wx.showToast({ title: '姓名不能为空', icon: 'none' });
      return;
    }

    this.setData({ saving: true });

    try {
      const res = await http.put('/auth/profile', {
        name: editName.trim(),
        school: editSchool.trim(),
        grade: editGrade,
        avatar: this.data.userInfo.avatar
      });

      if (res.success) {
        app.setUserInfo(res.data.user);
        wx.showToast({ title: '保存成功', icon: 'success' });
        this.setData({ editing: false, userInfo: res.data.user });
      } else {
        wx.showToast({ title: res.message || '保存失败', icon: 'none' });
      }
    } catch (err) {
      wx.showToast({ title: err.message || '网络错误', icon: 'none' });
    } finally {
      this.setData({ saving: false });
    }
  },

  goToMyWall() {
    const user = this.data.userInfo;
    if (user) {
      wx.navigateTo({
        url: `/pages/user-wall/user-wall?targetUserId=${user.id}&targetUserName=${user.name}`
      });
    }
  },

  onLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      confirmColor: '#F44336',
      success: (res) => {
        if (res.confirm) {
          app.clearAuth();
          wx.reLaunch({ url: '/pages/login/login' });
        }
      }
    });
  }
});
