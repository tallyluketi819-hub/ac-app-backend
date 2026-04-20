# Dark Minimal UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将校园记账小程序全部页面从旧绿色亮色主题迁移到暗夜极简（Dark Minimal）UI 风格。

**Architecture:** `app.wxss` 和 `app.json` 已完成全局色彩变量和 tab 栏配置，各页面 `.wxss` 仍使用旧硬编码颜色值，需逐页替换为新 CSS 变量。`add-bill` 和 `add-group-bill` 的提交按钮需从 `<button>` 迁移到 `<view class="btn-primary">`，所有页面 `.json` 的导航栏颜色也需更新。

**Tech Stack:** 微信小程序 WXML / WXSS / JSON，CSS 变量（`var(--*)`），无外部依赖

---

## 已完成（无需处理）

- `app.wxss` — 全局色彩变量、全局组件类已完成
- `app.json` — tabBar 颜色、window 导航栏颜色已完成
- `login.wxss` / `login.wxml` — 已使用新变量，按钮已迁移为 `<view>`
- `register.wxss` / `register.wxml` — 已使用新变量，按钮已迁移为 `<view>`

---

## 文件改动一览

| 文件 | 操作 |
|------|------|
| `pages/index/index.wxss` | 全量重写 |
| `pages/index/index.wxml` | 改 hero-balance 结构 |
| `pages/index/index.json` | 更新 nav 颜色 |
| `pages/add-bill/add-bill.wxss` | 全量重写 |
| `pages/add-bill/add-bill.wxml` | `<button>` → `<view class="btn-primary">` |
| `pages/add-bill/add-bill.json` | 更新 nav 颜色 |
| `pages/statistics/statistics.wxss` | 全量重写 |
| `pages/statistics/statistics.json` | 更新 nav 颜色 |
| `pages/campus/campus.wxss` | 全量重写 |
| `pages/campus/campus.json` | 更新 nav 颜色 |
| `pages/group/group-list/group-list.wxss` | 全量重写 |
| `pages/group/group-list/group-list.json` | 更新 nav 颜色 |
| `pages/group/group-detail/group-detail.wxss` | 全量重写 |
| `pages/group/group-detail/group-detail.json` | 更新 nav 颜色 |
| `pages/group/add-group-bill/add-group-bill.wxss` | 全量重写 |
| `pages/group/add-group-bill/add-group-bill.wxml` | `<button>` → `<view class="btn-primary">` |
| `pages/group/add-group-bill/add-group-bill.json` | 更新 nav 颜色 |
| `pages/profile/profile.wxss` | 全量重写 |
| `pages/profile/profile.json` | 更新 nav 颜色 |
| `pages/message-board/message-board.wxss` | 全量重写（删除本地 btn-primary/btn-disabled） |
| `pages/message-board/message-board.json` | 更新 nav 颜色 |
| `pages/user-wall/user-wall.wxss` | 全量重写（删除本地 btn-primary/btn-disabled） |
| `pages/user-wall/user-wall.json` | 更新 nav 颜色 |

> **注意：** 纯 CSS 视觉改动没有可运行的单元测试，验证方式为微信开发者工具预览。每个 Task 完成后在开发者工具中目视验证对应页面，然后 commit。

---

## Task 1: 首页（index）

**Files:**
- Modify: `miniprogram/pages/index/index.wxss`
- Modify: `miniprogram/pages/index/index.wxml`
- Modify: `miniprogram/pages/index/index.json`

- [ ] **Step 1: 更新 index.json 导航栏颜色**

```json
{
  "navigationBarTitleText": "校园记账",
  "navigationBarBackgroundColor": "#0D0D0F",
  "navigationBarTextStyle": "white",
  "enablePullDownRefresh": true,
  "backgroundColor": "#0D0D0F"
}
```

- [ ] **Step 2: 更新 index.wxml Hero 区域结构**

将旧的 `.balance-card` 整块替换为新的 `.hero-balance` 结构（header-banner 内部）：

```xml
<!-- 替换旧 balance-card -->
<view class="hero-balance">
  <text class="hero-label">本月结余</text>
  <text class="hero-amount amount amount-hero">¥ {{netBalance}}</text>
  <view class="hero-sub-row">
    <view class="hero-sub-item">
      <text class="hero-sub-label">收入</text>
      <text class="hero-sub-amount income-text">+¥{{totalIncome}}</text>
    </view>
    <view class="hero-sub-item">
      <text class="hero-sub-label">支出</text>
      <text class="hero-sub-amount expense-text">-¥{{totalExpense}}</text>
    </view>
  </view>
</view>
```

整个 `header-banner` 改为：
```xml
<view class="header-banner">
  <view class="header-top">
    <view class="greeting">
      <text class="greeting-text">你好，{{userInfo.name || '同学'}} 👋</text>
      <text class="month-text">{{currentMonthDisplay}}</text>
    </view>
    <view class="stats-btn" bindtap="goToStatistics">
      <text class="stats-icon">📊</text>
    </view>
  </view>
  <view class="hero-balance">
    <text class="hero-label">本月结余</text>
    <text class="hero-amount amount amount-hero">¥ {{netBalance}}</text>
    <view class="hero-sub-row">
      <view class="hero-sub-item">
        <text class="hero-sub-label">收入</text>
        <text class="hero-sub-amount income-text">+¥{{totalIncome}}</text>
      </view>
      <view class="hero-sub-item">
        <text class="hero-sub-label">支出</text>
        <text class="hero-sub-amount expense-text">-¥{{totalExpense}}</text>
      </view>
    </view>
  </view>
</view>
```

- [ ] **Step 3: 重写 index.wxss**

```css
.page-container {
  min-height: 100vh;
  background: var(--bg-page);
  padding-bottom: 160rpx;
}

/* Header Banner */
.header-banner {
  background: var(--bg-card);
  padding: 60rpx 30rpx 50rpx;
  border-radius: 0 0 36rpx 36rpx;
  border-bottom: 1rpx solid var(--border-subtle);
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30rpx;
}

.greeting {
  display: flex;
  flex-direction: column;
}

.greeting-text {
  font-size: 34rpx;
  color: var(--text-primary);
  font-weight: 600;
  margin-bottom: 6rpx;
}

.month-text {
  font-size: 24rpx;
  color: var(--text-secondary);
}

.stats-btn {
  width: 72rpx;
  height: 72rpx;
  background: var(--bg-card-2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stats-icon {
  font-size: 36rpx;
}

/* Hero Balance */
.hero-balance {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx 0 10rpx;
}

.hero-label {
  font-size: 24rpx;
  color: var(--text-secondary);
  margin-bottom: 12rpx;
}

.hero-amount {
  color: var(--text-primary);
  margin-bottom: 24rpx;
}

.hero-sub-row {
  display: flex;
  flex-direction: row;
  gap: 60rpx;
}

.hero-sub-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.hero-sub-label {
  font-size: 22rpx;
  color: var(--text-secondary);
  margin-bottom: 6rpx;
}

.hero-sub-amount {
  font-size: 30rpx;
  font-weight: 600;
  font-family: 'Courier New', Courier, monospace;
}

/* Quick Actions */
.quick-actions {
  display: flex;
  flex-direction: row;
  background: var(--bg-card);
  margin: 24rpx 30rpx 0;
  border-radius: 20rpx;
  padding: 30rpx 20rpx;
  border: 1rpx solid var(--border-subtle);
}

.action-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.action-icon-wrap {
  width: 90rpx;
  height: 90rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12rpx;
}

.expense-wrap { background: rgba(255, 71, 87, 0.15); }
.income-wrap { background: rgba(0, 255, 135, 0.12); }
.stats-wrap { background: rgba(124, 110, 255, 0.15); }

.action-icon {
  font-size: 36rpx;
}

.action-text {
  font-size: 24rpx;
  color: var(--text-secondary);
}

/* Section */
.section {
  margin: 24rpx 30rpx 0;
  background: var(--bg-card);
  border-radius: 20rpx;
  padding: 30rpx;
  border: 1rpx solid var(--border-subtle);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--text-primary);
}

.section-more {
  font-size: 26rpx;
  color: var(--color-accent);
}

/* Loading */
.loading-state {
  text-align: center;
  padding: 40rpx;
}

/* Bills List */
.bills-list {
  display: flex;
  flex-direction: column;
}

.bill-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid var(--border-divider);
}

.bill-item:last-child {
  border-bottom: none;
}

.bill-icon-wrap {
  width: 80rpx;
  height: 80rpx;
  background: var(--bg-card-2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.bill-icon {
  font-size: 36rpx;
}

.bill-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.bill-category {
  font-size: 30rpx;
  color: var(--text-primary);
  font-weight: 500;
  margin-bottom: 6rpx;
}

.bill-note {
  font-size: 24rpx;
  color: var(--text-secondary);
}

.bill-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.bill-amount {
  font-size: 32rpx;
  font-weight: 600;
  font-family: 'Courier New', Courier, monospace;
  margin-bottom: 6rpx;
}

.income-text { color: var(--color-income); }
.expense-text { color: var(--color-expense); }

.bill-date {
  font-size: 22rpx;
  color: var(--text-secondary);
}

/* Empty State */
.empty-bills {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 0;
}

.empty-icon {
  font-size: 72rpx;
  margin-bottom: 20rpx;
}

/* FAB Button */
.fab-btn {
  position: fixed;
  bottom: 160rpx;
  right: 40rpx;
  width: 100rpx;
  height: 100rpx;
  background: var(--color-accent);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6rpx 24rpx var(--color-accent-glow);
  z-index: 100;
}

.fab-icon {
  font-size: 56rpx;
  color: #ffffff;
  font-weight: 300;
  line-height: 1;
}
```

- [ ] **Step 4: Commit**

```bash
git add miniprogram/pages/index/
git commit -m "feat: dark minimal redesign — index page"
```

---

## Task 2: 添加账单页（add-bill）

**Files:**
- Modify: `miniprogram/pages/add-bill/add-bill.wxss`
- Modify: `miniprogram/pages/add-bill/add-bill.wxml`
- Modify: `miniprogram/pages/add-bill/add-bill.json`

- [ ] **Step 1: 更新 add-bill.json**

```json
{
  "navigationBarTitleText": "记一笔",
  "navigationBarBackgroundColor": "#0D0D0F",
  "navigationBarTextStyle": "white"
}
```

- [ ] **Step 2: 更新 add-bill.wxml 按钮迁移**

将 `.save-section` 内的 `<button>` 替换为 `<view>`：

```xml
<!-- 旧代码 -->
<view class="save-section">
  <button
    class="btn-save {{billType === 'income' ? 'btn-income' : 'btn-expense'}}"
    bindtap="onSave"
    disabled="{{loading}}"
    loading="{{loading}}"
  >
    {{loading ? '保存中...' : '保存账单'}}
  </button>
</view>

<!-- 新代码 -->
<view class="save-section">
  <view
    class="btn-primary {{loading ? 'disabled' : ''}}"
    bindtap="onSave"
  >
    {{loading ? '保存中...' : '保存账单'}}
  </view>
</view>
```

- [ ] **Step 3: 重写 add-bill.wxss**

```css
.page-container {
  min-height: 100vh;
  background: var(--bg-page);
  padding-bottom: 40rpx;
}

/* Type Toggle */
.type-toggle {
  display: flex;
  flex-direction: row;
  background: var(--bg-card);
  padding: 16rpx 30rpx;
  border-bottom: 1rpx solid var(--border-subtle);
}

.type-btn {
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  height: 80rpx;
  border-radius: 40rpx;
  margin: 0 8rpx;
  background: var(--bg-card-2);
}

.type-icon {
  font-size: 30rpx;
  margin-right: 8rpx;
}

.type-text {
  font-size: 30rpx;
  color: var(--text-secondary);
}

.type-active .type-text {
  color: #ffffff;
  font-weight: 600;
}

.expense-active { background: var(--color-expense); }
.income-active { background: var(--color-income); }
.income-active .type-text { color: #0D0D0F; }

/* Amount Section */
.amount-section {
  padding: 50rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--bg-card);
  margin: 20rpx 30rpx 0;
  border-radius: 20rpx;
  border: 1rpx solid var(--border-subtle);
}

.amount-label {
  font-size: 26rpx;
  color: var(--text-secondary);
  margin-bottom: 20rpx;
}

.amount-input-row {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.currency-symbol {
  font-size: 52rpx;
  color: var(--text-secondary);
  margin-right: 8rpx;
  font-weight: 300;
  font-family: 'Courier New', Courier, monospace;
}

.amount-input {
  font-size: 80rpx;
  color: var(--text-primary);
  font-weight: bold;
  font-family: 'Courier New', Courier, monospace;
  min-width: 200rpx;
  max-width: 460rpx;
  text-align: center;
  height: 100rpx;
}

.amount-placeholder {
  color: var(--text-placeholder);
  font-size: 80rpx;
}

/* Section Cards */
.section-card {
  margin: 20rpx 30rpx 0;
  background: var(--bg-card);
  border-radius: 20rpx;
  padding: 30rpx;
  border: 1rpx solid var(--border-subtle);
}

.section-heading {
  font-size: 28rpx;
  color: var(--text-secondary);
  margin-bottom: 24rpx;
  display: block;
}

/* Category Grid */
.category-grid {
  display: flex;
  flex-wrap: wrap;
  margin: -8rpx;
}

.category-item {
  width: calc(25% - 16rpx);
  margin: 8rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx 10rpx;
  border-radius: 16rpx;
  background: var(--bg-card-2);
  border: 2rpx solid transparent;
}

.category-selected {
  background: var(--color-accent);
  border-color: var(--color-accent);
}

.cat-icon {
  font-size: 40rpx;
  margin-bottom: 8rpx;
}

.cat-name {
  font-size: 22rpx;
  color: var(--text-secondary);
}

.category-selected .cat-name {
  color: #FFFFFF;
  font-weight: 600;
}

/* Form Rows */
.form-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  min-height: 80rpx;
}

.form-label {
  font-size: 28rpx;
  color: var(--text-secondary);
  width: 130rpx;
  flex-shrink: 0;
}

.form-input {
  flex: 1;
  font-size: 30rpx;
  color: var(--text-primary);
  height: 72rpx;
  padding: 0 10rpx;
  background: transparent;
}

.input-placeholder {
  color: var(--text-placeholder);
  font-size: 28rpx;
}

.divider-thin {
  height: 1rpx;
  background: var(--border-divider);
  margin: 4rpx 0;
}

.date-picker-val {
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 0 10rpx;
  height: 72rpx;
}

.date-text {
  font-size: 30rpx;
  color: var(--text-primary);
}

.date-arrow {
  font-size: 32rpx;
  color: var(--text-secondary);
}

/* Save Button */
.save-section {
  padding: 40rpx 30rpx;
}
```

- [ ] **Step 4: Commit**

```bash
git add miniprogram/pages/add-bill/
git commit -m "feat: dark minimal redesign — add-bill page"
```

---

## Task 3: 统计页（statistics）

**Files:**
- Modify: `miniprogram/pages/statistics/statistics.wxss`
- Modify: `miniprogram/pages/statistics/statistics.json`

- [ ] **Step 1: 更新 statistics.json**

```json
{
  "navigationBarTitleText": "统计分析",
  "navigationBarBackgroundColor": "#0D0D0F",
  "navigationBarTextStyle": "white"
}
```

- [ ] **Step 2: 重写 statistics.wxss**

```css
.page-container {
  min-height: 100vh;
  background: var(--bg-page);
  padding-bottom: 40rpx;
}

/* Month Navigator */
.month-nav {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  background: var(--bg-card);
  padding: 24rpx 0;
  border-bottom: 1rpx solid var(--border-subtle);
}

.month-arrow {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.arrow-text {
  font-size: 52rpx;
  color: var(--color-accent);
  font-weight: 300;
}

.month-label {
  font-size: 34rpx;
  font-weight: 600;
  color: var(--text-primary);
  min-width: 200rpx;
  text-align: center;
}

/* Summary Section */
.summary-section {
  display: flex;
  flex-direction: row;
  margin: 24rpx 30rpx 0;
  gap: 16rpx;
}

.summary-card {
  flex: 1;
  background: var(--bg-card);
  border-radius: 16rpx;
  padding: 24rpx 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1rpx solid var(--border-subtle);
}

.summary-label {
  font-size: 22rpx;
  color: var(--text-secondary);
  margin-bottom: 10rpx;
}

.summary-amount {
  font-size: 30rpx;
  font-weight: bold;
  font-family: 'Courier New', Courier, monospace;
}

.income-color { color: var(--color-income); }
.expense-color { color: var(--color-expense); }
.net-color { color: var(--text-primary); }

/* Tab Switch */
.tab-switch {
  display: flex;
  flex-direction: row;
  background: var(--bg-card);
  margin: 20rpx 30rpx 0;
  border-radius: 16rpx;
  padding: 8rpx;
  border: 1rpx solid var(--border-subtle);
}

.tab-item {
  flex: 1;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12rpx;
}

.tab-active {
  background: var(--color-accent);
}

.tab-text {
  font-size: 28rpx;
  color: var(--text-secondary);
}

.tab-active .tab-text {
  color: #ffffff;
  font-weight: 600;
}

/* Categories Section */
.categories-section {
  margin-top: 20rpx;
}

/* Chart Card */
.chart-card {
  margin: 0 30rpx 20rpx;
  background: var(--bg-card);
  border-radius: 20rpx;
  padding: 30rpx;
  border: 1rpx solid var(--border-subtle);
}

.chart-title {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 24rpx;
  display: block;
}

.chart-bar-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 20rpx;
}

.bar-category {
  font-size: 24rpx;
  color: var(--text-secondary);
  width: 130rpx;
  flex-shrink: 0;
}

.bar-track {
  flex: 1;
  height: 24rpx;
  background: var(--bg-card-2);
  border-radius: 12rpx;
  overflow: hidden;
  margin: 0 16rpx;
}

.bar-fill {
  height: 100%;
  border-radius: 12rpx;
  min-width: 4rpx;
}

.bar-percent {
  font-size: 22rpx;
  color: var(--text-secondary);
  width: 60rpx;
  text-align: right;
  flex-shrink: 0;
}

/* Category List Card */
.category-list-card {
  margin: 0 30rpx;
  background: var(--bg-card);
  border-radius: 20rpx;
  padding: 30rpx;
  border: 1rpx solid var(--border-subtle);
}

.list-title {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 24rpx;
  display: block;
}

.category-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 0;
  border-bottom: 1rpx solid var(--border-divider);
}

.category-row:last-child {
  border-bottom: none;
}

.cat-left {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.cat-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  margin-right: 12rpx;
}

.cat-icon-sm {
  font-size: 32rpx;
  margin-right: 10rpx;
}

.cat-name-sm {
  font-size: 28rpx;
  color: var(--text-primary);
}

.cat-right {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.cat-amount {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--text-primary);
  font-family: 'Courier New', Courier, monospace;
  margin-right: 16rpx;
}

.cat-percent {
  font-size: 22rpx;
  color: var(--text-secondary);
  background: var(--bg-card-2);
  padding: 4rpx 10rpx;
  border-radius: 8rpx;
}

/* Pie Chart */
.pie-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.pie-legend {
  flex: 1;
  margin-left: 24rpx;
}

.legend-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 14rpx;
}

.legend-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  margin-right: 10rpx;
  flex-shrink: 0;
}

.legend-name {
  font-size: 22rpx;
  color: var(--text-secondary);
  flex: 1;
}

.legend-pct {
  font-size: 22rpx;
  color: var(--text-secondary);
  margin-left: 8rpx;
}

/* Trend Chart */
.trend-card {
  margin-top: 20rpx;
}

.trend-legend {
  display: flex;
  flex-direction: row;
  gap: 24rpx;
  margin-bottom: 16rpx;
}

.trend-legend-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8rpx;
}

.trend-dot {
  width: 20rpx;
  height: 6rpx;
  border-radius: 3rpx;
}

.income-bg { background: var(--color-income); }
.expense-bg { background: var(--color-expense); }

.trend-legend-text {
  font-size: 22rpx;
  color: var(--text-secondary);
}

/* Loading/Empty */
.loading-state {
  text-align: center;
  padding: 80rpx 40rpx;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100rpx 40rpx;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 24rpx;
}

.empty-text {
  font-size: 28rpx;
  color: var(--text-secondary);
}
```

- [ ] **Step 3: Commit**

```bash
git add miniprogram/pages/statistics/
git commit -m "feat: dark minimal redesign — statistics page"
```

---

## Task 4: 校园页（campus）

**Files:**
- Modify: `miniprogram/pages/campus/campus.wxss`
- Modify: `miniprogram/pages/campus/campus.json`

- [ ] **Step 1: 更新 campus.json**

```json
{
  "navigationBarTitleText": "校园消费",
  "navigationBarBackgroundColor": "#0D0D0F",
  "navigationBarTextStyle": "white"
}
```

- [ ] **Step 2: 重写 campus.wxss**

```css
.page-container {
  min-height: 100vh;
  background: var(--bg-page);
  padding-bottom: 160rpx;
}

/* School Header */
.school-header {
  background: var(--bg-card);
  padding: 50rpx 30rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
  border-bottom: 1rpx solid var(--border-subtle);
}

.school-icon-wrap {
  width: 100rpx;
  height: 100rpx;
  background: var(--bg-card-2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
  flex-shrink: 0;
}

.school-icon {
  font-size: 50rpx;
}

.school-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.school-name {
  font-size: 34rpx;
  font-weight: bold;
  color: var(--text-primary);
  margin-bottom: 8rpx;
}

.school-sub {
  font-size: 24rpx;
  color: var(--text-secondary);
}

.refresh-btn {
  width: 70rpx;
  height: 70rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.refresh-icon {
  font-size: 40rpx;
}

/* Loading */
.loading-state {
  text-align: center;
  padding: 100rpx 40rpx;
}

/* Stats Row */
.stats-row {
  display: flex;
  flex-direction: row;
  padding: 24rpx 30rpx 0;
  gap: 20rpx;
}

.stat-card {
  flex: 1;
  background: var(--bg-card);
  border-radius: 20rpx;
  padding: 30rpx 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1rpx solid var(--border-subtle);
}

.stat-icon-big {
  font-size: 48rpx;
  margin-bottom: 12rpx;
}

.stat-value {
  font-size: 32rpx;
  font-weight: bold;
  color: var(--text-primary);
  font-family: 'Courier New', Courier, monospace;
  margin-bottom: 6rpx;
}

.stat-label {
  font-size: 22rpx;
  color: var(--text-secondary);
}

/* My Stats Card */
.my-stats-card {
  margin: 20rpx 30rpx 0;
  background: var(--bg-card);
  border-radius: 20rpx;
  padding: 30rpx;
  border: 1rpx solid var(--border-subtle);
}

.card-title {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 24rpx;
  display: block;
}

.my-stats-row {
  display: flex;
  flex-direction: row;
}

.my-stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.my-stat-label {
  font-size: 22rpx;
  color: var(--text-secondary);
  margin-bottom: 8rpx;
}

.my-stat-value {
  font-size: 30rpx;
  font-weight: bold;
  font-family: 'Courier New', Courier, monospace;
}

.income-color { color: var(--color-income); }
.expense-color { color: var(--color-expense); }

/* Health Card */
.health-card {
  margin: 20rpx 30rpx 0;
  background: var(--bg-card);
  border-radius: 20rpx;
  padding: 30rpx;
  border: 1rpx solid var(--border-subtle);
}

.health-score-area {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.score-circle {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: var(--bg-card-2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-right: 30rpx;
  flex-shrink: 0;
  border: 6rpx solid var(--color-income);
}

.score-good { border-color: var(--color-income); }
.score-ok { border-color: #FF9800; }
.score-bad { border-color: var(--color-expense); }

.score-number {
  font-size: 44rpx;
  font-weight: bold;
  color: var(--color-income);
  line-height: 1;
  font-family: 'Courier New', Courier, monospace;
}

.score-ok .score-number { color: #FF9800; }
.score-bad .score-number { color: var(--color-expense); }

.score-unit {
  font-size: 20rpx;
  color: var(--text-secondary);
}

.score-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.score-label {
  font-size: 24rpx;
  color: var(--text-secondary);
  margin-bottom: 8rpx;
}

.score-feedback {
  font-size: 26rpx;
  color: var(--text-primary);
  line-height: 1.5;
  margin-bottom: 16rpx;
}

.score-bar-track {
  height: 12rpx;
  background: var(--bg-card-2);
  border-radius: 6rpx;
  overflow: hidden;
}

.score-bar-fill {
  height: 100%;
  border-radius: 6rpx;
}

.bar-good { background: var(--color-income); }
.bar-ok { background: #FF9800; }
.bar-bad { background: var(--color-expense); }

/* Comparison Card */
.comparison-card {
  margin: 20rpx 30rpx 0;
  background: var(--bg-card);
  border-radius: 20rpx;
  padding: 30rpx;
  border: 1rpx solid var(--border-subtle);
}

.legend-row {
  display: flex;
  flex-direction: row;
  margin-bottom: 20rpx;
}

.legend-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-right: 30rpx;
}

.legend-dot {
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  margin-right: 8rpx;
}

.my-dot { background: var(--color-accent); }
.school-dot { background: var(--text-secondary); }

.legend-text {
  font-size: 24rpx;
  color: var(--text-secondary);
}

.compare-item {
  padding: 20rpx 0;
  border-bottom: 1rpx solid var(--border-divider);
}

.compare-item:last-child {
  border-bottom: none;
}

.compare-head {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.compare-cat {
  font-size: 26rpx;
  color: var(--text-secondary);
}

.compare-amounts {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.my-amount {
  font-size: 24rpx;
  color: var(--color-accent);
  font-weight: 600;
}

.vs-text {
  font-size: 20rpx;
  color: var(--text-secondary);
  margin: 0 6rpx;
}

.school-amount {
  font-size: 24rpx;
  color: var(--text-secondary);
  font-weight: 600;
}

.bar-group {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.bar-row {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.bar-label {
  font-size: 20rpx;
  color: var(--text-secondary);
  width: 30rpx;
  flex-shrink: 0;
}

.bar-track {
  flex: 1;
  height: 16rpx;
  background: var(--bg-card-2);
  border-radius: 8rpx;
  overflow: hidden;
  margin-left: 10rpx;
}

.bar-my {
  height: 100%;
  background: var(--color-accent);
  border-radius: 8rpx;
  min-width: 4rpx;
}

.bar-school {
  height: 100%;
  background: var(--text-secondary);
  border-radius: 8rpx;
  min-width: 4rpx;
}

/* No Data */
.no-data-card {
  margin: 20rpx 30rpx 0;
  background: var(--bg-card);
  border-radius: 20rpx;
  padding: 60rpx 30rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1rpx solid var(--border-subtle);
}

.no-data-icon {
  font-size: 72rpx;
  margin-bottom: 24rpx;
}

.no-data-title {
  font-size: 32rpx;
  color: var(--text-secondary);
  font-weight: 500;
  margin-bottom: 12rpx;
}
```

- [ ] **Step 3: Commit**

```bash
git add miniprogram/pages/campus/
git commit -m "feat: dark minimal redesign — campus page"
```

---

## Task 5: 群组列表页（group-list）

**Files:**
- Modify: `miniprogram/pages/group/group-list/group-list.wxss`
- Modify: `miniprogram/pages/group/group-list/group-list.json`

- [ ] **Step 1: 更新 group-list.json**

```json
{
  "navigationBarTitleText": "分账",
  "navigationBarBackgroundColor": "#0D0D0F",
  "navigationBarTextStyle": "white"
}
```

- [ ] **Step 2: 重写 group-list.wxss**

```css
.page-container {
  min-height: 100vh;
  background: var(--bg-page);
  padding-bottom: 160rpx;
}

/* Header */
.list-header {
  background: var(--bg-card);
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
  border-bottom: 1rpx solid var(--border-subtle);
}

.header-title {
  font-size: 34rpx;
  font-weight: 600;
  color: var(--text-primary);
}

.create-btn {
  display: flex;
  flex-direction: row;
  align-items: center;
  background: var(--color-accent);
  border-radius: 30rpx;
  padding: 12rpx 24rpx;
}

.create-icon {
  font-size: 32rpx;
  color: #ffffff;
  margin-right: 6rpx;
  font-weight: 300;
}

.create-text {
  font-size: 26rpx;
  color: #ffffff;
}

/* Loading */
.loading-state {
  text-align: center;
  padding: 80rpx 40rpx;
}

/* Groups List */
.groups-list {
  padding: 20rpx 30rpx;
}

.group-card {
  background: var(--bg-card);
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
  border: 1rpx solid var(--border-subtle);
}

.group-avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
  flex-shrink: 0;
}

.avatar-text {
  font-size: 40rpx;
  color: #ffffff;
  font-weight: bold;
}

.group-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.group-name {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8rpx;
}

.group-meta {
  font-size: 24rpx;
  color: var(--text-secondary);
}

.group-balance {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
}

.balance-owed {
  font-size: 30rpx;
  font-weight: bold;
  color: var(--color-income);
  font-family: 'Courier New', Courier, monospace;
}

.balance-owe {
  font-size: 30rpx;
  font-weight: bold;
  color: var(--color-expense);
  font-family: 'Courier New', Courier, monospace;
}

.balance-settled {
  font-size: 26rpx;
  color: var(--text-secondary);
}

.balance-hint {
  font-size: 20rpx;
  color: var(--text-secondary);
  margin-top: 4rpx;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 40rpx;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 24rpx;
}

.empty-btn {
  background: var(--color-accent);
  border-radius: 40rpx;
  padding: 20rpx 60rpx;
  box-shadow: 0 8rpx 32rpx var(--color-accent-glow);
}

.empty-btn-text {
  font-size: 28rpx;
  color: #ffffff;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--bg-card);
  border-radius: 24rpx;
  padding: 40rpx;
  width: 600rpx;
  border: 1rpx solid var(--border-subtle);
}

.modal-title {
  font-size: 34rpx;
  font-weight: bold;
  color: var(--text-primary);
  margin-bottom: 32rpx;
  display: block;
  text-align: center;
}

.modal-form-item {
  margin-bottom: 24rpx;
}

.modal-label {
  font-size: 26rpx;
  color: var(--text-secondary);
  display: block;
  margin-bottom: 10rpx;
}

.modal-input {
  width: 100%;
  height: 80rpx;
  background: var(--bg-card-2);
  border: 1rpx solid var(--border-subtle);
  border-radius: 12rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  color: var(--text-primary);
}

.modal-placeholder {
  color: var(--text-placeholder);
  font-size: 26rpx;
}

.modal-actions {
  display: flex;
  flex-direction: row;
  margin-top: 32rpx;
  gap: 20rpx;
}

.modal-cancel {
  flex: 1;
  height: 80rpx;
  border: 1rpx solid var(--border-subtle);
  border-radius: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-card-2);
}

.cancel-text {
  font-size: 28rpx;
  color: var(--text-secondary);
}

.modal-confirm {
  flex: 1;
  height: 80rpx;
  background: var(--color-accent);
  border-radius: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 16rpx var(--color-accent-glow);
}

.confirm-text {
  font-size: 28rpx;
  color: #ffffff;
  font-weight: 600;
}
```

- [ ] **Step 3: Commit**

```bash
git add miniprogram/pages/group/group-list/
git commit -m "feat: dark minimal redesign — group-list page"
```

---

## Task 6: 群组详情页（group-detail）

**Files:**
- Modify: `miniprogram/pages/group/group-detail/group-detail.wxss`
- Modify: `miniprogram/pages/group/group-detail/group-detail.json`

- [ ] **Step 1: 更新 group-detail.json**

```json
{
  "navigationBarTitleText": "群组详情",
  "navigationBarBackgroundColor": "#0D0D0F",
  "navigationBarTextStyle": "white"
}
```

- [ ] **Step 2: 重写 group-detail.wxss**

```css
.page-container {
  min-height: 100vh;
  background: var(--bg-page);
  padding-bottom: 160rpx;
}

/* Loading */
.loading-state {
  text-align: center;
  padding: 120rpx 40rpx;
}

/* Group Header */
.group-header {
  background: var(--bg-card);
  padding: 50rpx 30rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
  border-bottom: 1rpx solid var(--border-subtle);
}

.group-avatar-large {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 30rpx;
  flex-shrink: 0;
}

.avatar-text-large {
  font-size: 52rpx;
  color: #ffffff;
  font-weight: bold;
}

.group-header-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.group-name-large {
  font-size: 38rpx;
  font-weight: bold;
  color: var(--text-primary);
  margin-bottom: 10rpx;
}

.group-desc {
  font-size: 24rpx;
  color: var(--text-secondary);
}

/* Section Card */
.section-card {
  margin: 20rpx 30rpx 0;
  background: var(--bg-card);
  border-radius: 20rpx;
  padding: 30rpx;
  border: 1rpx solid var(--border-subtle);
}

.section-head {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 20rpx;
  display: block;
}

.section-head .section-title {
  margin-bottom: 0;
}

.add-member-btn,
.add-bill-btn {
  display: flex;
  flex-direction: row;
  align-items: center;
  background: rgba(124, 110, 255, 0.15);
  border-radius: 20rpx;
  padding: 10rpx 20rpx;
}

.add-icon {
  font-size: 28rpx;
  color: var(--color-accent);
  margin-right: 4rpx;
}

.add-text {
  font-size: 24rpx;
  color: var(--color-accent);
}

/* Members Scroll */
.members-scroll {
  display: flex;
  flex-direction: row;
  white-space: nowrap;
}

.member-item {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  margin-right: 30rpx;
  flex-shrink: 0;
}

.member-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10rpx;
}

.member-avatar-text {
  font-size: 32rpx;
  color: #ffffff;
  font-weight: bold;
}

.member-name {
  font-size: 22rpx;
  color: var(--text-secondary);
  max-width: 80rpx;
  text-align: center;
}

/* Debt Items */
.debt-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 0;
  border-bottom: 1rpx solid var(--border-divider);
}

.debt-item:last-child {
  border-bottom: none;
}

.debt-settled {
  opacity: 0.5;
}

.debt-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.debt-arrow-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 6rpx;
}

.debt-from {
  font-size: 28rpx;
  color: var(--color-expense);
  font-weight: 500;
}

.debt-arrow {
  font-size: 24rpx;
  color: var(--text-secondary);
  margin: 0 12rpx;
}

.debt-to {
  font-size: 28rpx;
  color: var(--color-income);
  font-weight: 500;
}

.debt-amount {
  font-size: 32rpx;
  font-weight: bold;
  color: var(--text-primary);
  font-family: 'Courier New', Courier, monospace;
}

.settle-btn {
  background: var(--color-accent);
  border-radius: 20rpx;
  padding: 10rpx 24rpx;
}

.settle-text {
  font-size: 24rpx;
  color: #ffffff;
}

.settled-badge {
  background: rgba(0, 255, 135, 0.12);
  border-radius: 20rpx;
  padding: 10rpx 20rpx;
}

.settled-text {
  font-size: 22rpx;
  color: var(--color-income);
}

.empty-debt {
  text-align: center;
  padding: 30rpx 0;
}

.empty-debt-text {
  font-size: 28rpx;
  color: var(--text-secondary);
}

/* Bill Items */
.bill-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 0;
  border-bottom: 1rpx solid var(--border-divider);
}

.bill-item:last-child {
  border-bottom: none;
}

.bill-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-right: 20rpx;
}

.bill-desc {
  font-size: 30rpx;
  color: var(--text-primary);
  font-weight: 500;
  margin-bottom: 6rpx;
}

.bill-meta {
  font-size: 22rpx;
  color: var(--text-secondary);
}

.bill-amount-text {
  font-size: 32rpx;
  font-weight: bold;
  color: var(--color-expense);
  font-family: 'Courier New', Courier, monospace;
}

.empty-bills {
  text-align: center;
  padding: 30rpx 0;
}

.empty-text {
  font-size: 26rpx;
  color: var(--text-secondary);
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--bg-card);
  border-radius: 24rpx;
  padding: 40rpx;
  width: 580rpx;
  border: 1rpx solid var(--border-subtle);
}

.modal-title {
  font-size: 34rpx;
  font-weight: bold;
  color: var(--text-primary);
  display: block;
  text-align: center;
  margin-bottom: 12rpx;
}

.modal-hint {
  font-size: 24rpx;
  color: var(--text-secondary);
  display: block;
  text-align: center;
  margin-bottom: 30rpx;
}

.modal-input {
  width: 100%;
  height: 80rpx;
  background: var(--bg-card-2);
  border: 1rpx solid var(--border-subtle);
  border-radius: 12rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  color: var(--text-primary);
  margin-bottom: 30rpx;
}

.modal-placeholder {
  color: var(--text-placeholder);
  font-size: 26rpx;
}

.modal-actions {
  display: flex;
  flex-direction: row;
  gap: 20rpx;
}

.modal-cancel {
  flex: 1;
  height: 80rpx;
  border: 1rpx solid var(--border-subtle);
  border-radius: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-card-2);
}

.cancel-text {
  font-size: 28rpx;
  color: var(--text-secondary);
}

.modal-confirm {
  flex: 1;
  height: 80rpx;
  background: var(--color-accent);
  border-radius: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.confirm-text {
  font-size: 28rpx;
  color: #ffffff;
  font-weight: 600;
}
```

- [ ] **Step 3: Commit**

```bash
git add miniprogram/pages/group/group-detail/
git commit -m "feat: dark minimal redesign — group-detail page"
```

---

## Task 7: 添加群组账单页（add-group-bill）

**Files:**
- Modify: `miniprogram/pages/group/add-group-bill/add-group-bill.wxss`
- Modify: `miniprogram/pages/group/add-group-bill/add-group-bill.wxml`
- Modify: `miniprogram/pages/group/add-group-bill/add-group-bill.json`

- [ ] **Step 1: 更新 add-group-bill.json**

```json
{
  "navigationBarTitleText": "添加共同支出",
  "navigationBarBackgroundColor": "#0D0D0F",
  "navigationBarTextStyle": "white"
}
```

- [ ] **Step 2: 更新 add-group-bill.wxml 按钮迁移**

将 `.submit-section` 内的 `<button>` 替换为 `<view>`：

```xml
<!-- 旧代码 -->
<view class="submit-section">
  <button
    class="btn-submit"
    bindtap="onSubmit"
    disabled="{{submitting}}"
    loading="{{submitting}}"
  >
    {{submitting ? '提交中...' : '确认添加账单'}}
  </button>
</view>

<!-- 新代码 -->
<view class="submit-section">
  <view
    class="btn-primary {{submitting ? 'disabled' : ''}}"
    bindtap="onSubmit"
  >
    {{submitting ? '提交中...' : '确认添加账单'}}
  </view>
</view>
```

- [ ] **Step 3: 重写 add-group-bill.wxss**

```css
.page-container {
  min-height: 100vh;
  background: var(--bg-page);
  padding-bottom: 40rpx;
}

/* Loading */
.loading-state {
  text-align: center;
  padding: 120rpx 40rpx;
}

/* Amount Section */
.amount-section {
  background: var(--bg-card);
  padding: 50rpx 40rpx 60rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-bottom: 1rpx solid var(--border-subtle);
}

.amount-label {
  font-size: 26rpx;
  color: var(--text-secondary);
  margin-bottom: 24rpx;
}

.amount-input-row {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.currency-symbol {
  font-size: 52rpx;
  color: var(--text-secondary);
  margin-right: 10rpx;
  font-weight: 300;
  font-family: 'Courier New', Courier, monospace;
}

.amount-input {
  font-size: 80rpx;
  color: var(--text-primary);
  font-weight: bold;
  font-family: 'Courier New', Courier, monospace;
  min-width: 200rpx;
  max-width: 400rpx;
  text-align: center;
  height: 100rpx;
}

.amount-placeholder {
  color: var(--text-placeholder);
  font-size: 80rpx;
}

/* Section Cards */
.section-card {
  margin: 20rpx 30rpx 0;
  background: var(--bg-card);
  border-radius: 20rpx;
  padding: 30rpx;
  border: 1rpx solid var(--border-subtle);
}

.section-label {
  font-size: 28rpx;
  color: var(--text-secondary);
  margin-bottom: 20rpx;
  display: block;
}

/* Description Input */
.desc-input {
  width: 100%;
  height: 72rpx;
  font-size: 30rpx;
  color: var(--text-primary);
  border-bottom: 2rpx solid var(--border-divider);
  padding: 0 4rpx;
  background: transparent;
}

.input-placeholder {
  color: var(--text-placeholder);
  font-size: 28rpx;
}

/* Payer Grid */
.payer-grid {
  display: flex;
  flex-wrap: wrap;
  margin: -8rpx;
}

.payer-item {
  width: calc(25% - 16rpx);
  margin: 8rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16rpx 8rpx;
  border-radius: 16rpx;
  background: var(--bg-card-2);
  border: 2rpx solid transparent;
  position: relative;
}

.payer-selected {
  background: rgba(124, 110, 255, 0.2);
  border-color: var(--color-accent);
}

.payer-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10rpx;
}

.payer-avatar-text {
  font-size: 30rpx;
  color: #ffffff;
  font-weight: bold;
}

.payer-name {
  font-size: 22rpx;
  color: var(--text-secondary);
  text-align: center;
}

.payer-check {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  width: 28rpx;
  height: 28rpx;
  background: var(--color-accent);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.check-icon {
  font-size: 18rpx;
  color: #ffffff;
}

/* Participants */
.participants-head {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4rpx;
}

.participants-count {
  font-size: 26rpx;
  color: var(--color-accent);
  font-weight: 600;
}

.participant-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 0;
  border-bottom: 1rpx solid var(--border-divider);
}

.participant-row:last-of-type {
  border-bottom: none;
}

.participant-left {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.participant-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
}

.pa-text {
  font-size: 28rpx;
  color: #ffffff;
  font-weight: bold;
}

.participant-name {
  font-size: 30rpx;
  color: var(--text-primary);
}

.checkbox {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  border: 3rpx solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-card-2);
}

.checked {
  background: var(--color-accent);
  border-color: var(--color-accent);
}

.check-mark {
  font-size: 24rpx;
  color: #ffffff;
}

/* Split Hint */
.split-hint {
  margin-top: 20rpx;
  background: rgba(124, 110, 255, 0.1);
  border-radius: 12rpx;
  padding: 16rpx 20rpx;
  text-align: center;
}

.split-hint-text {
  font-size: 26rpx;
  color: var(--color-accent);
  font-weight: 500;
}

/* Submit */
.submit-section {
  padding: 40rpx 30rpx;
}
```

- [ ] **Step 4: Commit**

```bash
git add miniprogram/pages/group/add-group-bill/
git commit -m "feat: dark minimal redesign — add-group-bill page"
```

---

## Task 8: 个人中心页（profile）

**Files:**
- Modify: `miniprogram/pages/profile/profile.wxss`
- Modify: `miniprogram/pages/profile/profile.json`

- [ ] **Step 1: 更新 profile.json**

```json
{
  "navigationBarTitleText": "我的",
  "navigationBarBackgroundColor": "#0D0D0F",
  "navigationBarTextStyle": "white"
}
```

- [ ] **Step 2: 重写 profile.wxss**

```css
.page-container {
  min-height: 100vh;
  background: var(--bg-page);
  padding-bottom: 160rpx;
}

/* Loading */
.loading-state {
  text-align: center;
  padding: 120rpx 40rpx;
}

/* Profile Header */
.profile-header {
  background: var(--bg-card);
  padding: 60rpx 40rpx 70rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-bottom: 1rpx solid var(--border-subtle);
}

.avatar-container {
  margin-bottom: 20rpx;
}

.avatar-circle {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background: var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 32rpx var(--color-accent-glow);
}

.avatar-letter {
  font-size: 72rpx;
  color: #ffffff;
  font-weight: bold;
}

.user-name {
  font-size: 40rpx;
  font-weight: bold;
  color: var(--text-primary);
  margin-bottom: 20rpx;
}

.user-tags {
  display: flex;
  flex-direction: row;
  gap: 16rpx;
}

.tag {
  border-radius: 30rpx;
  padding: 10rpx 20rpx;
}

.school-tag {
  background: rgba(124, 110, 255, 0.15);
}

.grade-tag {
  background: var(--bg-card-2);
}

.tag-text {
  font-size: 22rpx;
  color: var(--text-secondary);
}

/* Stats Cards */
.stats-cards {
  margin: -32rpx 30rpx 0;
  background: var(--bg-card);
  border-radius: 20rpx;
  padding: 36rpx 20rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
  border: 1rpx solid var(--border-subtle);
}

.stats-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stats-value {
  font-size: 36rpx;
  font-weight: bold;
  color: var(--color-income);
  font-family: 'Courier New', Courier, monospace;
  margin-bottom: 8rpx;
}

.stats-label {
  font-size: 22rpx;
  color: var(--text-secondary);
}

.stats-divider {
  width: 1rpx;
  height: 60rpx;
  background: var(--border-subtle);
}

.expense-color { color: var(--color-expense); }

/* Edit Card */
.edit-card {
  margin: 24rpx 30rpx 0;
  background: var(--bg-card);
  border-radius: 20rpx;
  padding: 30rpx;
  border: 1rpx solid var(--border-subtle);
}

.card-title {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 24rpx;
  display: block;
}

.edit-form-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 20rpx 0;
}

.edit-label {
  font-size: 28rpx;
  color: var(--text-secondary);
  width: 100rpx;
  flex-shrink: 0;
}

.edit-input {
  flex: 1;
  font-size: 30rpx;
  color: var(--text-primary);
  height: 68rpx;
  padding: 0 10rpx;
  background: transparent;
}

.edit-placeholder {
  color: var(--text-placeholder);
  font-size: 28rpx;
}

.form-divider {
  height: 1rpx;
  background: var(--border-divider);
}

.grade-picker {
  flex: 1;
}

.picker-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  height: 68rpx;
  padding: 0 10rpx;
}

.picker-val {
  font-size: 30rpx;
  color: var(--text-primary);
}

.picker-arrow {
  font-size: 20rpx;
  color: var(--text-secondary);
}

.edit-actions {
  display: flex;
  flex-direction: row;
  margin-top: 30rpx;
  gap: 20rpx;
}

.edit-cancel {
  flex: 1;
  height: 80rpx;
  border: 1rpx solid var(--border-subtle);
  border-radius: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-card-2);
}

.cancel-text {
  font-size: 28rpx;
  color: var(--text-secondary);
}

.edit-save {
  flex: 1;
  height: 80rpx;
  background: var(--color-accent);
  border-radius: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 16rpx var(--color-accent-glow);
}

.save-text {
  font-size: 28rpx;
  color: #ffffff;
  font-weight: 600;
}

/* Menu Card */
.menu-card {
  margin: 24rpx 30rpx 0;
  background: var(--bg-card);
  border-radius: 20rpx;
  padding: 0 30rpx;
  border: 1rpx solid var(--border-subtle);
  overflow: hidden;
}

.menu-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 100rpx;
}

.menu-icon {
  font-size: 36rpx;
  margin-right: 20rpx;
}

.menu-text {
  flex: 1;
  font-size: 30rpx;
  color: var(--text-primary);
}

.logout-text {
  color: var(--color-expense);
}

.menu-arrow {
  font-size: 36rpx;
  color: var(--text-secondary);
}

.menu-divider {
  height: 1rpx;
  background: var(--border-divider);
}

/* Info Card */
.info-card {
  margin: 20rpx 30rpx 0;
  background: var(--bg-card);
  border-radius: 20rpx;
  padding: 0 30rpx;
  border: 1rpx solid var(--border-subtle);
}

.info-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  height: 90rpx;
}

.info-label {
  font-size: 28rpx;
  color: var(--text-secondary);
}

.info-value {
  font-size: 28rpx;
  color: var(--text-primary);
}

.info-divider {
  height: 1rpx;
  background: var(--border-divider);
}
```

- [ ] **Step 3: Commit**

```bash
git add miniprogram/pages/profile/
git commit -m "feat: dark minimal redesign — profile page"
```

---

## Task 9: 留言板页（message-board）

**Files:**
- Modify: `miniprogram/pages/message-board/message-board.wxss`
- Modify: `miniprogram/pages/message-board/message-board.json`

- [ ] **Step 1: 更新 message-board.json**

```json
{
  "navigationBarTitleText": "留言板",
  "navigationBarBackgroundColor": "#0D0D0F",
  "navigationBarTextStyle": "white",
  "enablePullDownRefresh": false
}
```

- [ ] **Step 2: 重写 message-board.wxss**

> **关键**：删除本地 `.btn-primary`（旧绿色）和 `.btn-disabled`，由全局 `app.wxss` 的 `.btn-primary.disabled` 统一处理禁用态。

```css
.page-container {
  background: var(--bg-page);
  min-height: 100vh;
  padding: 20rpx;
}

.compose-card {
  background: var(--bg-card);
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  border: 1rpx solid var(--border-subtle);
}

.message-item {
  background: var(--bg-card);
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  border: 1rpx solid var(--border-subtle);
  border-left: 4rpx solid var(--bg-card-2);
}

.message-item.is-mine {
  border-left-color: var(--color-accent);
}

.card-title {
  font-size: 30rpx;
  font-weight: bold;
  color: var(--text-primary);
  display: block;
  margin-bottom: 16rpx;
}

.form-item {
  margin-bottom: 16rpx;
}

.input {
  background: var(--bg-card-2);
  border-radius: 8rpx;
  padding: 16rpx;
  font-size: 28rpx;
  color: var(--text-primary);
  width: 100%;
  box-sizing: border-box;
  border: 1rpx solid var(--border-subtle);
}

.textarea {
  background: var(--bg-card-2);
  border-radius: 8rpx;
  padding: 16rpx;
  font-size: 28rpx;
  color: var(--text-primary);
  width: 100%;
  box-sizing: border-box;
  min-height: 120rpx;
  border: 1rpx solid var(--border-subtle);
}

.textarea-sm {
  min-height: 80rpx;
}

.char-count {
  text-align: right;
  margin: 8rpx 0;
}

.char-text {
  font-size: 24rpx;
  color: var(--text-secondary);
}

.placeholder {
  color: var(--text-placeholder);
}

.btn-sm {
  padding: 12rpx 24rpx;
  margin-top: 0;
  display: inline-block;
  height: auto;
}

.btn-text {
  color: #fff;
  font-size: 28rpx;
}

.msg-header, .reply-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}

.msg-nickname {
  font-size: 28rpx;
  font-weight: bold;
  color: var(--text-primary);
}

.msg-nickname.clickable {
  color: var(--color-accent);
}

.msg-time, .reply-time {
  font-size: 24rpx;
  color: var(--text-secondary);
}

.msg-content, .reply-content {
  font-size: 28rpx;
  color: var(--text-secondary);
  line-height: 1.6;
  display: block;
  margin-bottom: 12rpx;
}

.msg-actions {
  display: flex;
  gap: 24rpx;
  margin-top: 8rpx;
}

.action-btn {
  font-size: 26rpx;
  color: var(--color-accent);
}

.delete-btn {
  color: var(--color-expense);
}

.replies-list {
  background: var(--bg-card-2);
  border-radius: 8rpx;
  padding: 16rpx;
  margin-top: 16rpx;
}

.reply-item {
  padding: 12rpx 0;
  border-bottom: 1rpx solid var(--border-divider);
}

.reply-item:last-child {
  border-bottom: none;
}

.reply-nickname {
  font-size: 26rpx;
  font-weight: bold;
  color: var(--text-secondary);
}

.reply-compose {
  margin-top: 16rpx;
  padding: 16rpx;
  background: var(--bg-card-2);
  border-radius: 8rpx;
}

.reply-to-label {
  font-size: 26rpx;
  color: var(--color-accent);
  display: block;
  margin-bottom: 8rpx;
}

.reply-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 16rpx;
  margin-top: 12rpx;
}

.cancel-btn {
  font-size: 28rpx;
  color: var(--text-secondary);
}

.loading-state, .empty-state, .no-more {
  text-align: center;
  padding: 60rpx 0;
}

.messages-list {
  margin-top: 0;
}
```

- [ ] **Step 3: Commit**

```bash
git add miniprogram/pages/message-board/
git commit -m "feat: dark minimal redesign — message-board page"
```

---

## Task 10: 用户留言墙页（user-wall）

**Files:**
- Modify: `miniprogram/pages/user-wall/user-wall.wxss`
- Modify: `miniprogram/pages/user-wall/user-wall.json`

- [ ] **Step 1: 更新 user-wall.json**

```json
{
  "navigationBarTitleText": "留言墙",
  "navigationBarBackgroundColor": "#0D0D0F",
  "navigationBarTextStyle": "white",
  "enablePullDownRefresh": false
}
```

- [ ] **Step 2: 重写 user-wall.wxss（与 message-board 规则一致）**

```css
.page-container {
  background: var(--bg-page);
  min-height: 100vh;
  padding: 20rpx;
}

.compose-card {
  background: var(--bg-card);
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  border: 1rpx solid var(--border-subtle);
}

.message-item {
  background: var(--bg-card);
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  border: 1rpx solid var(--border-subtle);
  border-left: 4rpx solid var(--bg-card-2);
}

.message-item.is-mine {
  border-left-color: var(--color-accent);
}

.card-title {
  font-size: 30rpx;
  font-weight: bold;
  color: var(--text-primary);
  display: block;
  margin-bottom: 16rpx;
}

.form-item {
  margin-bottom: 16rpx;
}

.input {
  background: var(--bg-card-2);
  border-radius: 8rpx;
  padding: 16rpx;
  font-size: 28rpx;
  color: var(--text-primary);
  width: 100%;
  box-sizing: border-box;
  border: 1rpx solid var(--border-subtle);
}

.textarea {
  background: var(--bg-card-2);
  border-radius: 8rpx;
  padding: 16rpx;
  font-size: 28rpx;
  color: var(--text-primary);
  width: 100%;
  box-sizing: border-box;
  min-height: 120rpx;
  border: 1rpx solid var(--border-subtle);
}

.textarea-sm {
  min-height: 80rpx;
}

.char-count {
  text-align: right;
  margin: 8rpx 0;
}

.char-text {
  font-size: 24rpx;
  color: var(--text-secondary);
}

.placeholder {
  color: var(--text-placeholder);
}

.btn-sm {
  padding: 12rpx 24rpx;
  margin-top: 0;
  display: inline-block;
  height: auto;
}

.btn-text {
  color: #fff;
  font-size: 28rpx;
}

.msg-header, .reply-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}

.msg-nickname {
  font-size: 28rpx;
  font-weight: bold;
  color: var(--text-primary);
}

.msg-nickname.clickable {
  color: var(--color-accent);
}

.msg-time, .reply-time {
  font-size: 24rpx;
  color: var(--text-secondary);
}

.msg-content, .reply-content {
  font-size: 28rpx;
  color: var(--text-secondary);
  line-height: 1.6;
  display: block;
  margin-bottom: 12rpx;
}

.msg-actions {
  display: flex;
  gap: 24rpx;
  margin-top: 8rpx;
}

.action-btn {
  font-size: 26rpx;
  color: var(--color-accent);
}

.delete-btn {
  color: var(--color-expense);
}

.replies-list {
  background: var(--bg-card-2);
  border-radius: 8rpx;
  padding: 16rpx;
  margin-top: 16rpx;
}

.reply-item {
  padding: 12rpx 0;
  border-bottom: 1rpx solid var(--border-divider);
}

.reply-item:last-child {
  border-bottom: none;
}

.reply-nickname {
  font-size: 26rpx;
  font-weight: bold;
  color: var(--text-secondary);
}

.reply-compose {
  margin-top: 16rpx;
  padding: 16rpx;
  background: var(--bg-card-2);
  border-radius: 8rpx;
}

.reply-to-label {
  font-size: 26rpx;
  color: var(--color-accent);
  display: block;
  margin-bottom: 8rpx;
}

.reply-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 16rpx;
  margin-top: 12rpx;
}

.cancel-btn {
  font-size: 28rpx;
  color: var(--text-secondary);
}

.loading-state, .empty-state, .no-more {
  text-align: center;
  padding: 60rpx 0;
}

.messages-list {
  margin-top: 0;
}
```

- [ ] **Step 3: Commit**

```bash
git add miniprogram/pages/user-wall/
git commit -m "feat: dark minimal redesign — user-wall page"
```

---

## 最终验证清单

- [ ] 微信开发者工具中切换每个页面，确认背景为 `#0D0D0F`（深色）
- [ ] 首页 Hero 数字显示等宽字体，收支颜色为荧光绿/珊瑚红
- [ ] add-bill 页金额输入区无旧绿色渐变背景
- [ ] add-group-bill 页提交按钮为紫色 `var(--color-accent)`，无 native loading spinner
- [ ] message-board / user-wall 禁用态按钮 opacity 0.4，无旧 `#a5d6a7`
- [ ] 所有 tab 栏图标选中色为荧光绿 `#00FF87`，背景 `#0D0D0F`
- [ ] 所有导航栏背景为 `#0D0D0F`
