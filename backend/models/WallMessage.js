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
