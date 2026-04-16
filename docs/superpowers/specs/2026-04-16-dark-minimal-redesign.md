# 校园记账 — 暗夜极简 UI 重设计规范

**日期**: 2026-04-16  
**方向**: 方案 A — Dark Minimal（暗夜极简）  
**平台**: 微信小程序（.wxml / .wxss）  
**微信基础库最低要求**: 2.14.2（支持 CSS variables + flex gap）

---

## 1. 设计原则

- **对比驱动**：深色底 + 荧光强调色，数字一目了然
- **数字为王**：金额用等宽大字，收支状态靠颜色即可识别
- **克制的层次**：通过背景色区分层级（页面 → 卡片 → 次级卡片），不依赖阴影
- **微信小程序原生**：不引入外部字体，使用系统字体 + `Courier New` 等宽

---

## 2. 色彩系统

覆盖 `app.wxss` 中所有旧 CSS 变量，统一使用以下定义：

| CSS 变量 | 色值 | 用途 |
|----------|------|------|
| `--bg-page` | `#0D0D0F` | 页面背景 |
| `--bg-card` | `#1A1A1F` | 主卡片背景 |
| `--bg-card-2` | `#22222A` | 次级卡片、输入框背景 |
| `--text-primary` | `#F0F0F0` | 主要文字 |
| `--text-secondary` | `#888899` | 次要文字、标签 |
| `--text-placeholder` | `#55556A` | 输入框占位符 |
| `--color-income` | `#00FF87` | 收入（荧光绿）|
| `--color-expense` | `#FF4757` | 支出（珊瑚红）|
| `--color-accent` | `#7C6EFF` | 主按钮、强调元素（深紫）|
| `--color-accent-glow` | `rgba(124,110,255,0.35)` | 按钮光晕阴影 |
| `--border-subtle` | `rgba(255,255,255,0.06)` | 卡片边框 |
| `--border-divider` | `rgba(255,255,255,0.04)` | 列表分割线 |

> **旧变量完整清理列表**：以下变量在 `app.wxss` 中存在，全部删除并替换为上表新值：
> `--primary`, `--primary-light`, `--primary-dark`, `--accent`, `--accent-light`,
> `--income-color`, `--expense-color`, `--text-primary`, `--text-secondary`, `--text-hint`,
> `--bg-primary`, `--bg-card`, `--border-color`, `--shadow`。
> 注意：`--bg-card`、`--text-primary`、`--text-secondary`、`--income-color`、`--expense-color` 在新系统中名称复用但色值完全不同，务必全部替换，不可保留旧值。

---

## 3. 字体系统

```css
/* 金额数字 */
.amount {
  font-family: 'Courier New', Courier, monospace;
  font-weight: 700;
}

/* 大金额（首页结余） */
.amount-hero { font-size: 72rpx; }

/* 普通金额（账单列表） */
.amount-normal { font-size: 34rpx; }

/* 中文标题 */
.title { font-weight: 600; font-size: 32rpx; color: var(--text-primary); }

/* 辅助文字 */
.subtitle { font-size: 24rpx; color: var(--text-secondary); }
```

---

## 4. 组件规范

### 4.1 页面容器

```css
.page-container {
  min-height: 100vh;
  background: var(--bg-page);
  padding-bottom: 160rpx;
}
```

> 各页面原有的 `.page-container { padding-bottom: 40rpx }` 局部覆盖一律删除，统一用全局 160rpx（含 tab 栏空间）。唯 `add-bill`、`statistics` 等无底部 tab 的页面可按需覆盖为 `40rpx`。

### 4.2 卡片

```css
.card {
  background: var(--bg-card);
  border-radius: 20rpx;
  border: 1rpx solid var(--border-subtle);
  padding: 32rpx;
}
```

### 4.3 主按钮（使用 `<view>` 而非 `<button>`，以确保 `box-shadow` 在 iOS 上正常渲染）

```css
.btn-primary {
  background: var(--color-accent);
  border-radius: 16rpx;
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFFFFF;
  font-weight: 600;
  font-size: 32rpx;
  box-shadow: 0 8rpx 32rpx var(--color-accent-glow);
}

.btn-primary.disabled {
  opacity: 0.4;
}
```

> **`<button>` → `<view>` 迁移范围**：以下页面的提交按钮需要改为 `<view class="btn-primary" bindtap="...">`:
> - `login.wxml`：`.btn-login` → `<view class="btn-primary">`
> - `register.wxml`：`.btn-register` → `<view class="btn-primary">`
> - `add-bill.wxml`：`.btn-save` → `<view class="btn-primary">`
> - `add-group-bill.wxml`：`.btn-submit` → `<view class="btn-primary">`
>
> **Loading 状态**：原 `<button loading="{{loading}}">` 的 spinner 改为文字绑定，已有模式可参考 `message-board.wxml` 中的 `{{submitting ? '发送中...' : '发送留言'}}` — 所有提交按钮统一使用此文字插值方式显示加载状态，无需恢复 native spinner。

### 4.4 输入框

输入框聚焦高亮通过 JS `focus`/`blur` 事件切换 `.input-focused` 类实现（新增 class，不修改已有逻辑）：

```css
.input-field {
  background: var(--bg-card-2);
  border-radius: 12rpx;
  padding: 28rpx 24rpx;
  color: var(--text-primary);
  font-size: 30rpx;
  border-bottom: 2rpx solid transparent;
  transition: border-color 0.2s;
}

.input-field.input-focused {
  border-bottom-color: var(--color-accent);
}
```

在 `.js` 的 `onFocus` / `onBlur` 回调中切换：
```js
onInputFocus() { this.setData({ inputFocused: true }) }
onInputBlur()  { this.setData({ inputFocused: false }) }
```

### 4.5 分类选择网格（add-bill 页）

- 4 列排列，每项：图标圆形背景 + 文字
- **未选中**：圆形背景 `var(--bg-card-2)`，文字 `var(--text-secondary)`
- **选中**：圆形背景 `var(--color-accent)`（紫），文字 `#FFFFFF`，外圈加 2rpx `var(--color-accent)` border

现有 `add-bill.wxml` 中选中类名为 `category-selected`（不是 `selected`），CSS 应对应使用同名类：

```css
.category-item { background: var(--bg-card-2); }
.category-item.category-selected { background: var(--color-accent); border: 2rpx solid var(--color-accent); }
.category-item.category-selected .category-text { color: #FFFFFF; }
```

> WXML 中已有 `{{selectedCategory === item.name ? 'category-selected' : ''}}` 绑定，无需改动 WXML。

### 4.6 进度条

```css
.bar-track {
  background: var(--bg-card-2);
  border-radius: 8rpx;
  height: 12rpx;
}
.bar-fill-income { background: var(--color-income); border-radius: 8rpx; }
.bar-fill-expense { background: var(--color-expense); border-radius: 8rpx; }
.bar-fill-accent { background: var(--color-accent); border-radius: 8rpx; }
```

### 4.7 加载状态与空状态

所有页面的 loading / empty / no-data 状态统一：

```css
.loading-text, .empty-title {
  color: var(--text-secondary);
  font-size: 28rpx;
}
.empty-sub, .no-data-sub {
  color: var(--text-placeholder);
  font-size: 24rpx;
}
/* Emoji 图标保留，仅文字颜色改变 */
```

### 4.8 Tab 栏

在 `app.json` 的 `tabBar` 配置中更新（WXSS 无法覆盖 tabBar）：

```json
"tabBar": {
  "backgroundColor": "#0D0D0F",
  "borderStyle": "black",
  "color": "#555566",
  "selectedColor": "#00FF87"
}
```

---

## 5. 导航栏配置

所有页面 `.json` 文件及 `app.json` 的 `window` 配置：

```json
{
  "navigationBarBackgroundColor": "#0D0D0F",
  "navigationBarTextStyle": "white",
  "navigationBarTitleText": "..."
}
```

---

## 6. 全局 app.wxss 改动

1. 删除所有旧颜色变量（`--primary`、`--bg-primary`、`--text-primary: #333` 等）
2. 在 `page` 选择器上重新定义第 2 节全部变量
3. 添加 `.page-container`、`.card`、`.btn-primary`、`.input-field`、`.loading-text`、`.empty-title` 全局共用类

---

## 7. 各页面改造方案

### 7.1 登录页 (`login`)

**仅改 .wxss**（.wxml 结构不变）：
- `.login-container`：背景改 `var(--bg-page)`
- `.logo-circle`：改为纯色圆形 `background: var(--color-accent)`，不显示 Emoji，改用文字「¥」
- `.app-name`：`color: var(--text-primary)`，字号加大至 52rpx
- `.form-card`：改为 `.card` 风格（`var(--bg-card)`）
- 输入框：使用 `.input-field` 下划线风格
- `.btn-login`：改为 `<view class="btn-primary">`（需改 .wxml）

### 7.2 注册页 (`register`)

与登录页一致的视觉规则，对应类名替换。需改 `.wxml`：`.btn-register` → `<view class="btn-primary">`（参见 4.3 迁移范围）。

### 7.3 首页 (`index`)

**需改 .wxml**（Hero 区域结构调整）：

旧 `balance-card` 改为：
```xml
<view class="hero-balance">
  <text class="hero-label">本月结余</text>
  <text class="hero-amount amount amount-hero">¥ {{netBalance}}</text>
  <view class="hero-sub-row">
    <view class="hero-sub-item">
      <text class="hero-sub-label">收入</text>
      <text class="hero-sub-amount income-amount">+¥{{totalIncome}}</text>
    </view>
    <view class="hero-sub-item">
      <text class="hero-sub-label">支出</text>
      <text class="hero-sub-amount expense-amount">-¥{{totalExpense}}</text>
    </view>
  </view>
</view>
```

其余 `.wxss` 改动：
- 页面背景、卡片、账单列表颜色全部按新变量更新
- Header 渐变背景改为 `var(--bg-card)`（不再绿色渐变）
- FAB 按钮颜色改为 `var(--color-accent)`，光晕用 `var(--color-accent-glow)`

### 7.4 添加账单页 (`add-bill`)

**需改 .wxml**（金额输入区重排）：
- 上半屏：大号金额输入居中，字号 80rpx，等宽字体
- 类型切换：收入/支出胶囊 toggle，选中时对应颜色高亮
- 类别网格：4列，使用 4.5 节选中态规则
- 日期、备注：`.input-field` 下划线
- 提交按钮：底部固定，改为 `<view class="btn-primary">`

### 7.5 统计页 (`statistics`)

**仅改 .wxss**（canvas 图表逻辑不变，仅改页面容器和文字颜色）：
- 深色底，月份切换文字改为 `var(--text-primary)`
- 收支汇总卡片颜色按变量更新
- 分类进度条使用 `.bar-fill-expense` / `.bar-fill-income`

### 7.6 校园页 (`campus`)

**仅改 .wxss**：
- 所有卡片、文字、进度条按新变量更新
- 健康评分圆形：背景 `var(--bg-card-2)`，分值文字 `var(--color-income)`

### 7.7 群组页 (`group-list`, `group-detail`, `add-group-bill`)

**主要改 .wxss**：
- 群组列表卡片：`var(--bg-card)`
- 成员头像：首字母 + `var(--color-accent)` 圆形背景
- 账单列表：与首页账单样式保持一致
- `add-group-bill` 金额输入：与 add-bill 页保持一致
- 提交按钮：`<view class="btn-primary">`（需改 .wxml）

### 7.8 个人中心 (`profile`)

**仅改 .wxss**：
- 页面背景、卡片颜色按变量
- 头像圆形：`background: var(--color-accent)`，首字母白色
- 统计数字：`var(--color-income)` 荧光绿，等宽字体
- 菜单列表：分割线用 `var(--border-divider)`

### 7.9 留言板 (`message-board`)

**仅改 .wxss**：
- 实际结构为卡片列表（`.message-item`），不是左右气泡布局，无需改 WXML
- 页面背景：`var(--bg-page)`
- 消息卡片 `.message-item`：背景 `var(--bg-card)`，左侧 4rpx 色条区分自己（`var(--color-accent)`）和他人（`var(--bg-card-2)`）
- 输入区域：背景 `var(--bg-card)`，输入框 `var(--bg-card-2)`
- 发送按钮：背景 `var(--color-accent)`
- **注意**：`message-board.wxss` 中若存在本地 `.btn-primary`（旧绿色）和 `.btn-disabled { background: #a5d6a7 }`，必须全部删除。禁用态由全局 `.btn-primary.disabled { opacity: 0.4 }` 统一处理

### 7.10 用户留言墙 (`user-wall`)

**仅改 .wxss**：
- 结构与留言板相同（卡片列表），视觉规则保持一致
- 留言条目卡片：`var(--bg-card)`
- 发布按钮/输入区：同留言板规则
- **注意**：`user-wall.wxss` 中若存在本地 `.btn-primary`（旧绿色）和 `.btn-disabled { background: #a5d6a7 }`，必须全部删除。禁用态由全局 `.btn-primary.disabled { opacity: 0.4 }` 统一处理

---

## 8. 不改动范围

- 所有 `.js` 业务逻辑（数据请求、状态管理），仅在输入框 focus/blur 中新增 setData 切换 `.input-focused` 类
- `.json` 配置仅改 `navigationBarBackgroundColor`、`navigationBarTextStyle` 和 `app.json` tabBar
- 路由和页面数量不变
- Canvas 图表渲染逻辑不变
