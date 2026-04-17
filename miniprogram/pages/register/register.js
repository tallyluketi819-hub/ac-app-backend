const http = require('../../utils/request');
const app = getApp();

Page({
  data: {
    name: '',
    phone: '',
    password: '',
    school: '',
    grade: '大一',
    gradeOptions: ['大一', '大二', '大三', '大四', '研究生'],
    gradeIndex: 0,
    loading: false,
    showPassword: false
  },

  onNameInput(e) {
    this.setData({ name: e.detail.value });
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value });
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value });
  },

  onSchoolInput(e) {
    this.setData({ school: e.detail.value });
  },

  onGradeChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      gradeIndex: index,
      grade: this.data.gradeOptions[index]
    });
  },

  togglePassword() {
    this.setData({ showPassword: !this.data.showPassword });
  },

  async onRegister() {
    const { name, phone, password, school, grade } = this.data;

    if (!name.trim()) {
      wx.showToast({ title: '请输入姓名', icon: 'none' });
      return;
    }
    if (!phone) {
      wx.showToast({ title: '请输入手机号', icon: 'none' });
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({ title: '手机号格式不正确', icon: 'none' });
      return;
    }
    if (!password) {
      wx.showToast({ title: '请输入密码', icon: 'none' });
      return;
    }
    if (password.length < 6) {
      wx.showToast({ title: '密码至少需要6位', icon: 'none' });
      return;
    }

    this.setData({ loading: true });

    try {
      const res = await http.post('/auth/register', {
        name: name.trim(),
        phone,
        password,
        school: school.trim(),
        grade
      });

      if (res.success) {
        app.setToken(res.data.token);
        app.setUserInfo(res.data.user);

        wx.showToast({ title: '注册成功', icon: 'success', duration: 1000 });
        setTimeout(() => {
          wx.reLaunch({ url: '/pages/index/index' });
        }, 1000);
      } else {
        wx.showToast({ title: res.message || '注册失败', icon: 'none' });
      }
    } catch (err) {
      wx.showToast({ title: err.message || '网络错误，请重试', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  goToLogin() {
    wx.navigateBack();
  }
});
