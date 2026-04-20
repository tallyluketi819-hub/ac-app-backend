const http = require('../../utils/request');
const app = getApp();

Page({
  data: {
    phone: '',
    password: '',
    loading: false,
    showPassword: false,
    agreed: false
  },

  onLoad() {
    // If already logged in, go to index
    const token = app.getToken();
    if (token) {
      wx.reLaunch({ url: '/pages/index/index' });
    }
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value });
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value });
  },

  togglePassword() {
    this.setData({ showPassword: !this.data.showPassword });
  },

  onAgreeChange(e) {
    this.setData({ agreed: e.detail.value.length > 0 });
  },

  goToPrivacy() {
    wx.navigateTo({ url: '/pages/privacy/privacy' });
  },

  async onLogin() {
    const { phone, password, agreed } = this.data;

    if (!agreed) {
      wx.showToast({ title: '请先同意用户协议与隐私政策', icon: 'none' });
      return;
    }

    if (!phone) {
      wx.showToast({ title: '请输入手机号', icon: 'none' });
      return;
    }
    if (!password) {
      wx.showToast({ title: '请输入密码', icon: 'none' });
      return;
    }

    this.setData({ loading: true });

    try {
      const res = await http.post('/auth/login', { phone, password });

      if (res.success) {
        app.setToken(res.data.token);
        app.setUserInfo(res.data.user);

        wx.showToast({ title: '登录成功', icon: 'success', duration: 1000 });
        setTimeout(() => {
          wx.reLaunch({ url: '/pages/index/index' });
        }, 1000);
      } else {
        wx.showToast({ title: res.message || '登录失败', icon: 'none' });
      }
    } catch (err) {
      wx.showToast({ title: err.message || '网络错误，请重试', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  goToRegister() {
    wx.navigateTo({ url: '/pages/register/register' });
  }
});
