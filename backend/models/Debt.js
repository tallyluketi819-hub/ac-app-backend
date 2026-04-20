const db = require('../config/db');

const Debt = {
  async create(data) {
    const { group_id, from_user_id, to_user_id, amount } = data;
    const [result] = await db.execute(
      'INSERT INTO debts (group_id, from_user_id, to_user_id, amount, is_settled) VALUES (?, ?, ?, ?, 0)',
      [group_id, from_user_id, to_user_id, amount]
    );
    return result;
  },

  async findByGroup(groupId) {
    const [rows] = await db.execute(
      `SELECT d.*,
        fu.name AS from_user_name,
        tu.name AS to_user_name
       FROM debts d
       JOIN users fu ON d.from_user_id = fu.id
       JOIN users tu ON d.to_user_id = tu.id
       WHERE d.group_id = ?
       ORDER BY d.is_settled ASC, d.created_at DESC`,
      [groupId]
    );
    return rows;
  },

  async findById(id) {
    const [rows] = await db.execute('SELECT * FROM debts WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async settleDebt(id, userId) {
    // Verify the user is involved in this debt
    const [debt] = await db.execute(
      'SELECT * FROM debts WHERE id = ? AND (from_user_id = ? OR to_user_id = ?)',
      [id, userId, userId]
    );

    if (!debt[0]) {
      throw new Error('债务不存在或无权操作');
    }

    const [result] = await db.execute(
      'UPDATE debts SET is_settled = 1, settled_at = NOW() WHERE id = ?',
      [id]
    );
    return result;
  },

  async deleteByGroup(groupId) {
    const [result] = await db.execute(
      'DELETE FROM debts WHERE group_id = ? AND is_settled = 0',
      [groupId]
    );
    return result;
  },

  async bulkCreate(debts) {
    if (!debts || debts.length === 0) return;

    const values = debts.map(d => [d.group_id, d.from_user_id, d.to_user_id, d.amount]);
    const placeholders = values.map(() => '(?, ?, ?, ?, 0)').join(', ');
    const flatValues = values.flat();

    const [result] = await db.execute(
      `INSERT INTO debts (group_id, from_user_id, to_user_id, amount, is_settled) VALUES ${placeholders}`,
      flatValues
    );
    return result;
  }
};

module.exports = Debt;
