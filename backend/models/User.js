const db = require('../config/db');

const User = {
  async create(data) {
    const { name, phone, password, school, grade, avatar } = data;
    const [result] = await db.execute(
      'INSERT INTO users (name, phone, password, school, grade, avatar) VALUES (?, ?, ?, ?, ?, ?)',
      [name, phone, password, school || null, grade || '大一', avatar || null]
    );
    return result;
  },

  async findByPhone(phone) {
    const [rows] = await db.execute(
      'SELECT * FROM users WHERE phone = ?',
      [phone]
    );
    return rows[0] || null;
  },

  async findById(id) {
    const [rows] = await db.execute(
      'SELECT id, name, phone, school, grade, avatar, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  async update(id, data) {
    const { name, school, grade, avatar } = data;
    const [result] = await db.execute(
      'UPDATE users SET name = ?, school = ?, grade = ?, avatar = ? WHERE id = ?',
      [name, school, grade, avatar, id]
    );
    return result;
  }
};

module.exports = User;
