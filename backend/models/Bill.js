const db = require('../config/db');

const Bill = {
  async create(data) {
    const { user_id, amount, type, category, note, date } = data;
    const [result] = await db.execute(
      'INSERT INTO bills (user_id, amount, type, category, note, date) VALUES (?, ?, ?, ?, ?, ?)',
      [user_id, amount, type, category, note || null, date]
    );
    return result;
  },

  async findByUser(userId, month) {
    let query = 'SELECT * FROM bills WHERE user_id = ?';
    const params = [userId];

    if (month) {
      // month format: YYYY-MM
      query += ' AND DATE_FORMAT(date, "%Y-%m") = ?';
      params.push(month);
    }

    query += ' ORDER BY date DESC, created_at DESC';

    const [rows] = await db.execute(query, params);
    return rows;
  },

  async findById(id) {
    const [rows] = await db.execute('SELECT * FROM bills WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async update(id, data) {
    const { amount, type, category, note, date } = data;
    const [result] = await db.execute(
      'UPDATE bills SET amount = ?, type = ?, category = ?, note = ?, date = ? WHERE id = ?',
      [amount, type, category, note || null, date, id]
    );
    return result;
  },

  async delete(id) {
    const [result] = await db.execute('DELETE FROM bills WHERE id = ?', [id]);
    return result;
  },

  async getMonthlyStats(userId, month) {
    const [rows] = await db.execute(
      `SELECT
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS total_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expense,
        COUNT(*) AS total_count
       FROM bills
       WHERE user_id = ? AND DATE_FORMAT(date, '%Y-%m') = ?`,
      [userId, month]
    );
    return rows[0];
  },

  async getCategoryStats(userId, month) {
    const [rows] = await db.execute(
      `SELECT
        category,
        type,
        SUM(amount) AS total,
        COUNT(*) AS count
       FROM bills
       WHERE user_id = ? AND DATE_FORMAT(date, '%Y-%m') = ?
       GROUP BY category, type
       ORDER BY total DESC`,
      [userId, month]
    );
    return rows;
  },

  async getTrend(userId, months = 6) {
    const [rows] = await db.execute(
      `SELECT
        DATE_FORMAT(date, '%Y-%m') AS month,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS total_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expense
       FROM bills
       WHERE user_id = ?
         AND date >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL (? - 1) MONTH), '%Y-%m-01')
       GROUP BY month
       ORDER BY month ASC`,
      [userId, months]
    );
    return rows;
  },

  async getSchoolStats(school, month) {
    const [rows] = await db.execute(
      `SELECT
        b.category,
        AVG(b.amount) AS avg_amount,
        SUM(b.amount) AS total_amount,
        COUNT(DISTINCT b.user_id) AS user_count
       FROM bills b
       JOIN users u ON b.user_id = u.id
       WHERE u.school = ? AND DATE_FORMAT(b.date, '%Y-%m') = ? AND b.type = 'expense'
       GROUP BY b.category
       ORDER BY total_amount DESC`,
      [school, month]
    );
    return rows;
  },

  async getSchoolUserCount(school) {
    const [rows] = await db.execute(
      'SELECT COUNT(*) AS count FROM users WHERE school = ?',
      [school]
    );
    return rows[0].count;
  }
};

module.exports = Bill;
