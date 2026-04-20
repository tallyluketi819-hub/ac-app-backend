App({
  globalData: {
    baseUrl: 'https://ac-app-backend-production-363e.up.railway.app/api',
    token: null,
    userInfo: null
  },

  onLaunch() {
    // Try to restore token and userInfo from storage
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    if (token) {
      this.globalData.token = token;
    }
    if (userInfo) {
      this.globalData.userInfo = userInfo;
    }
  },

  setToken(token) {
    this.globalData.token = token;
    wx.setStorageSync('token', token);
  },

  getToken() {
    return this.globalData.token || wx.getStorageSync('token');
  },

  setUserInfo(userInfo) {
    this.globalData.userInfo = userInfo;
    wx.setStorageSync('userInfo', userInfo);
  },

  getUserInfo() {
    return this.globalData.userInfo || wx.getStorageSync('userInfo');
  },

  clearAuth() {
    this.globalData.token = null;
    this.globalData.userInfo = null;
    wx.removeStorageSync('token');
    wx.removeStorageSync('userInfo');
  }
});
