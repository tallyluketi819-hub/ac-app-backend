const http = require('../../../utils/request');
const { formatAmount } = require('../../../utils/util');
const app = getApp();

Page({
  data: {
    groupId: null,
    group: null,
    members: [],
    bills: [],
    debts: [],
    loading: false,
    currentUserId: null,
    showAddMemberModal: false,
    addMemberPhone: '',
    addingMember: false
  },

  onLoad(options) {
    const groupId = options.id;
    const userInfo = app.getUserInfo();
    this.setData({
      groupId,
      currentUserId: userInfo ? userInfo.id : null
    });
    this.loadGroupDetail();
  },

  onShow() {
    if (this.data.groupId) {
      this.loadGroupDetail();
    }
  },

  async loadGroupDetail() {
    this.setData({ loading: true });
    try {
      const res = await http.get(`/groups/${this.data.groupId}`);
      if (res.success) {
        const { group, members, bills, debts } = res.data;

        const processedBills = bills.map(b => ({
          ...b,
          amountDisplay: formatAmount(b.amount)
        }));

        const processedDebts = debts.map(d => ({
          ...d,
          amountDisplay: formatAmount(d.amount)
        }));

        this.setData({
          group,
          members,
          bills: processedBills,
          debts: processedDebts
        });

        wx.setNavigationBarTitle({ title: group.name });
      }
    } catch (err) {
      console.error('Load group detail error:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  goToAddBill() {
    wx.navigateTo({
      url: `/pages/group/add-group-bill/add-group-bill?groupId=${this.data.groupId}`
    });
  },

  showAddMember() {
    this.setData({ showAddMemberModal: true, addMemberPhone: '' });
  },

  hideAddMemberModal() {
    this.setData({ showAddMemberModal: false });
  },

  onAddMemberPhoneInput(e) {
    this.setData({ addMemberPhone: e.detail.value });
  },

  async confirmAddMember() {
    const { addMemberPhone, groupId } = this.data;
    if (!addMemberPhone) {
      wx.showToast({ title: '请输入手机号', icon: 'none' });
      return;
    }

    this.setData({ addingMember: true });
    try {
      const res = await http.post(`/groups/${groupId}/members`, { phone: addMemberPhone });
      if (res.success) {
        wx.showToast({ title: '添加成功', icon: 'success' });
        this.setData({ showAddMemberModal: false });
        this.loadGroupDetail();
      } else {
        wx.showToast({ title: res.message || '添加失败', icon: 'none' });
      }
    } catch (err) {
      wx.showToast({ title: err.message || '网络错误', icon: 'none' });
    } finally {
      this.setData({ addingMember: false });
    }
  },

  async settleDebt(e) {
    const debtId = e.currentTarget.dataset.id;
    const debt = this.data.debts.find(d => d.id === debtId);

    wx.showModal({
      title: '确认结清',
      content: `确认标记这笔债务为已结清？`,
      confirmColor: '#4CAF50',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await http.put(`/groups/debts/${debtId}/settle`);
            if (result.success) {
              wx.showToast({ title: '已标记结清', icon: 'success' });
              this.loadGroupDetail();
            }
          } catch (err) {
            wx.showToast({ title: '操作失败', icon: 'none' });
          }
        }
      }
    });
  }
});
