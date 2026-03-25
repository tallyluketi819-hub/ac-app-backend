-- College Student Accounting App Database Schema
-- Created for WeChat Mini Program

CREATE DATABASE IF NOT EXISTS college_accounting CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE college_accounting;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    school VARCHAR(100),
    grade VARCHAR(20) DEFAULT '大一',
    avatar VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bills table (personal income/expense records)
CREATE TABLE IF NOT EXISTS bills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    type ENUM('income', 'expense') NOT NULL,
    category VARCHAR(50) NOT NULL,
    note VARCHAR(255),
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Groups table (for shared expense tracking)
CREATE TABLE IF NOT EXISTS `groups` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    creator_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Group members table
CREATE TABLE IF NOT EXISTS group_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    user_id INT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_member (group_id, user_id),
    FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Group bills table (shared expenses)
CREATE TABLE IF NOT EXISTS group_bills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    payer_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description VARCHAR(255),
    participants JSON NOT NULL COMMENT 'JSON array of user_ids who share this expense',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
    FOREIGN KEY (payer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Debts table (who owes whom in a group)
CREATE TABLE IF NOT EXISTS debts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    from_user_id INT NOT NULL COMMENT 'User who owes money',
    to_user_id INT NOT NULL COMMENT 'User who is owed money',
    amount DECIMAL(10, 2) NOT NULL,
    is_settled TINYINT(1) DEFAULT 0,
    settled_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_bills_user_id ON bills(user_id);
CREATE INDEX idx_bills_date ON bills(date);
CREATE INDEX idx_bills_type ON bills(type);
CREATE INDEX idx_bills_category ON bills(category);
CREATE INDEX idx_bills_user_date ON bills(user_id, date);

CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);

CREATE INDEX idx_group_bills_group_id ON group_bills(group_id);
CREATE INDEX idx_group_bills_payer_id ON group_bills(payer_id);

CREATE INDEX idx_debts_group_id ON debts(group_id);
CREATE INDEX idx_debts_from_user ON debts(from_user_id);
CREATE INDEX idx_debts_to_user ON debts(to_user_id);
CREATE INDEX idx_debts_settled ON debts(is_settled);

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

-- Sample data (optional, for testing)
-- INSERT INTO users (name, phone, password, school, grade) VALUES
-- ('张三', '13800138001', '$2a$10$hashedpassword', '北京大学', '大二'),
-- ('李四', '13800138002', '$2a$10$hashedpassword', '北京大学', '大三');
