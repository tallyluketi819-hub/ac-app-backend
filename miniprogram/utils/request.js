const app = getApp();

/**
 * HTTP request wrapper for WeChat Mini Program
 * - Automatically attaches Authorization header with JWT token
 * - Returns a Promise
 * - Handles 401 by redirecting to login page
 */
function request(options) {
  const { url, method = 'GET', data = {}, header = {} } = options;

  const baseUrl = app.globalData.baseUrl;
  const token = app.getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...header
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${baseUrl}${url}`,
      method,
      data,
      header: headers,
      success(res) {
        if (res.statusCode === 401) {
          // Token expired or invalid, redirect to login
          app.clearAuth();
          wx.reLaunch({
            url: '/pages/login/login'
          });
          reject(new Error('认证失败，请重新登录'));
          return;
        }

        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          reject(res.data || { message: '请求失败' });
        }
      },
      fail(err) {
        console.error('Request failed:', err);
        reject({ message: '网络连接失败，请检查网络' });
      }
    });
  });
}

// Convenience methods
const http = {
  get(url, data) {
    return request({ url, method: 'GET', data });
  },
  post(url, data) {
    return request({ url, method: 'POST', data });
  },
  put(url, data) {
    return request({ url, method: 'PUT', data });
  },
  delete(url) {
    return request({ url, method: 'DELETE' });
  }
};

module.exports = http;
