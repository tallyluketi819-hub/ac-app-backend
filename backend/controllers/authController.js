const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'college_accounting_secret_key_2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const authController = {
  async register(req, res) {
    try {
      const { name, phone, password, school, grade } = req.body;

      // Validate required fields
      if (!name || !phone || !password) {
        return res.status(400).json({
          success: false,
          message: '姓名、手机号和密码不能为空'
        });
      }

      // Validate phone format
      if (!/^1[3-9]\d{9}$/.test(phone)) {
        return res.status(400).json({
          success: false,
          message: '手机号格式不正确'
        });
      }

      // Validate password length
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: '密码至少需要6位'
        });
      }

      // Check if phone already exists
      const existingUser = await User.findByPhone(phone);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: '该手机号已被注册'
        });
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user
      const result = await User.create({
        name,
        phone,
        password: hashedPassword,
        school: school || '',
        grade: grade || '大一'
      });

      const userId = result.insertId;

      // Generate JWT token
      const token = jwt.sign(
        { id: userId, phone, name },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      // Get user info (without password)
      const user = await User.findById(userId);

      return res.status(201).json({
        success: true,
        message: '注册成功',
        data: {
          token,
          user
        }
      });
    } catch (err) {
      console.error('Register error:', err);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  },

  async login(req, res) {
    try {
      const { phone, password } = req.body;

      // Validate required fields
      if (!phone || !password) {
        return res.status(400).json({
          success: false,
          message: '手机号和密码不能为空'
        });
      }

      // Find user by phone
      const user = await User.findByPhone(phone);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: '手机号或密码不正确'
        });
      }

      // Compare password
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message: '手机号或密码不正确'
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, phone: user.phone, name: user.name },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      // Return user info without password
      const { password: _, ...userWithoutPassword } = user;

      return res.json({
        success: true,
        message: '登录成功',
        data: {
          token,
          user: userWithoutPassword
        }
      });
    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  },

  async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      return res.json({
        success: true,
        data: { user }
      });
    } catch (err) {
      console.error('Get profile error:', err);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  },

  async updateProfile(req, res) {
    try {
      const { name, school, grade, avatar } = req.body;
      const userId = req.user.id;

      await User.update(userId, { name, school, grade, avatar });
      const updatedUser = await User.findById(userId);

      return res.json({
        success: true,
        message: '更新成功',
        data: { user: updatedUser }
      });
    } catch (err) {
      console.error('Update profile error:', err);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
};

module.exports = authController;
