# 留言功能设计文档

**日期**：2026-03-25
**项目**：大学生记账小程序（College Accounting App）

---

## 背景

项目要求前台和后台各具备至少五个功能，包括注册、登录、留言等。现有项目缺少留言功能，本文档描述新增留言功能的完整设计。

---

## 功能范围

### 1. 公告留言板（Message Board）
所有人均可查看留言板，登录用户或匿名游客均可发帖和回复，登录用户可删除自己的留言。**公告留言板上的匿名留言（`user_id` 为 NULL）无法被任何人删除**，这是已知且接受的设计决策（无管理员角色）。

### 2. 个人留言墙（User Wall）
任意用户均有自己的留言墙，任何人（含匿名）都可以在他人主页给其留言，留言墙主人可删除墙上任意留言，其他用户只能删除自己发的留言。

---

## 数据库设计

### `messages` 表（公告留言板）

```sql
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content VARCHAR(500) NOT NULL,
    nickname VARCHAR(50) NOT NULL,
    user_id INT NULL,
    parent_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (parent_id) REFERENCES messages(id) ON DELETE CASCADE
);

CREATE INDEX idx_messages_parent_id ON messages(parent_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_user_id ON messages(user_id);
```

### `wall_messages` 表（个人留言墙）

```sql
CREATE TABLE IF NOT EXISTS wall_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    target_user_id INT NOT NULL,
    content VARCHAR(500) NOT NULL,
    nickname VARCHAR(50) NOT NULL,
    user_id INT NULL,
    parent_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (parent_id) REFERENCES wall_messages(id) ON DELETE CASCADE
);

CREATE INDEX idx_wall_messages_target_user ON wall_messages(target_user_id);
CREATE INDEX idx_wall_messages_parent_id ON wall_messages(parent_id);
CREATE INDEX idx_wall_messages_target_created ON wall_messages(target_user_id, created_at);
CREATE INDEX idx_wall_messages_user_id ON wall_messages(user_id);
```

**设计说明：**
- `user_id` 为 NULL 表示匿名留言，此时 `nickname` 由用户手动填写（后端强制加"匿名·"前缀防止冒充已注册用户名）
- 登录用户的 `nickname` 取 `users.name`（写入时快照存储），用户后续改名不影响历史留言昵称，前端只读不可修改
- `parent_id` 为 NULL 表示顶层帖子，否则为一层回复（不支持多级嵌套）
- 删除父留言时，子回复级联删除
- **回复时 `target_user_id` 由后端从父留言继承**，客户端不传此字段；后端同时校验 `parent_id` 对应的留言确实属于 URL 中 `:userId` 指定的留言墙，不一致时返回 400，防止跨墙数据错位
- **匿名留言删除规则**：匿名留言 `user_id` 为 NULL，前端对匿名留言不显示删除按钮（留言墙主人查看自己的墙时除外）；公告留言板上的匿名留言无人可删

---

## 后台 API 设计

### 公告留言板 `/api/messages`

| 方法 | 路径 | 说明 | 需登录 |
|------|------|------|--------|
| GET | `/` | 获取留言列表（含回复，按时间倒序） | 否 |
| POST | `/` | 发布顶层留言 | 否 |
| POST | `/:id/reply` | 回复某条留言 | 否 |
| DELETE | `/:id` | 删除自己的留言 | 是 |

### 个人留言墙（完整路径，挂载于 `/api/wall`）

| 方法 | 完整路径 | 说明 | 需登录 |
|------|---------|------|--------|
| GET | `/api/wall/:userId` | 获取指定用户的留言墙 | 否 |
| POST | `/api/wall/:userId` | 给指定用户留言 | 否 |
| POST | `/api/wall/:userId/:id/reply` | 回复墙上某条留言（后端校验 parent 归属） | 否 |
| DELETE | `/api/wall/:userId/:id` | 删除留言（自己的留言或墙主人删任意） | 是 |

**分页：** GET 接口支持 `?page=1&limit=20`，默认 limit=20，按 `created_at DESC` 排序。响应体包含：
```json
{
  "success": true,
  "data": {
    "messages": [...],
    "total": 100,
    "hasMore": true
  }
}
```
前端通过 `hasMore` 判断是否继续上拉加载。

**认证中间件策略：**

现有 `middleware/auth.js` 在无 token 时直接返回 401，不适用于本功能（部分接口允许匿名）。需新增 `middleware/optionalAuth.js`：token 存在且有效时解析并挂载 `req.user`，token 不存在或无效时 `req.user = null` 并继续执行，不返回错误。

- GET / POST 路由：挂载 `optionalAuth`（`req.user` 可为空）
- DELETE 路由：挂载原有 `auth`（必须登录）

**前端 request.js 兼容说明：** 现有 `utils/request.js` 对任何 401 响应均自动跳转登录页。留言板和留言墙的 GET/POST 接口后端不会返回 401（`optionalAuth` 不拦截无 token 请求），因此不受影响。匿名用户在前端不显示删除按钮，不会触发需要登录的 DELETE 接口，401 跳转行为不会干扰匿名浏览流程。

**新增后台文件：**
- `models/Message.js`
- `models/WallMessage.js`
- `controllers/messageController.js`
- `controllers/wallController.js`
- `routes/messages.js`
- `routes/wall.js`
- `middleware/optionalAuth.js`

在 `app.js` 中注册：
```js
app.use('/api/messages', messageRoutes);
app.use('/api/wall', wallRoutes);
```

**`routes/wall.js` 路由结构：**
```js
router.get('/:userId', ...)          // 获取某用户留言墙
router.post('/:userId', ...)         // 给某用户留言
router.post('/:userId/:id/reply', ...)  // 回复
router.delete('/:userId/:id', ...)   // 删除
```

---

## 前台页面设计

### 公告留言板 `pages/message-board/`

- 顶部发留言区：昵称输入框（登录用户自动填入，匿名用户手动填）+ 内容输入框 + 发送按钮
- 留言列表：昵称、发布时间、内容、回复按钮、删除按钮（仅自己留言可见）
- 回复区：点击回复后展开输入框，回复列表缩进显示在原帖下方
- 分页：每次加载 20 条，支持上拉加载更多

### 个人留言墙 `pages/user-wall/`

- 通过 URL 参数 `targetUserId` 指定墙主人
- 标题显示"xxx 的留言墙"
- 结构与留言板相同
- 墙主人登录后可删除墙上任意留言，其他人只能删自己的

### 入口
- `profile` 页面新增"查看我的留言墙"按钮，跳转至 `user-wall?targetUserId=自己id`
- 留言板列表中，每条留言的昵称可点击，跳转至该用户留言墙（仅登录用户有 `user_id` 时可点击，匿名留言不可跳转）
- 新增 `app.json` tabBar 入口：留言板作为主导航之一

**新增前台文件：**
- `pages/message-board/message-board.js`
- `pages/message-board/message-board.wxml`
- `pages/message-board/message-board.wxss`
- `pages/message-board/message-board.json`
- `pages/user-wall/user-wall.js`
- `pages/user-wall/user-wall.wxml`
- `pages/user-wall/user-wall.wxss`
- `pages/user-wall/user-wall.json`
- `assets/tab-message.png`（tabBar 未选中图标）
- `assets/tab-message-active.png`（tabBar 选中图标）

**修改文件：**
- `app.json`：注册两个新页面，tabBar 新增留言板入口（使用上述两个图标）
- `pages/profile/profile.js` 及 `.wxml`：添加留言墙入口按钮

---

## 错误处理

- 留言内容为空或超过 500 字：**前后端均校验**（前端实时提示，后端 controller 二次验证，与现有 billController 保持一致）
- 昵称为空：前后端均校验
- 匿名用户昵称强制加"匿名·"前缀，防止冒充已注册用户名
- 删除无权限：后端返回 403
- 匿名用户访问需登录接口（DELETE）：后端返回 401

---

## 不在范围内

- 多级嵌套回复（只支持一层）
- 点赞功能
- 留言搜索
- 图片留言
