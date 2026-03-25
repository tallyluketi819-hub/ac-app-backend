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
