/**
 * Utility helper functions
 */

/**
 * Format a Date object or date string to YYYY-MM-DD
 */
function formatDate(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format date to YYYY-MM
 */
function formatMonth(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Format a number amount to 2 decimal places with comma separators
 */
function formatAmount(amount) {
  const num = parseFloat(amount);
  if (isNaN(num)) return '0.00';
  return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Get emoji icon for a given expense/income category
 */
function getCategoryIcon(category) {
  const icons = {
    // Expense categories
    '餐饮': '🍜',
    '交通': '🚗',
    '娱乐': '🎮',
    '学习': '📚',
    '日用': '🛒',
    '医疗': '💊',
    '服装': '👕',
    '其他': '📦',
    // Income categories
    '生活费': '💰',
    '兼职': '💼',
    '奖学金': '🏆',
    '其他收入': '💵',
    // Fallback
    'default': '💳'
  };
  return icons[category] || icons['default'];
}

/**
 * Get color for a category (for charts)
 */
function getCategoryColor(category) {
  const colors = {
    '餐饮': '#FF7043',
    '交通': '#42A5F5',
    '娱乐': '#AB47BC',
    '学习': '#26A69A',
    '日用': '#FFA726',
    '医疗': '#EF5350',
    '服装': '#EC407A',
    '其他': '#78909C',
    '生活费': '#66BB6A',
    '兼职': '#4CAF50',
    '奖学金': '#FFD700',
    '其他收入': '#81C784'
  };
  return colors[category] || '#9E9E9E';
}

/**
 * Get current month as YYYY-MM string
 */
function getCurrentMonth() {
  return formatMonth(new Date());
}

/**
 * Get previous month as YYYY-MM string
 */
function getPrevMonth(monthStr) {
  const [year, month] = monthStr.split('-').map(Number);
  const date = new Date(year, month - 2, 1);
  return formatMonth(date);
}

/**
 * Get next month as YYYY-MM string
 */
function getNextMonth(monthStr) {
  const [year, month] = monthStr.split('-').map(Number);
  const date = new Date(year, month, 1);
  return formatMonth(date);
}

/**
 * Format month string YYYY-MM to Chinese display like "2024年3月"
 */
function formatMonthDisplay(monthStr) {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-');
  return `${year}年${parseInt(month)}月`;
}

/**
 * Truncate text to max length
 */
function truncateText(text, maxLen) {
  if (!text) return '';
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
}

module.exports = {
  formatDate,
  formatMonth,
  formatAmount,
  getCategoryIcon,
  getCategoryColor,
  getCurrentMonth,
  getPrevMonth,
  getNextMonth,
  formatMonthDisplay,
  truncateText
};
