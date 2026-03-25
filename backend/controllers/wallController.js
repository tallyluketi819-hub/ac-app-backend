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
        target_user_id: targetUserId,
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
