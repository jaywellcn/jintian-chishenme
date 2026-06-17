// utils/constants.js - 常量定义

// 口味标签
const TASTE_TAGS = [
  { value: '麻辣', label: '麻辣', emoji: '🌶️' },
  { value: '清淡', label: '清淡', emoji: '🥬' },
  { value: '酸甜', label: '酸甜', emoji: '🍋' },
  { value: '鲜香', label: '鲜香', emoji: '🦐' },
  { value: '浓郁', label: '浓郁', emoji: '🧈' },
  { value: '开胃', label: '开胃', emoji: '🤤' },
  { value: '家常', label: '家常', emoji: '🏠' },
  { value: '下饭', label: '下饭', emoji: '🍚' }
];

// 忌口选项
const TABOO_OPTIONS = [
  { value: '香菜', label: '香菜' },
  { value: '葱', label: '葱' },
  { value: '蒜', label: '蒜' },
  { value: '姜', label: '姜' },
  { value: '辣椒', label: '辣椒' },
  { value: '海鲜', label: '海鲜' },
  { value: '猪肉', label: '猪肉' },
  { value: '牛肉', label: '牛肉' },
  { value: '羊肉', label: '羊肉' },
  { value: '鸡蛋', label: '鸡蛋' },
  { value: '花生', label: '花生' },
  { value: '芝麻', label: '芝麻' }
];

// 场景选项
const SCENE_OPTIONS = [
  { value: '不限', label: '不限', desc: '所有场景都推荐', emoji: '🎲' },
  { value: '外卖', label: '外卖', desc: '适合点外卖的菜', emoji: '🛵' },
  { value: '自己做', label: '自己做', desc: '有时间好好做一顿', emoji: '👨‍🍳' },
  { value: '简单快手', label: '简单快手', desc: '20分钟内搞定', emoji: '⚡' }
];

// 难度映射
const DIFFICULTY_MAP = {
  '简单': { stars: '⭐', color: '#4CAF50' },
  '中等': { stars: '⭐⭐', color: '#FF9800' },
  '困难': { stars: '⭐⭐⭐', color: '#F44336' }
};

// 场景标签颜色
const CATEGORY_COLOR = {
  '外卖': { bg: '#FFF3E0', text: '#E65100' },
  '自己做': { bg: '#E8F5E9', text: '#2E7D32' },
  '简单快手': { bg: '#E3F2FD', text: '#1565C0' }
};

// 季节颜色
const SEASON_COLOR = {
  '春': { primary: '#66BB6A', light: '#E8F5E9', bg: '#F1F8E9' },
  '夏': { primary: '#FF7043', light: '#FBE9E7', bg: '#FFF3E0' },
  '秋': { primary: '#FFA726', light: '#FFF3E0', bg: '#FFF8E1' },
  '冬': { primary: '#42A5F5', light: '#E3F2FD', bg: '#E8EAF6' }
};

// 缓存 key
const CACHE_KEYS = {
  USER_PROFILE: 'user_profile',
  TODAY_RECOMMEND: 'today_recommend',
  VIEW_HISTORY: 'view_history',
  HAS_LAUNCHED: 'hasLaunched',
  LAST_RECOMMEND_DATE: 'last_recommend_date'
};

module.exports = {
  TASTE_TAGS,
  TABOO_OPTIONS,
  SCENE_OPTIONS,
  DIFFICULTY_MAP,
  CATEGORY_COLOR,
  SEASON_COLOR,
  CACHE_KEYS
};
