const http = require('../../../utils/request');
const { formatAmount } = require('../../../utils/util');

Page({
  data: {
    groups: [],
    loading: false,
    showCreateModal: false,
    newGroupName: '',
    newGroupDesc: '',
    creating: false
  },

  onLoad() {
    this.loadGroups();
  },

  onShow() {
    this.loadGroups();
  },

  async loadGroups() {
    this.setData({ loading: true });
    try {
      const res = await http.get('/groups');
      if (res.success) {
        const groups = res.data.groups.map(g => ({
          ...g,
          balanceDisplay: formatAmount(Math.abs(g.net_balance)),
          balanceType: g.net_balance > 0 ? 'owed' : g.net_balance < 0 ? 'owe' : 'settled'
        }));
        this.setData({ groups });
      }
    } catch (err) {
      console.error('Load groups error:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  showCreateGroup() {
    this.setData({ showCreateModal: true, newGroupName: '', newGroupDesc: '' });
  },

  hideCreateModal() {
    this.setData({ showCreateModal: false });
  },

  onGroupNameInput(e) {
    this.setData({ newGroupName: e.detail.value });
  },

  onGroupDescInput(e) {
    this.setData({ newGroupDesc: e.detail.value });
  },

  async createGroup() {
    const { newGroupName, newGroupDesc } = this.data;
    if (!newGroupName.trim()) {
      wx.showToast({ title: '请输入群组名称', icon: 'none' });
      return;
    }

    this.setData({ creating: true });
    try {
      const res = await http.post('/groups', {
        name: newGroupName.trim(),
        description: newGroupDesc.trim()
      });

      if (res.success) {
        wx.showToast({ title: '创建成功', icon: 'success' });
        this.setData({ showCreateModal: false });
        this.loadGroups();
      } else {
        wx.showToast({ title: res.message || '创建失败', icon: 'none' });
      }
    } catch (err) {
      wx.showToast({ title: err.message || '网络错误', icon: 'none' });
    } finally {
      this.setData({ creating: false });
    }
  },

  goToGroupDetail(e) {
    const groupId = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/group/group-detail/group-detail?id=${groupId}` });
  }
});
