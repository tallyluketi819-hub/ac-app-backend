const http = require('../../utils/request');
const app = getApp();

Page({
  data: {
    messages: [],
    loading: false,
    page: 1,
    hasMore: true,
    currentUserId: null,
    inputContent: '',
    inputNickname: '',
    submitting: false,
    replyingTo: null,
    replyContent: '',
    replyNickname: '',
    replySubmitting: false
  },

  onLoad() {
    const user = app.getUserInfo();
    this.setData({ currentUserId: user ? user.id : null });
    this.loadMessages(true);
  },

  onShow() {
    const user = app.getUserInfo();
    this.setData({ currentUserId: user ? user.id : null });
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMessages(false);
    }
  },

  async loadMessages(reset) {
    if (this.data.loading) return;
    const page = reset ? 1 : this.data.page;
    this.setData({ loading: true });
    try {
      const res = await http.get('/messages', { page, limit: 20 });
      if (res.success) {
        const msgs = reset ? res.data.messages : [...this.data.messages, ...res.data.messages];
        this.setData({ messages: msgs, page: page + 1, hasMore: res.data.hasMore });
      }
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  onContentInput(e) { this.setData({ inputContent: e.detail.value }); },
  onNicknameInput(e) { this.setData({ inputNickname: e.detail.value }); },

  async submitMessage() {
    const { inputContent, inputNickname } = this.data;
    const user = app.getUserInfo();
    if (!inputContent.trim()) { wx.showToast({ title: '请填写留言内容', icon: 'none' }); return; }
    if (!user && !inputNickname.trim()) { wx.showToast({ title: '请填写昵称', icon: 'none' }); return; }
    this.setData({ submitting: true });
    try {
      const body = { content: inputContent.trim() };
      if (!user) body.nickname = inputNickname.trim();
      const res = await http.post('/messages', body);
      if (res.success) {
        this.setData({ inputContent: '', inputNickname: '' });
        wx.showToast({ title: '留言成功', icon: 'success' });
        this.loadMessages(true);
      } else {
        wx.showToast({ title: res.message || '留言失败', icon: 'none' });
      }
    } catch (err) {
      wx.showToast({ title: err.message || '网络错误', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  },

  startReply(e) {
    const { id, nickname } = e.currentTarget.dataset;
    this.setData({ replyingTo: { id, nickname }, replyContent: '', replyNickname: '' });
  },

  cancelReply() { this.setData({ replyingTo: null }); },
  onReplyContentInput(e) { this.setData({ replyContent: e.detail.value }); },
  onReplyNicknameInput(e) { this.setData({ replyNickname: e.detail.value }); },

  async submitReply() {
    const { replyingTo, replyContent, replyNickname } = this.data;
    const user = app.getUserInfo();
    if (!replyContent.trim()) { wx.showToast({ title: '请填写回复内容', icon: 'none' }); return; }
    if (!user && !replyNickname.trim()) { wx.showToast({ title: '请填写昵称', icon: 'none' }); return; }
    this.setData({ replySubmitting: true });
    try {
      const body = { content: replyContent.trim() };
      if (!user) body.nickname = replyNickname.trim();
      const res = await http.post(`/messages/${replyingTo.id}/reply`, body);
      if (res.success) {
        this.setData({ replyingTo: null });
        wx.showToast({ title: '回复成功', icon: 'success' });
        this.loadMessages(true);
      } else {
        wx.showToast({ title: res.message || '回复失败', icon: 'none' });
      }
    } catch (err) {
      wx.showToast({ title: err.message || '网络错误', icon: 'none' });
    } finally {
      this.setData({ replySubmitting: false });
    }
  },

  confirmDelete(e) {
    const { id } = e.currentTarget.dataset;
    wx.showModal({
      title: '确认删除',
      content: '确定删除这条留言吗？',
      confirmColor: '#F44336',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await http.delete(`/messages/${id}`);
            if (result.success) {
              wx.showToast({ title: '删除成功', icon: 'success' });
              this.loadMessages(true);
            }
          } catch (err) {
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  },

  goToUserWall(e) {
    const { userId } = e.currentTarget.dataset;
    if (userId) {
      wx.navigateTo({ url: `/pages/user-wall/user-wall?targetUserId=${userId}` });
    }
  }
});
