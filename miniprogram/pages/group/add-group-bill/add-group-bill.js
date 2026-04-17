const http = require('../../../utils/request');
const app = getApp();

Page({
  data: {
    groupId: null,
    members: [],
    amount: '',
    description: '',
    payerId: null,
    payerName: '',
    participants: [], // array of selected user ids
    perPersonAmount: '0.00',
    loading: false,
    submitting: false,
    currentUserId: null
  },

  onLoad(options) {
    const groupId = options.groupId;
    const userInfo = app.getUserInfo();
    const currentUserId = userInfo ? userInfo.id : null;

    this.setData({ groupId, currentUserId });
    this.loadGroupMembers(groupId);
  },

  async loadGroupMembers(groupId) {
    this.setData({ loading: true });
    try {
      const res = await http.get(`/groups/${groupId}`);
      if (res.success) {
        const members = res.data.members;
        // Default payer to current user
        const currentMember = members.find(m => m.id === this.data.currentUserId);
        const defaultPayerId = currentMember ? currentMember.id : (members[0] ? members[0].id : null);
        const defaultPayerName = currentMember ? currentMember.name : (members[0] ? members[0].name : '');

        // Default: all members participate
        const allParticipantIds = members.map(m => m.id);

        this.setData({
          members,
          payerId: defaultPayerId,
          payerName: defaultPayerName,
          participants: allParticipantIds
        });
      }
    } catch (err) {
      wx.showToast({ title: '加载成员失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  updatePerPerson() {
    const { amount, participants } = this.data;
    const num = parseFloat(amount);
    if (num > 0 && participants.length > 0) {
      this.setData({ perPersonAmount: (num / participants.length).toFixed(2) });
    } else {
      this.setData({ perPersonAmount: '0.00' });
    }
  },

  onAmountInput(e) {
    let val = e.detail.value;
    val = val.replace(/[^0-9.]/g, '');
    const parts = val.split('.');
    if (parts.length > 2) {
      val = parts[0] + '.' + parts.slice(1).join('');
    }
    if (parts[1] && parts[1].length > 2) {
      val = parts[0] + '.' + parts[1].slice(0, 2);
    }
    this.setData({ amount: val }, () => this.updatePerPerson());
  },

  onDescInput(e) {
    this.setData({ description: e.detail.value });
  },

  selectPayer(e) {
    const memberId = e.currentTarget.dataset.id;
    const memberName = e.currentTarget.dataset.name;
    this.setData({ payerId: memberId, payerName: memberName });
  },

  toggleParticipant(e) {
    const memberId = e.currentTarget.dataset.id;
    const participants = [...this.data.participants];
    const idx = participants.indexOf(memberId);
    if (idx >= 0) {
      // Must have at least 1 participant
      if (participants.length <= 1) {
        wx.showToast({ title: '至少需要1位参与者', icon: 'none' });
        return;
      }
      participants.splice(idx, 1);
    } else {
      participants.push(memberId);
    }
    this.setData({ participants }, () => this.updatePerPerson());
  },

  isParticipant(memberId) {
    return this.data.participants.includes(memberId);
  },

  async onSubmit() {
    const { amount, description, payerId, participants, groupId } = this.data;

    if (!amount || parseFloat(amount) <= 0) {
      wx.showToast({ title: '请输入金额', icon: 'none' });
      return;
    }

    if (!payerId) {
      wx.showToast({ title: '请选择付款人', icon: 'none' });
      return;
    }

    if (participants.length === 0) {
      wx.showToast({ title: '请选择参与者', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });

    try {
      const res = await http.post(`/groups/${groupId}/bills`, {
        payer_id: payerId,
        amount: parseFloat(amount),
        description: description.trim(),
        participants
      });

      if (res.success) {
        wx.showToast({ title: '添加成功', icon: 'success', duration: 1000 });
        setTimeout(() => {
          wx.navigateBack();
        }, 1000);
      } else {
        wx.showToast({ title: res.message || '添加失败', icon: 'none' });
      }
    } catch (err) {
      wx.showToast({ title: err.message || '网络错误', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  }
});
