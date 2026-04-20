const db = require('../config/db');

const Group = {
  async create(data) {
    const { name, description, creator_id } = data;
    const [result] = await db.execute(
      'INSERT INTO `groups` (name, description, creator_id) VALUES (?, ?, ?)',
      [name, description || null, creator_id]
    );
    return result;
  },

  async findByUser(userId) {
    const [rows] = await db.execute(
      `SELECT g.*,
        (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) AS member_count
       FROM \`groups\` g
       JOIN group_members gm ON g.id = gm.group_id
       WHERE gm.user_id = ?
       ORDER BY g.created_at DESC`,
      [userId]
    );
    return rows;
  },

  async findById(id) {
    const [rows] = await db.execute(
      'SELECT * FROM `groups` WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  async addMember(groupId, userId) {
    const [result] = await db.execute(
      'INSERT IGNORE INTO group_members (group_id, user_id) VALUES (?, ?)',
      [groupId, userId]
    );
    return result;
  },

  async getMembers(groupId) {
    const [rows] = await db.execute(
      `SELECT u.id, u.name, u.phone, u.avatar, gm.joined_at
       FROM group_members gm
       JOIN users u ON gm.user_id = u.id
       WHERE gm.group_id = ?
       ORDER BY gm.joined_at ASC`,
      [groupId]
    );
    return rows;
  },

  async isMember(groupId, userId) {
    const [rows] = await db.execute(
      'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    );
    return rows.length > 0;
  },

  async addGroupBill(data) {
    const { group_id, payer_id, amount, description, participants } = data;
    const [result] = await db.execute(
      'INSERT INTO group_bills (group_id, payer_id, amount, description, participants) VALUES (?, ?, ?, ?, ?)',
      [group_id, payer_id, amount, description || null, JSON.stringify(participants)]
    );
    return result;
  },

  async getGroupBills(groupId) {
    const [rows] = await db.execute(
      `SELECT gb.*, u.name AS payer_name
       FROM group_bills gb
       JOIN users u ON gb.payer_id = u.id
       WHERE gb.group_id = ?
       ORDER BY gb.created_at DESC`,
      [groupId]
    );
    // Parse participants JSON
    return rows.map(row => ({
      ...row,
      participants: typeof row.participants === 'string'
        ? JSON.parse(row.participants)
        : row.participants
    }));
  }
};

module.exports = Group;
