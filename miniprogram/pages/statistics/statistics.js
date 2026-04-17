const http = require('../../utils/request');
const { formatAmount, getCategoryIcon, getCategoryColor, getCurrentMonth, getPrevMonth, getNextMonth, formatMonthDisplay } = require('../../utils/util');

Page({
  data: {
    currentMonth: '',
    currentMonthDisplay: '',
    totalIncome: 0,
    totalExpense: 0,
    netBalance: 0,
    expenseCategories: [],
    incomeCategories: [],
    loading: false,
    activeTab: 'expense'
  },

  onLoad() {
    const currentMonth = getCurrentMonth();
    this.setData({
      currentMonth,
      currentMonthDisplay: formatMonthDisplay(currentMonth)
    });
    this._loadAll();
  },

  onShow() {
    this._loadAll();
  },

  async _loadAll() {
    this.setData({ loading: true });
    try {
      await Promise.all([
        this.loadStats(),
        this.loadDailyBills(),
        this.loadTrend()
      ]);
    } finally {
      this.setData({ loading: false });
    }
  },

  async loadStats() {
    try {
      const res = await http.get('/bills/stats', { month: this.data.currentMonth });
      if (!res.success) return;

      const { total_income, total_expense, net, expense_categories, income_categories } = res.data;

      const maxExpense = expense_categories.length > 0
        ? Math.max(...expense_categories.map(c => parseFloat(c.total)))
        : 1;
      const maxIncome = income_categories.length > 0
        ? Math.max(...income_categories.map(c => parseFloat(c.total)))
        : 1;

      const processedExpense = expense_categories.map(c => ({
        ...c,
        icon: getCategoryIcon(c.category),
        color: getCategoryColor(c.category),
        amountDisplay: formatAmount(c.total),
        barWidth: Math.round((parseFloat(c.total) / maxExpense) * 100)
      }));

      const processedIncome = income_categories.map(c => ({
        ...c,
        icon: getCategoryIcon(c.category),
        color: getCategoryColor(c.category),
        amountDisplay: formatAmount(c.total),
        barWidth: Math.round((parseFloat(c.total) / maxIncome) * 100)
      }));

      this.setData({
        totalIncome: formatAmount(total_income),
        totalExpense: formatAmount(total_expense),
        netBalance: formatAmount(net),
        expenseCategories: processedExpense,
        incomeCategories: processedIncome
      });

      wx.nextTick(() => {
        this.drawPieChart('pieChartExpense', processedExpense);
        this.drawPieChart('pieChartIncome', processedIncome);
      });
    } catch (err) {
      console.error('Load stats error:', err);
    }
  },

  async loadDailyBills() {
    try {
      const res = await http.get('/bills', { month: this.data.currentMonth });
      if (!res.success) return;

      const bills = res.data.bills || [];
      const expenseByDay = {};
      const incomeByDay = {};

      bills.forEach(b => {
        const day = parseInt(b.date.split('-')[2]);
        const amount = parseFloat(b.amount);
        if (b.type === 'expense') {
          expenseByDay[day] = (expenseByDay[day] || 0) + amount;
        } else {
          incomeByDay[day] = (incomeByDay[day] || 0) + amount;
        }
      });

      const [year, month] = this.data.currentMonth.split('-').map(Number);
      const daysInMonth = new Date(year, month, 0).getDate();

      const expenseData = Array.from({ length: daysInMonth }, (_, i) => expenseByDay[i + 1] || 0);
      const incomeData = Array.from({ length: daysInMonth }, (_, i) => incomeByDay[i + 1] || 0);

      this._lastExpenseDaily = expenseData;
      this._lastIncomeDaily = incomeData;

      wx.nextTick(() => {
        this.drawDailyBar('dailyBarExpense', expenseData, '#EF5350');
        this.drawDailyBar('dailyBarIncome', incomeData, '#4CAF50');
      });
    } catch (err) {
      console.error('Load daily bills error:', err);
    }
  },

  async loadTrend() {
    try {
      const res = await http.get('/bills/trend', { months: 6 });
      if (!res.success) return;

      const trendRows = res.data.trend || [];

      // Build full 6-month array with zero-fill for missing months
      const months = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        months.push(key);
      }

      const rowMap = {};
      trendRows.forEach(r => { rowMap[r.month] = r; });

      const trendData = months.map(m => ({
        month: m,
        label: `${parseInt(m.split('-')[1])}月`,
        total_income: parseFloat(rowMap[m] ? rowMap[m].total_income : 0),
        total_expense: parseFloat(rowMap[m] ? rowMap[m].total_expense : 0)
      }));

      wx.nextTick(() => {
        this.drawTrendChart('trendChart', trendData);
      });
    } catch (err) {
      console.error('Load trend error:', err);
    }
  },

  // ─── Canvas Drawing ────────────────────────────────────────────

  _getCanvas(id, callback) {
    const query = wx.createSelectorQuery().in(this);
    query.select(`#${id}`).fields({ node: true, size: true }).exec(res => {
      if (!res || !res[0] || !res[0].node) return;
      const canvas = res[0].node;
      const dpr = wx.getSystemInfoSync().pixelRatio;
      canvas.width = res[0].width * dpr;
      canvas.height = res[0].height * dpr;
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      callback(ctx, res[0].width, res[0].height);
    });
  },

  drawPieChart(id, categories) {
    this._getCanvas(id, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h / 2;
      const outerR = Math.min(w, h) / 2 * 0.85;
      const innerR = Math.min(w, h) / 2 * 0.5;

      if (!categories || categories.length === 0) {
        ctx.beginPath();
        ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
        ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
        ctx.fillStyle = '#E0E0E0';
        ctx.fill('evenodd');
        return;
      }

      const total = categories.reduce((s, c) => s + parseFloat(c.total), 0);
      let startAngle = -Math.PI / 2;

      categories.forEach(c => {
        const slice = (parseFloat(c.total) / total) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, outerR, startAngle, startAngle + slice);
        ctx.arc(cx, cy, innerR, startAngle + slice, startAngle, true);
        ctx.closePath();
        ctx.fillStyle = c.color;
        ctx.fill();
        startAngle += slice;
      });
    });
  },

  drawDailyBar(id, data, color) {
    this._getCanvas(id, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      if (!data || data.length === 0) return;

      const maxVal = Math.max(...data, 1);
      const barAreaH = h * 0.8;
      const barW = (w - 2) / data.length;
      const gap = Math.min(barW * 0.2, 3);
      const actualBarW = barW - gap;

      // x-axis labels: show day 1, 5, 10, 15, 20, 25, last
      const labelDays = new Set([1, 5, 10, 15, 20, 25, data.length]);
      ctx.fillStyle = '#BDBDBD';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';

      data.forEach((val, i) => {
        const x = i * barW + gap / 2;
        const barH = Math.max((val / maxVal) * barAreaH, 2);
        const y = barAreaH - barH;

        ctx.fillStyle = color;
        ctx.globalAlpha = val === 0 ? 0.2 : 0.85;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(x, y, actualBarW, barH, [2, 2, 0, 0]) : ctx.rect(x, y, actualBarW, barH);
        ctx.fill();

        if (labelDays.has(i + 1)) {
          ctx.globalAlpha = 1;
          ctx.fillStyle = '#BDBDBD';
          ctx.fillText(String(i + 1), x + actualBarW / 2, h - 2);
        }
      });
      ctx.globalAlpha = 1;
    });
  },

  drawTrendChart(id, trendData) {
    this._getCanvas(id, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);

      const allZero = trendData.every(d => d.total_income === 0 && d.total_expense === 0);
      if (allZero) {
        ctx.fillStyle = '#BDBDBD';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('暂无数据', w / 2, h / 2);
        return;
      }

      const padL = 40, padR = 10, padT = 10, padB = 30;
      const chartW = w - padL - padR;
      const chartH = h - padT - padB;
      const n = trendData.length;

      const maxVal = Math.max(...trendData.map(d => Math.max(d.total_income, d.total_expense)), 1);

      const xPos = i => padL + (i / (n - 1)) * chartW;
      const yPos = v => padT + chartH - (v / maxVal) * chartH;

      const drawLine = (key, strokeColor, fillColor) => {
        ctx.beginPath();
        trendData.forEach((d, i) => {
          const x = xPos(i);
          const y = yPos(d[key]);
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.stroke();

        // Fill area
        ctx.beginPath();
        trendData.forEach((d, i) => {
          const x = xPos(i);
          const y = yPos(d[key]);
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.lineTo(xPos(n - 1), padT + chartH);
        ctx.lineTo(xPos(0), padT + chartH);
        ctx.closePath();
        ctx.fillStyle = fillColor;
        ctx.fill();
      };

      drawLine('total_income', '#4CAF50', 'rgba(76,175,80,0.12)');
      drawLine('total_expense', '#F44336', 'rgba(244,67,54,0.12)');

      // Dots
      const drawDots = (key, color) => {
        trendData.forEach((d, i) => {
          ctx.beginPath();
          ctx.arc(xPos(i), yPos(d[key]), 3, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
        });
      };
      drawDots('total_income', '#4CAF50');
      drawDots('total_expense', '#F44336');

      // X-axis labels
      ctx.fillStyle = '#999';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      trendData.forEach((d, i) => {
        ctx.fillText(d.label, xPos(i), h - 4);
      });

      // Y-axis reference line
      ctx.strokeStyle = '#F0F0F0';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(padL, padT + chartH / 2);
      ctx.lineTo(w - padR, padT + chartH / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#BDBDBD';
      ctx.textAlign = 'right';
      ctx.fillText(formatAmount(maxVal / 2), padL - 4, padT + chartH / 2 + 4);
    });
  },

  // ─── Navigation ────────────────────────────────────────────────

  prevMonth() {
    const prev = getPrevMonth(this.data.currentMonth);
    this.setData({
      currentMonth: prev,
      currentMonthDisplay: formatMonthDisplay(prev)
    });
    this.setData({ loading: true });
    Promise.all([this.loadStats(), this.loadDailyBills()])
      .finally(() => this.setData({ loading: false }));
  },

  nextMonth() {
    const next = getNextMonth(this.data.currentMonth);
    const now = getCurrentMonth();
    if (next > now) {
      wx.showToast({ title: '不能查看未来账单', icon: 'none' });
      return;
    }
    this.setData({
      currentMonth: next,
      currentMonthDisplay: formatMonthDisplay(next)
    });
    this.setData({ loading: true });
    Promise.all([this.loadStats(), this.loadDailyBills()])
      .finally(() => this.setData({ loading: false }));
  },

  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab }, () => {
      wx.nextTick(() => {
        if (e.currentTarget.dataset.tab === 'expense') {
          this.drawPieChart('pieChartExpense', this.data.expenseCategories);
          this.drawDailyBar('dailyBarExpense', this._lastExpenseDaily, '#EF5350');
        } else {
          this.drawPieChart('pieChartIncome', this.data.incomeCategories);
          this.drawDailyBar('dailyBarIncome', this._lastIncomeDaily, '#4CAF50');
        }
      });
    });
  }
});
