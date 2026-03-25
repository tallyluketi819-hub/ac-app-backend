# 留言功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为大学生记账小程序新增公告留言板和个人留言墙功能，支持匿名发帖、回复和删除。

**Architecture:** 后端新增两组独立的 Model/Controller/Route 文件，遵循现有模式；新增 optionalAuth 中间件支持匿名访问；前端新增两个页面并修改 profile 页和 app.json。

**Tech Stack:** Node.js/Express、MySQL（mysql2）、微信小程序（WXML/WXSS/JS）

---

## 文件结构

**后端新增：**
- `backend/middleware/optionalAuth.js` — 可选 JWT 验证中间件
- `backend/models/Message.js` — 公告留言板数据模型
- `backend/models/WallMessage.js` — 个人留言墙数据模型
- `backend/controllers/messageController.js` — 公告留言板接口逻辑
- `backend/controllers/wallController.js` — 个人留言墙接口逻辑
- `backend/routes/messages.js` — 公告留言板路由
- `backend/routes/wall.js` — 个人留言墙路由

**后端修改：**
- `backend/app.js` — 注册两条新路由
- `database/schema.sql` — 新增 messages 和 wall_messages 表

**前端新增：**
- `miniprogram/pages/message-board/message-board.js`
- `miniprogram/pages/message-board/message-board.wxml`
- `miniprogram/pages/message-board/message-board.wxss`
- `miniprogram/pages/message-board/message-board.json`
- `miniprogram/pages/user-wall/user-wall.js`
- `miniprogram/pages/user-wall/user-wall.wxml`
- `miniprogram/pages/user-wall/user-wall.wxss`
- `miniprogram/pages/user-wall/user-wall.json`
- `miniprogram/assets/tab-message.png`（占位图，可复制现有图标）
- `miniprogram/assets/tab-message-active.png`（占位图）

**前端修改：**
- `miniprogram/app.json` — 注册新页面，tabBar 新增留言板
- `miniprogram/pages/profile/profile.wxml` — 添加留言墙入口按钮
- `miniprogram/pages/profile/profile.js` — 添加跳转方法

---

## Task 1: 数据库 — 新增两张表

**Files:**
- Modify: `database/schema.sql`

- [ ] **Step 1: 在 schema.sql 末尾追加两张表的建表语句**

在 `database/schema.sql` 文件末尾（第103行后）添加：

```sql
-- Messages table (public message board)
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

-- Wall messages table (personal message wall)
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

- [ ] **Step 2: 在 MySQL 中执行建表语句**

```bash
# 进入 MySQL（使用你的实际用户名和密码）
mysql -u root -p college_accounting

# 在 MySQL 中执行（复制粘贴上面的 SQL）
# 或者直接执行文件末尾新增的部分
```

预期结果：`Query OK` 无报错，执行 `SHOW TABLES;` 可见 `messages` 和 `wall_messages`。

- [ ] **Step 3: Commit**

```bash
cd "/Users/xiazhaoxu/ac app"
git add database/schema.sql
git commit -m "feat: add messages and wall_messages tables to schema"
```

---

## Task 2: 后端 — optionalAuth 中间件

**Files:**
- Create: `backend/middleware/optionalAuth.js`

- [ ] **Step 1: 创建 optionalAuth.js**

内容参考 `backend/middleware/auth.js`，区别是无 token 时不返回 401 而是继续执行：

```js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'college_accounting_secret_key_2024';

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    req.user = null;
    return next();
  }

  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
  } catch (err) {
    req.user = null;
  }

  next();
};

module.exports = optionalAuth;
```

- [ ] **Step 2: 验证中间件行为**

启动后端（`cd backend && node app.js`），用 curl 确认：

```bash
# 无 token 请求任意受保护路由（暂不测留言接口，先用已有路由观察行为）
# 本步骤无需执行，仅做理解确认
# optionalAuth 在 Task 6 中随路由一起测试
```

- [ ] **Step 3: Commit**

```bash
git add backend/middleware/optionalAuth.js
git commit -m "feat: add optionalAuth middleware for anonymous access"
```

---

## Task 3: 后端 — Message 模型

**Files:**
- Create: `backend/models/Message.js`

- [ ] **Step 1: 创建 Message.js**

```js
const db = require('../config/db');

const Message = {
  // 获取顶层留言列表（带回复），支持分页
  async findAll(page, limit) {
    const offset = (page - 1) * limit;

    // 获取顶层留言
    const [rows] = await db.execute(
      `SELECT id, content, nickname, user_id, created_at
       FROM messages
       WHERE parent_id IS NULL
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    // 获取总数
    const [[{ total }]] = await db.execute(
      'SELECT COUNT(*) AS total FROM messages WHERE parent_id IS NULL'
    );

    // 获取这批顶层留言的回复
    if (rows.length > 0) {
      const ids = rows.map(r => r.id);
      const placeholders = ids.map(() => '?').join(',');
      const [replies] = await db.execute(
        `SELECT id, content, nickname, user_id, parent_id, created_at
         FROM messages
         WHERE parent_id IN (${placeholders})
         ORDER BY created_at ASC`,
        ids
      );

      // 将回复挂到对应顶层留言上
      const replyMap = {};
      replies.forEach(r => {
        if (!replyMap[r.parent_id]) replyMap[r.parent_id] = [];
        replyMap[r.parent_id].push(r);
      });
      rows.forEach(row => {
        row.replies = replyMap[row.id] || [];
      });
    } else {
      rows.forEach(row => { row.replies = []; });
    }

    return { messages: rows, total, hasMore: offset + rows.length < total };
  },

  // 创建顶层留言或回复
  async create(data) {
    const { content, nickname, user_id, parent_id } = data;
    const [result] = await db.execute(
      'INSERT INTO messages (content, nickname, user_id, parent_id) VALUES (?, ?, ?, ?)',
      [content, nickname, user_id || null, parent_id || null]
    );
    return result;
  },

  async findById(id) {
    const [rows] = await db.execute('SELECT * FROM messages WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async delete(id) {
    const [result] = await db.execute('DELETE FROM messages WHERE id = ?', [id]);
    return result;
  }
};

module.exports = Message;
```

- [ ] **Step 2: Commit**

```bash
git add backend/models/Message.js
git commit -m "feat: add Message model for public message board"
```

---

## Task 4: 后端 — WallMessage 模型

**Files:**
- Create: `backend/models/WallMessage.js`

- [ ] **Step 1: 创建 WallMessage.js**

```js
const db = require('../config/db');

const WallMessage = {
  // 获取某用户留言墙（顶层留言带回复），支持分页
  async findByTarget(targetUserId, page, limit) {
    const offset = (page - 1) * limit;

    const [rows] = await db.execute(
      `SELECT id, content, nickname, user_id, target_user_id, created_at
       FROM wall_messages
       WHERE target_user_id = ? AND parent_id IS NULL
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [targetUserId, limit, offset]
    );

    const [[{ total }]] = await db.execute(
      'SELECT COUNT(*) AS total FROM wall_messages WHERE target_user_id = ? AND parent_id IS NULL',
      [targetUserId]
    );

    if (rows.length > 0) {
      const ids = rows.map(r => r.id);
      const placeholders = ids.map(() => '?').join(',');
      const [replies] = await db.execute(
        `SELECT id, content, nickname, user_id, parent_id, target_user_id, created_at
         FROM wall_messages
         WHERE parent_id IN (${placeholders})
         ORDER BY created_at ASC`,
        ids
      );

      const replyMap = {};
      replies.forEach(r => {
        if (!replyMap[r.parent_id]) replyMap[r.parent_id] = [];
        replyMap[r.parent_id].push(r);
      });
      rows.forEach(row => {
        row.replies = replyMap[row.id] || [];
      });
    } else {
      rows.forEach(row => { row.replies = []; });
    }

    return { messages: rows, total, hasMore: offset + rows.length < total };
  },

  async create(data) {
    const { target_user_id, content, nickname, user_id, parent_id } = data;
    const [result] = await db.execute(
      'INSERT INTO wall_messages (target_user_id, content, nickname, user_id, parent_id) VALUES (?, ?, ?, ?, ?)',
      [target_user_id, content, nickname, user_id || null, parent_id || null]
    );
    return result;
  },

  async findById(id) {
    const [rows] = await db.execute('SELECT * FROM wall_messages WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async delete(id) {
    const [result] = await db.execute('DELETE FROM wall_messages WHERE id = ?', [id]);
    return result;
  }
};

module.exports = WallMessage;
```

- [ ] **Step 2: Commit**

```bash
git add backend/models/WallMessage.js
git commit -m "feat: add WallMessage model for personal message wall"
```

---

## Task 5: 后端 — messageController

**Files:**
- Create: `backend/controllers/messageController.js`

- [ ] **Step 1: 创建 messageController.js**

```js
const Message = require('../models/Message');

const messageController = {
  // GET /api/messages?page=1&limit=20
  async getMessages(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 20, 50);
      const result = await Message.findAll(page, limit);
      return res.json({ success: true, data: result });
    } catch (err) {
      console.error('Get messages error:', err);
      return res.status(500).json({ success: false, message: '服务器内部错误' });
    }
  },

  // POST /api/messages
  async createMessage(req, res) {
    try {
      let { content, nickname } = req.body;
      const user = req.user; // 可能为 null（匿名）

      // 验证内容
      if (!content || !content.trim()) {
        return res.status(400).json({ success: false, message: '留言内容不能为空' });
      }
      if (content.trim().length > 500) {
        return res.status(400).json({ success: false, message: '留言内容不能超过500字' });
      }

      // 确定昵称
      if (user) {
        nickname = user.name;
      } else {
        if (!nickname || !nickname.trim()) {
          return res.status(400).json({ success: false, message: '匿名留言请填写昵称' });
        }
        // 强制加匿名前缀防冒充
        nickname = '匿名·' + nickname.trim().replace(/^匿名·/, '');
      }

      await Message.create({
        content: content.trim(),
        nickname,
        user_id: user ? user.id : null,
        parent_id: null
      });

      return res.status(201).json({ success: true, message: '留言成功' });
    } catch (err) {
      console.error('Create message error:', err);
      return res.status(500).json({ success: false, message: '服务器内部错误' });
    }
  },

  // POST /api/messages/:id/reply
  async replyMessage(req, res) {
    try {
      const parentId = parseInt(req.params.id);
      let { content, nickname } = req.body;
      const user = req.user;

      // 验证父留言存在且是顶层留言（不支持多级嵌套）
      const parent = await Message.findById(parentId);
      if (!parent) {
        return res.status(404).json({ success: false, message: '留言不存在' });
      }
      if (parent.parent_id !== null) {
        return res.status(400).json({ success: false, message: '不支持多级回复' });
      }

      // 验证内容
      if (!content || !content.trim()) {
        return res.status(400).json({ success: false, message: '回复内容不能为空' });
      }
      if (content.trim().length > 500) {
        return res.status(400).json({ success: false, message: '回复内容不能超过500字' });
      }

      // 确定昵称
      if (user) {
        nickname = user.name;
      } else {
        if (!nickname || !nickname.trim()) {
          return res.status(400).json({ success: false, message: '匿名回复请填写昵称' });
        }
        nickname = '匿名·' + nickname.trim().replace(/^匿名·/, '');
      }

      await Message.create({
        content: content.trim(),
        nickname,
        user_id: user ? user.id : null,
        parent_id: parentId
      });

      return res.status(201).json({ success: true, message: '回复成功' });
    } catch (err) {
      console.error('Reply message error:', err);
      return res.status(500).json({ success: false, message: '服务器内部错误' });
    }
  },

  // DELETE /api/messages/:id
  async deleteMessage(req, res) {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.id;

      const msg = await Message.findById(id);
      if (!msg) {
        return res.status(404).json({ success: false, message: '留言不存在' });
      }

      // 只能删除自己的留言（匿名留言 user_id 为 null，不可删）
      if (msg.user_id !== userId) {
        return res.status(403).json({ success: false, message: '无权删除该留言' });
      }

      await Message.delete(id);
      return res.json({ success: true, message: '删除成功' });
    } catch (err) {
      console.error('Delete message error:', err);
      return res.status(500).json({ success: false, message: '服务器内部错误' });
    }
  }
};

module.exports = messageController;
```

- [ ] **Step 2: Commit**

```bash
git add backend/controllers/messageController.js
git commit -m "feat: add messageController for public message board"
```

---

## Task 6: 后端 — routes/messages.js 并测试接口

**Files:**
- Create: `backend/routes/messages.js`
- Modify: `backend/app.js`

- [ ] **Step 1: 创建 routes/messages.js**

```js
const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');

router.get('/', optionalAuth, messageController.getMessages);
router.post('/', optionalAuth, messageController.createMessage);
router.post('/:id/reply', optionalAuth, messageController.replyMessage);
router.delete('/:id', auth, messageController.deleteMessage);

module.exports = router;
```

- [ ] **Step 2: 在 app.js 中注册路由**

在 `backend/app.js` 第23行（`const campusRoutes` 之后）添加：

```js
const messageRoutes = require('./routes/messages');
```

在 `app.use('/api/campus', campusRoutes);` 之后添加：

```js
app.use('/api/messages', messageRoutes);
```

注意：`wallRoutes` 在 Task 8 中才创建，**不要**在这一步引入，否则服务器启动时会因找不到文件而崩溃。

- [ ] **Step 3: 启动后端并测试留言板接口**

```bash
cd "/Users/xiazhaoxu/ac app/backend"
node app.js
```

另开终端执行：

```bash
# 获取留言列表（空）
curl http://localhost:3000/api/messages
# 预期: {"success":true,"data":{"messages":[],"total":0,"hasMore":false}}

# 匿名发留言
curl -X POST http://localhost:3000/api/messages \
  -H "Content-Type: application/json" \
  -d '{"content":"第一条留言","nickname":"小明"}'
# 预期: {"success":true,"message":"留言成功"}

# 再次获取列表，应有一条，nickname 为"匿名·小明"
curl http://localhost:3000/api/messages
# 预期: messages 数组有一条数据，nickname="匿名·小明"

# 回复该留言（假设 id=1）
curl -X POST http://localhost:3000/api/messages/1/reply \
  -H "Content-Type: application/json" \
  -d '{"content":"我来回复","nickname":"小红"}'
# 预期: {"success":true,"message":"回复成功"}

# 验证回复已挂载在父留言的 replies 下
curl http://localhost:3000/api/messages
# 预期: messages[0].replies 有一条数据

# 无 token 尝试删除，应返回 401
curl -X DELETE http://localhost:3000/api/messages/1
# 预期: {"success":false,"message":"未提供认证令牌"}
```

- [ ] **Step 4: Commit**

```bash
git add backend/routes/messages.js backend/app.js
git commit -m "feat: add messages routes and register in app.js"
```

---

## Task 7: 后端 — wallController

**Files:**
- Create: `backend/controllers/wallController.js`

- [ ] **Step 1: 创建 wallController.js**

```js
const WallMessage = require('../models/WallMessage');

const wallController = {
  // GET /api/wall/:userId?page=1&limit=20
  async getWall(req, res) {
    try {
      const targetUserId = parseInt(req.params.userId);
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 20, 50);
      const result = await WallMessage.findByTarget(targetUserId, page, limit);
      return res.json({ success: true, data: result });
    } catch (err) {
      console.error('Get wall error:', err);
      return res.status(500).json({ success: false, message: '服务器内部错误' });
    }
  },

  // POST /api/wall/:userId
  async createWallMessage(req, res) {
    try {
      const targetUserId = parseInt(req.params.userId);
      let { content, nickname } = req.body;
      const user = req.user;

      if (!content || !content.trim()) {
        return res.status(400).json({ success: false, message: '留言内容不能为空' });
      }
      if (content.trim().length > 500) {
        return res.status(400).json({ success: false, message: '留言内容不能超过500字' });
      }

      if (user) {
        nickname = user.name;
      } else {
        if (!nickname || !nickname.trim()) {
          return res.status(400).json({ success: false, message: '匿名留言请填写昵称' });
        }
        nickname = '匿名·' + nickname.trim().replace(/^匿名·/, '');
      }

      await WallMessage.create({
        target_user_id: targetUserId,
        content: content.trim(),
        nickname,
        user_id: user ? user.id : null,
        parent_id: null
      });

      return res.status(201).json({ success: true, message: '留言成功' });
    } catch (err) {
      console.error('Create wall message error:', err);
      return res.status(500).json({ success: false, message: '服务器内部错误' });
    }
  },

  // POST /api/wall/:userId/:id/reply
  async replyWallMessage(req, res) {
    try {
      const targetUserId = parseInt(req.params.userId);
      const parentId = parseInt(req.params.id);
      let { content, nickname } = req.body;
      const user = req.user;

      // 验证父留言存在、属于该留言墙、是顶层留言
      const parent = await WallMessage.findById(parentId);
      if (!parent) {
        return res.status(404).json({ success: false, message: '留言不存在' });
      }
      if (parent.target_user_id !== targetUserId) {
        return res.status(400).json({ success: false, message: '留言不属于该用户留言墙' });
      }
      if (parent.parent_id !== null) {
        return res.status(400).json({ success: false, message: '不支持多级回复' });
      }

      if (!content || !content.trim()) {
        return res.status(400).json({ success: false, message: '回复内容不能为空' });
      }
      if (content.trim().length > 500) {
        return res.status(400).json({ success: false, message: '回复内容不能超过500字' });
      }

      if (user) {
        nickname = user.name;
      } else {
        if (!nickname || !nickname.trim()) {
          return res.status(400).json({ success: false, message: '匿名回复请填写昵称' });
        }
        nickname = '匿名·' + nickname.trim().replace(/^匿名·/, '');
      }

      await WallMessage.create({
        target_user_id: targetUserId, // 继承自父留言所在墙
        content: content.trim(),
        nickname,
        user_id: user ? user.id : null,
        parent_id: parentId
      });

      return res.status(201).json({ success: true, message: '回复成功' });
    } catch (err) {
      console.error('Reply wall message error:', err);
      return res.status(500).json({ success: false, message: '服务器内部错误' });
    }
  },

  // DELETE /api/wall/:userId/:id
  async deleteWallMessage(req, res) {
    try {
      const targetUserId = parseInt(req.params.userId);
      const id = parseInt(req.params.id);
      const userId = req.user.id;

      const msg = await WallMessage.findById(id);
      if (!msg) {
        return res.status(404).json({ success: false, message: '留言不存在' });
      }

      // 墙主人可删任意留言；其他人只能删自己的（匿名留言 user_id 为 null，不可删）
      const isWallOwner = userId === targetUserId;
      const isAuthor = msg.user_id === userId;

      if (!isWallOwner && !isAuthor) {
        return res.status(403).json({ success: false, message: '无权删除该留言' });
      }

      await WallMessage.delete(id);
      return res.json({ success: true, message: '删除成功' });
    } catch (err) {
      console.error('Delete wall message error:', err);
      return res.status(500).json({ success: false, message: '服务器内部错误' });
    }
  }
};

module.exports = wallController;
```

- [ ] **Step 2: Commit**

```bash
git add backend/controllers/wallController.js
git commit -m "feat: add wallController for personal message wall"
```

---

## Task 8: 后端 — routes/wall.js 并测试接口

**Files:**
- Create: `backend/routes/wall.js`
- Modify: `backend/app.js`

- [ ] **Step 1: 创建 routes/wall.js**

```js
const express = require('express');
const router = express.Router();
const wallController = require('../controllers/wallController');
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');

router.get('/:userId', optionalAuth, wallController.getWall);
router.post('/:userId', optionalAuth, wallController.createWallMessage);
router.post('/:userId/:id/reply', optionalAuth, wallController.replyWallMessage);
router.delete('/:userId/:id', auth, wallController.deleteWallMessage);

module.exports = router;
```

- [ ] **Step 2: 在 app.js 中取消 wallRoutes 的注释**

找到之前在 Task 6 中注释的行，修改 `backend/app.js`：

```js
// 将这行：
// app.use('/api/wall', wallRoutes);  // Task 8 完成后取消注释
// 改为：
app.use('/api/wall', wallRoutes);
```

同时确保文件顶部 `const wallRoutes = require('./routes/wall');` 已取消注释。

- [ ] **Step 3: 重启后端并测试留言墙接口**

```bash
# 重启服务（Ctrl+C 后重新 node app.js）

# 假设有一个用户 id=1，给他的墙留言
curl -X POST http://localhost:3000/api/wall/1 \
  -H "Content-Type: application/json" \
  -d '{"content":"你好啊","nickname":"路人甲"}'
# 预期: {"success":true,"message":"留言成功"}

# 查看该用户留言墙
curl http://localhost:3000/api/wall/1
# 预期: messages 数组有一条，nickname="匿名·路人甲"

# 回复（id=1）
curl -X POST http://localhost:3000/api/wall/1/1/reply \
  -H "Content-Type: application/json" \
  -d '{"content":"谢谢","nickname":"墙主"}'
# 预期: {"success":true,"message":"回复成功"}

# 跨墙回复（用错误的 userId），应返回 400
curl -X POST http://localhost:3000/api/wall/99/1/reply \
  -H "Content-Type: application/json" \
  -d '{"content":"非法回复","nickname":"攻击者"}'
# 预期: {"success":false,"message":"留言不属于该用户留言墙"}
```

- [ ] **Step 4: Commit**

```bash
git add backend/routes/wall.js backend/app.js
git commit -m "feat: add wall routes and register in app.js"
```

---

## Task 9: 前台 — 公告留言板页面

**Files:**
- Create: `miniprogram/pages/message-board/message-board.js`
- Create: `miniprogram/pages/message-board/message-board.wxml`
- Create: `miniprogram/pages/message-board/message-board.wxss`
- Create: `miniprogram/pages/message-board/message-board.json`

- [ ] **Step 1: 创建 message-board.json**

```json
{
  "navigationBarTitleText": "留言板",
  "enablePullDownRefresh": false
}
```

- [ ] **Step 2: 创建 message-board.js**

```js
const http = require('../../utils/request');
const app = getApp();

Page({
  data: {
    messages: [],
    loading: false,
    page: 1,
    hasMore: true,
    // 发留言
    inputContent: '',
    inputNickname: '',
    submitting: false,
    // 回复
    replyingTo: null,      // { id, nickname }
    replyContent: '',
    replyNickname: '',
    replySubmitting: false
  },

  onLoad() {
    this.loadMessages(true);
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
        this.setData({
          messages: msgs,
          page: page + 1,
          hasMore: res.data.hasMore
        });
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

    if (!inputContent.trim()) {
      wx.showToast({ title: '请填写留言内容', icon: 'none' }); return;
    }
    if (!user && !inputNickname.trim()) {
      wx.showToast({ title: '请填写昵称', icon: 'none' }); return;
    }

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

    if (!replyContent.trim()) {
      wx.showToast({ title: '请填写回复内容', icon: 'none' }); return;
    }
    if (!user && !replyNickname.trim()) {
      wx.showToast({ title: '请填写昵称', icon: 'none' }); return;
    }

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
```

- [ ] **Step 3: 创建 message-board.wxml**

```xml
<view class="page-container">
  <!-- 发留言区 -->
  <view class="compose-card">
    <text class="card-title">发留言</text>
    <view wx:if="{{!currentUserId}}" class="form-item">
      <input
        class="input"
        placeholder="你的昵称（必填）"
        placeholder-class="placeholder"
        value="{{inputNickname}}"
        bindinput="onNicknameInput"
        maxlength="20"
      />
    </view>
    <textarea
      class="textarea"
      placeholder="说点什么..."
      placeholder-class="placeholder"
      value="{{inputContent}}"
      bindinput="onContentInput"
      maxlength="500"
      auto-height
    />
    <view class="char-count">
      <text class="char-text">{{inputContent.length}}/500</text>
    </view>
    <view class="btn-primary {{submitting ? 'btn-disabled' : ''}}" bindtap="submitMessage">
      <text class="btn-text">{{submitting ? '发送中...' : '发送留言'}}</text>
    </view>
  </view>

  <!-- 留言列表 -->
  <view class="messages-list">
    <view wx:if="{{loading && messages.length === 0}}" class="loading-state">
      <text class="loading-text">加载中...</text>
    </view>

    <view wx:elif="{{messages.length === 0}}" class="empty-state">
      <text class="empty-text">暂无留言，快来第一个留言吧</text>
    </view>

    <view wx:else>
      <view class="message-item" wx:for="{{messages}}" wx:key="id">
        <!-- 留言头部 -->
        <view class="msg-header">
          <text
            class="msg-nickname {{item.user_id ? 'clickable' : ''}}"
            bindtap="goToUserWall"
            data-user-id="{{item.user_id}}"
          >{{item.nickname}}</text>
          <text class="msg-time">{{item.created_at.slice(0, 10)}}</text>
        </view>
        <text class="msg-content">{{item.content}}</text>

        <!-- 操作按钮 -->
        <view class="msg-actions">
          <text class="action-btn" bindtap="startReply" data-id="{{item.id}}" data-nickname="{{item.nickname}}">回复</text>
          <text wx:if="{{item.user_id && item.user_id === currentUserId}}" class="action-btn delete-btn" bindtap="confirmDelete" data-id="{{item.id}}">删除</text>
        </view>

        <!-- 回复列表 -->
        <view wx:if="{{item.replies.length > 0}}" class="replies-list">
          <view class="reply-item" wx:for="{{item.replies}}" wx:key="id" wx:for-item="reply">
            <view class="reply-header">
              <text class="reply-nickname">{{reply.nickname}}</text>
              <text class="reply-time">{{reply.created_at.slice(0, 10)}}</text>
            </view>
            <text class="reply-content">{{reply.content}}</text>
            <text wx:if="{{reply.user_id && reply.user_id === currentUserId}}" class="action-btn delete-btn" bindtap="confirmDelete" data-id="{{reply.id}}">删除</text>
          </view>
        </view>

        <!-- 回复输入框（点击回复后展开） -->
        <view wx:if="{{replyingTo && replyingTo.id === item.id}}" class="reply-compose">
          <text class="reply-to-label">回复 {{replyingTo.nickname}}：</text>
          <view wx:if="{{!currentUserId}}" class="form-item">
            <input
              class="input"
              placeholder="你的昵称（必填）"
              placeholder-class="placeholder"
              value="{{replyNickname}}"
              bindinput="onReplyNicknameInput"
              maxlength="20"
            />
          </view>
          <textarea
            class="textarea textarea-sm"
            placeholder="回复内容..."
            placeholder-class="placeholder"
            value="{{replyContent}}"
            bindinput="onReplyContentInput"
            maxlength="500"
            auto-height
          />
          <view class="reply-actions">
            <text class="cancel-btn" bindtap="cancelReply">取消</text>
            <view class="btn-primary btn-sm {{replySubmitting ? 'btn-disabled' : ''}}" bindtap="submitReply">
              <text class="btn-text">{{replySubmitting ? '回复中...' : '发送'}}</text>
            </view>
          </view>
        </view>
      </view>

      <view wx:if="{{!hasMore && messages.length > 0}}" class="no-more">
        <text class="no-more-text">— 没有更多了 —</text>
      </view>
    </view>
  </view>
</view>
```

- [ ] **Step 4: 在 message-board.js 的 onLoad 中读取 currentUserId**

在 `message-board.js` 的 `onLoad` 方法中添加：

```js
onLoad() {
  const user = app.getUserInfo();
  this.setData({ currentUserId: user ? user.id : null });
  this.loadMessages(true);
},
```

同时在 `data` 中添加 `currentUserId: null`。

- [ ] **Step 5: 创建 message-board.wxss**

```css
.page-container {
  background: #f5f5f5;
  min-height: 100vh;
  padding: 20rpx;
}

.compose-card, .message-item {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.card-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 16rpx;
}

.input {
  border: 1rpx solid #e0e0e0;
  border-radius: 8rpx;
  padding: 16rpx;
  font-size: 28rpx;
  width: 100%;
  box-sizing: border-box;
  margin-bottom: 16rpx;
}

.textarea {
  border: 1rpx solid #e0e0e0;
  border-radius: 8rpx;
  padding: 16rpx;
  font-size: 28rpx;
  width: 100%;
  box-sizing: border-box;
  min-height: 120rpx;
}

.textarea-sm { min-height: 80rpx; }

.char-count { text-align: right; margin: 8rpx 0; }
.char-text { font-size: 24rpx; color: #999; }

.placeholder { color: #bbb; }

.btn-primary {
  background: #4CAF50;
  border-radius: 8rpx;
  padding: 20rpx;
  text-align: center;
  margin-top: 16rpx;
}

.btn-sm { padding: 12rpx 24rpx; margin-top: 0; display: inline-block; }
.btn-disabled { background: #a5d6a7; }
.btn-text { color: #fff; font-size: 28rpx; }

.msg-header, .reply-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}

.msg-nickname {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}

.msg-nickname.clickable { color: #4CAF50; }

.msg-time, .reply-time {
  font-size: 24rpx;
  color: #999;
}

.msg-content, .reply-content {
  font-size: 28rpx;
  color: #555;
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
  color: #4CAF50;
}

.delete-btn { color: #F44336; }

.replies-list {
  background: #f9f9f9;
  border-radius: 8rpx;
  padding: 16rpx;
  margin-top: 16rpx;
}

.reply-item {
  padding: 12rpx 0;
  border-bottom: 1rpx solid #eee;
}

.reply-item:last-child { border-bottom: none; }

.reply-nickname {
  font-size: 26rpx;
  font-weight: bold;
  color: #555;
}

.reply-compose {
  margin-top: 16rpx;
  padding: 16rpx;
  background: #f9f9f9;
  border-radius: 8rpx;
}

.reply-to-label {
  font-size: 26rpx;
  color: #4CAF50;
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
  color: #999;
}

.loading-state, .empty-state, .no-more {
  text-align: center;
  padding: 60rpx 0;
}

.loading-text, .empty-text, .no-more-text {
  font-size: 28rpx;
  color: #bbb;
}

.form-item { margin-bottom: 16rpx; }
```

- [ ] **Step 6: Commit**

```bash
git add miniprogram/pages/message-board/
git commit -m "feat: add message-board frontend page"
```

---

## Task 10: 前台 — 个人留言墙页面

**Files:**
- Create: `miniprogram/pages/user-wall/user-wall.js`
- Create: `miniprogram/pages/user-wall/user-wall.wxml`
- Create: `miniprogram/pages/user-wall/user-wall.wxss`
- Create: `miniprogram/pages/user-wall/user-wall.json`

- [ ] **Step 1: 创建 user-wall.json**

```json
{
  "navigationBarTitleText": "留言墙",
  "enablePullDownRefresh": false
}
```

- [ ] **Step 2: 创建 user-wall.js**

结构与 message-board.js 高度相似，区别在于：请求路径带 `targetUserId`，删除权限包含墙主人。

```js
const http = require('../../utils/request');
const app = getApp();

Page({
  data: {
    targetUserId: null,
    targetUserName: '',
    isOwner: false,
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

  onLoad(options) {
    const targetUserId = parseInt(options.targetUserId);
    const user = app.getUserInfo();
    const currentUserId = user ? user.id : null;
    this.setData({
      targetUserId,
      currentUserId,
      isOwner: currentUserId === targetUserId
    });
    wx.setNavigationBarTitle({ title: options.targetUserName ? `${options.targetUserName}的留言墙` : '留言墙' });
    this.loadMessages(true);
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) this.loadMessages(false);
  },

  async loadMessages(reset) {
    if (this.data.loading) return;
    const page = reset ? 1 : this.data.page;
    this.setData({ loading: true });
    try {
      const res = await http.get(`/wall/${this.data.targetUserId}`, { page, limit: 20 });
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
    const { inputContent, inputNickname, targetUserId } = this.data;
    const user = app.getUserInfo();
    if (!inputContent.trim()) { wx.showToast({ title: '请填写留言内容', icon: 'none' }); return; }
    if (!user && !inputNickname.trim()) { wx.showToast({ title: '请填写昵称', icon: 'none' }); return; }
    this.setData({ submitting: true });
    try {
      const body = { content: inputContent.trim() };
      if (!user) body.nickname = inputNickname.trim();
      const res = await http.post(`/wall/${targetUserId}`, body);
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
    const { replyingTo, replyContent, replyNickname, targetUserId } = this.data;
    const user = app.getUserInfo();
    if (!replyContent.trim()) { wx.showToast({ title: '请填写回复内容', icon: 'none' }); return; }
    if (!user && !replyNickname.trim()) { wx.showToast({ title: '请填写昵称', icon: 'none' }); return; }
    this.setData({ replySubmitting: true });
    try {
      const body = { content: replyContent.trim() };
      if (!user) body.nickname = replyNickname.trim();
      const res = await http.post(`/wall/${targetUserId}/${replyingTo.id}/reply`, body);
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
            const result = await http.delete(`/wall/${this.data.targetUserId}/${id}`);
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
  }
});
```

- [ ] **Step 3: 创建 user-wall.wxml**

与 message-board.wxml 结构相同，区别是删除按钮条件：墙主人可删任意留言，其他人只能删自己的：

```xml
<view class="page-container">
  <view class="compose-card">
    <text class="card-title">给Ta留言</text>
    <view wx:if="{{!currentUserId}}" class="form-item">
      <input class="input" placeholder="你的昵称（必填）" placeholder-class="placeholder" value="{{inputNickname}}" bindinput="onNicknameInput" maxlength="20" />
    </view>
    <textarea class="textarea" placeholder="说点什么..." placeholder-class="placeholder" value="{{inputContent}}" bindinput="onContentInput" maxlength="500" auto-height />
    <view class="char-count"><text class="char-text">{{inputContent.length}}/500</text></view>
    <view class="btn-primary {{submitting ? 'btn-disabled' : ''}}" bindtap="submitMessage">
      <text class="btn-text">{{submitting ? '发送中...' : '留言'}}</text>
    </view>
  </view>

  <view class="messages-list">
    <view wx:if="{{loading && messages.length === 0}}" class="loading-state">
      <text class="loading-text">加载中...</text>
    </view>
    <view wx:elif="{{messages.length === 0}}" class="empty-state">
      <text class="empty-text">还没有留言，快来第一个留言吧</text>
    </view>
    <view wx:else>
      <view class="message-item" wx:for="{{messages}}" wx:key="id">
        <view class="msg-header">
          <text class="msg-nickname">{{item.nickname}}</text>
          <text class="msg-time">{{item.created_at.slice(0, 10)}}</text>
        </view>
        <text class="msg-content">{{item.content}}</text>
        <view class="msg-actions">
          <text class="action-btn" bindtap="startReply" data-id="{{item.id}}" data-nickname="{{item.nickname}}">回复</text>
          <!-- 墙主人可删任意；其他人只能删自己的（匿名留言 user_id 为 null 不可删） -->
          <text wx:if="{{isOwner || (item.user_id && item.user_id === currentUserId)}}" class="action-btn delete-btn" bindtap="confirmDelete" data-id="{{item.id}}">删除</text>
        </view>

        <view wx:if="{{item.replies.length > 0}}" class="replies-list">
          <view class="reply-item" wx:for="{{item.replies}}" wx:key="id" wx:for-item="reply">
            <view class="reply-header">
              <text class="reply-nickname">{{reply.nickname}}</text>
              <text class="reply-time">{{reply.created_at.slice(0, 10)}}</text>
            </view>
            <text class="reply-content">{{reply.content}}</text>
            <text wx:if="{{isOwner || (reply.user_id && reply.user_id === currentUserId)}}" class="action-btn delete-btn" bindtap="confirmDelete" data-id="{{reply.id}}">删除</text>
          </view>
        </view>

        <view wx:if="{{replyingTo && replyingTo.id === item.id}}" class="reply-compose">
          <text class="reply-to-label">回复 {{replyingTo.nickname}}：</text>
          <view wx:if="{{!currentUserId}}" class="form-item">
            <input class="input" placeholder="你的昵称（必填）" placeholder-class="placeholder" value="{{replyNickname}}" bindinput="onReplyNicknameInput" maxlength="20" />
          </view>
          <textarea class="textarea textarea-sm" placeholder="回复内容..." placeholder-class="placeholder" value="{{replyContent}}" bindinput="onReplyContentInput" maxlength="500" auto-height />
          <view class="reply-actions">
            <text class="cancel-btn" bindtap="cancelReply">取消</text>
            <view class="btn-primary btn-sm {{replySubmitting ? 'btn-disabled' : ''}}" bindtap="submitReply">
              <text class="btn-text">{{replySubmitting ? '回复中...' : '发送'}}</text>
            </view>
          </view>
        </view>
      </view>
      <view wx:if="{{!hasMore && messages.length > 0}}" class="no-more">
        <text class="no-more-text">— 没有更多了 —</text>
      </view>
    </view>
  </view>
</view>
```

- [ ] **Step 4: 创建 user-wall.wxss**

复用与 message-board.wxss 相同的样式（内容完全一致，直接拷贝）：

```css
/* 与 message-board.wxss 内容相同，直接复制过来 */
```

（完整内容参见 Task 9 Step 5 中的 message-board.wxss）

- [ ] **Step 5: Commit**

```bash
git add miniprogram/pages/user-wall/
git commit -m "feat: add user-wall frontend page"
```

---

## Task 11: 前台 — 修改 app.json + profile 页 + tabBar 图标

**Files:**
- Modify: `miniprogram/app.json`
- Modify: `miniprogram/pages/profile/profile.wxml`
- Modify: `miniprogram/pages/profile/profile.js`
- Create: `miniprogram/assets/tab-message.png`（占位图）
- Create: `miniprogram/assets/tab-message-active.png`（占位图）

- [ ] **Step 1: 准备 tabBar 图标（占位方案）**

由于无 PNG 设计资源，先复制一个现有图标作为占位：

```bash
cd "/Users/xiazhaoxu/ac app/miniprogram/assets"
cp tab-campus.png tab-message.png
cp tab-campus-active.png tab-message-active.png
```

后续可替换为正式留言图标。

- [ ] **Step 2: 修改 app.json**

在 `"pages"` 数组中，在 `"pages/campus/campus"` 之后添加两个新页面：

```json
"pages/message-board/message-board",
"pages/user-wall/user-wall",
```

在 `"tabBar.list"` 中，在 `"校园"` 和 `"我的"` 之间插入：

```json
{
  "pagePath": "pages/message-board/message-board",
  "text": "留言",
  "iconPath": "assets/tab-message.png",
  "selectedIconPath": "assets/tab-message-active.png"
}
```

- [ ] **Step 3: 修改 profile.wxml — 添加留言墙按钮**

在 `menu-card` 的"修改信息"和"退出登录"之间插入：

```xml
<view class="menu-divider"></view>
<view class="menu-item" bindtap="goToMyWall">
  <text class="menu-icon">💬</text>
  <text class="menu-text">我的留言墙</text>
  <text class="menu-arrow">›</text>
</view>
```

- [ ] **Step 4: 修改 profile.js — 添加跳转方法**

在 `onLogout` 方法之前添加：

```js
goToMyWall() {
  const user = this.data.userInfo;
  if (user) {
    wx.navigateTo({
      url: `/pages/user-wall/user-wall?targetUserId=${user.id}&targetUserName=${user.name}`
    });
  }
},
```

- [ ] **Step 5: 在微信开发者工具中验证**

1. 打开微信开发者工具，编译项目
2. 确认底部 tabBar 出现"留言"选项
3. 点击进入留言板，发一条匿名留言，确认昵称带"匿名·"前缀
4. 登录账号，发一条留言，确认昵称为账号名
5. 进入"我的"页，点击"我的留言墙"，确认跳转正常
6. 在留言墙发留言、回复、删除，验证权限正确

- [ ] **Step 6: Commit**

```bash
git add miniprogram/app.json miniprogram/pages/profile/ miniprogram/assets/tab-message.png miniprogram/assets/tab-message-active.png
git commit -m "feat: register new pages in app.json and add wall entry in profile"
```

---

## 完成标志

所有 Task 完成后，项目具备以下能力：

- [ ] 公告留言板可匿名或登录发帖/回复
- [ ] 登录用户可删除自己在留言板上的帖子
- [ ] 任意用户的个人留言墙可被访问和留言
- [ ] 留言墙主人可删除墙上任意留言
- [ ] 匿名留言昵称带"匿名·"前缀
- [ ] 前台 tabBar 新增留言板入口
- [ ] profile 页新增"我的留言墙"入口
