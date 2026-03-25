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

      const parent = await Message.findById(parentId);
      if (!parent) {
        return res.status(404).json({ success: false, message: '留言不存在' });
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
