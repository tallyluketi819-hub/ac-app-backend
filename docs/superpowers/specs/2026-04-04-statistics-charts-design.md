# 统计分析页可视化增强 — 设计文档

**日期：** 2026-04-04  
**状态：** 已批准

---

## 目标

在现有统计分析页面内，不新增 Tab，通过滚动方式增加三种可视化图表：饼图、每日支出柱状图、近6个月趋势折线图。

---

## 页面结构

```
月份导航（不变）
收入 / 支出 / 结余 汇总卡片（不变）
Tab 切换：支出分析 / 收入分析（不变）
  └─ 🥧 分类饼图（新增，Canvas 绘制）
  └─ 📅 每日支出/收入柱状图（新增，Canvas 绘制）
  └─ 原有横向进度条图表（保留）
  └─ 分类明细列表（保留）
────────────── Tab 外 ──────────────
📈 近6个月收支趋势折线图（新增，Canvas，始终可见）
```

---

## 后端变更

### 新接口

**`GET /api/bills/trend`**

| 参数 | 类型 | 说明 |
|------|------|------|
| `months` | number（可选，默认6） | 返回最近 N 个月的汇总 |

响应格式：
```json
{
  "success": true,
  "data": {
    "trend": [
      { "month": "2025-11", "total_income": 1200.00, "total_expense": 980.00 },
      { "month": "2026-04", "total_income": 500.00,  "total_expense": 320.00 }
    ]
  }
}
```

数据按月份升序排列，供折线图从左到右绘制。仅返回有账单记录的月份，缺失月份由前端补零。

### 新增 SQL 查询（`Bill.getTrend`）

```sql
SELECT
  DATE_FORMAT(date, '%Y-%m') AS month,
  SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS total_income,
  SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expense
FROM bills
WHERE user_id = ?
  AND date >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL (? - 1) MONTH), '%Y-%m-01')
GROUP BY month
ORDER BY month ASC
```

注意：使用 `INTERVAL (? - 1) MONTH` 确保返回恰好 N 个自然月（含当前月），避免多返回一个月。

### 改动文件

| 文件 | 改动 |
|------|------|
| `backend/models/Bill.js` | 新增 `getTrend(userId, months)` 方法 |
| `backend/controllers/billController.js` | 新增 `getTrend` handler |
| `backend/routes/bills.js` | 新增 `GET /trend` 路由（需鉴权） |

---

## 前端变更

### 数据请求策略

每次 `onLoad` 或月份切换时，并发请求：
1. `GET /api/bills/stats?month=...` — 分类统计（饼图数据）
2. `GET /api/bills?month=...` — 当月所有账单，前端聚合为每日数据（柱状图）

`GET /api/bills` 返回完整账单行（含 note 等字段），数据量可接受（个人用户单月通常不超过 200 条），无需额外投影优化。

趋势数据（`GET /api/bills/trend?months=6`）策略：
- **每次 `onShow` 都重新请求**，确保数据始终最新（用户在其他页面新增/删除账单后返回时自动刷新）

### 数据流

```
onLoad
  ├─ loadStats()       → /bills/stats   → 饼图 + 进度条数据
  ├─ loadDailyBills()  → /bills         → 每日柱状图数据（前端聚合）
  └─ loadTrend()       → /bills/trend   → 折线图数据，存入 this.trendData

onShow（每次页面显示）
  ├─ loadStats()       （已有，保持不变）
  ├─ loadDailyBills()  （新增，保持每日图与分类图同步）
  └─ loadTrend()       （每次都重新请求，保持趋势数据最新）

月份切换（prevMonth / nextMonth）
  ├─ loadStats()
  └─ loadDailyBills()
  （趋势图跨月，月份切换不重新请求趋势）
```

### WXML Canvas 元素

Canvas 元素**必须无条件渲染**（不能放在 `wx:if` 内），否则 `wx.createSelectorQuery` 无法找到节点。将三个 canvas 放在各自的卡片容器中，卡片容器也不加条件判断。

```xml
<!-- 饼图 canvas（放在 Tab 内，支出/收入各一个） -->
<canvas id="pieChartExpense" type="2d" style="width:300rpx;height:300rpx;"></canvas>
<canvas id="pieChartIncome"  type="2d" style="width:300rpx;height:300rpx;"></canvas>

<!-- 每日柱状图 canvas（支出/收入 Tab 各一个） -->
<canvas id="dailyBarExpense" type="2d" style="width:690rpx;height:200rpx;"></canvas>
<canvas id="dailyBarIncome"  type="2d" style="width:690rpx;height:200rpx;"></canvas>

<!-- 趋势折线图 canvas（Tab 外，始终可见） -->
<canvas id="trendChart" type="2d" style="width:690rpx;height:220rpx;"></canvas>
```

**注意：** 所有 Canvas 绘图调用必须在 `setData` 之后包裹在 `wx.nextTick()` 内执行，确保节点已挂载：

```js
this.setData({ ... }, () => {
  wx.nextTick(() => {
    this.drawPieChart();
    this.drawDailyBar();
  });
});
```

### Canvas 图表规格

#### 饼图（环形图）

- Canvas 尺寸：300×300 rpx（实际像素乘以 `wx.getSystemInfoSync().pixelRatio`）
- 绘制环形：外径 = canvas 宽/2 × 0.85，内径 = canvas 宽/2 × 0.5
- 颜色：复用现有 `getCategoryColor()`
- **单分类情况**：绘制完整圆弧（0 到 2π），颜色为该分类颜色
- **空数据情况**：绘制灰色完整圆弧（`#E0E0E0`）
- 中心文字：显示总金额

#### 每日柱状图

- Canvas 尺寸：690×200 rpx
- 横轴：当月每日（1～28/30/31），等宽柱，柱间距 2rpx
- 纵轴：最高柱占 80% canvas 高度，最低柱最少 2rpx（即使金额为0也显示占位）
- x 轴标签：仅显示 1、5、10、15、20、25、当月最后一天，避免重叠
- 支出 Tab 用红色系（`#EF5350`），收入 Tab 用绿色系（`#4CAF50`）

#### 近6个月趋势折线图

- Canvas 尺寸：690×220 rpx
- 两条折线：收入（`#4CAF50`）、支出（`#F44336`）
- **缺失月份前端补零**：生成完整的6个月数组，后端未返回的月份 `total_income` 和 `total_expense` 填 0
- **数据不足提示**：当补零后所有月份均为0时（即用户完全没有历史数据），在 canvas 中央绘制"暂无数据"文字，不绘制折线
- 纵轴：根据所有数据点最大值自动缩放
- 折线下方填充对应颜色的半透明渐变区域（alpha 0.15）
- 横轴标签：显示月份（如"11月"、"12月"），6个均匀分布

### 改动文件

| 文件 | 改动 |
|------|------|
| `miniprogram/pages/statistics/statistics.wxml` | 添加5个 `<canvas>` 元素（饼图×2、柱状图×2、折线图×1）及卡片容器 |
| `miniprogram/pages/statistics/statistics.js` | 新增 `loadDailyBills()`、`loadTrend()`、`drawPieChart()`、`drawDailyBar()`、`drawTrendChart()` 函数；更新 `onShow` 和月份切换逻辑 |
| `miniprogram/pages/statistics/statistics.wxss` | 新增 canvas 卡片容器样式、图例样式 |

---

## 不在本次范围内

- 预算目标设置（方案 D）
- 图表交互（点击扇形/柱子查看详情）
- 图表导出/分享
- 图表点击交互（点击扇形/柱子查看详情）
- 图表导出/分享
