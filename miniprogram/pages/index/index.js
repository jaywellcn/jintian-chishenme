// pages/index/index.js - 首页逻辑
const { getSolarTerm, getDietRegion, formatDate } = require('../../utils/solar-terms');
const { DIFFICULTY_MAP, SEASON_COLOR, CACHE_KEYS } = require('../../utils/constants');

Page({
  data: {
    solarTerm: {},
    seasonColor: SEASON_COLOR['春'],
    recommendation: null,
    loading: true,
    error: '',
    hasPreferences: false,
    isFavorited: false,
    favorites: [],
    todayDate: '',
    difficultyStars: [],
  },

  onLoad() {
    const hasLaunched = wx.getStorageSync('hasLaunched');
    if (!hasLaunched) {
      wx.redirectTo({ url: '/pages/welcome/welcome' });
      return;
    }
    this.init();
  },

  onShow() {
    const app = getApp();
    if (app.globalData.userProfile) {
      this.setData({ hasPreferences: true });
    }
    const lastDate = wx.getStorageSync(CACHE_KEYS.LAST_RECOMMEND_DATE);
    const today = formatDate(new Date());
    if (lastDate !== today) {
      this.loadRecommendation();
    }
  },

  onPullDownRefresh() {
    this.loadRecommendation().then(() => wx.stopPullDownRefresh());
  },

  async init() {
    const today = formatDate(new Date());
    const solarTerm = getSolarTerm(new Date());
    const seasonColor = SEASON_COLOR[solarTerm.season] || SEASON_COLOR['春'];
    
    this.setData({ solarTerm, seasonColor, todayDate: today });

    const app = getApp();
    const cachedProfile = wx.getStorageSync(CACHE_KEYS.USER_PROFILE);
    
    if (cachedProfile) {
      this.setData({ hasPreferences: true, favorites: cachedProfile.favorites || [] });
      app.setUserProfile(cachedProfile);
    } else {
      try {
        const db = wx.cloud.database();
        const res = await db.collection('users').where({ _openid: '{openid}' }).get();
        if (res.data.length > 0) {
          const profile = res.data[0];
          this.setData({ hasPreferences: true, favorites: profile.favorites || [] });
          wx.setStorageSync(CACHE_KEYS.USER_PROFILE, profile);
          app.setUserProfile(profile);
        }
      } catch (e) {}
    }

    await this.loadRecommendation();
  },

  // 本地推荐引擎
  async loadRecommendation() {
    this.setData({ loading: true, error: '' });

    try {
      const today = formatDate(new Date());
      const cachedRecommend = wx.getStorageSync(CACHE_KEYS.TODAY_RECOMMEND);
      
      if (cachedRecommend && cachedRecommend.date === today && cachedRecommend.data) {
        this.displayRecommendation(cachedRecommend.data);
        return;
      }

      const solarTerm = getSolarTerm(new Date());
      const profile = wx.getStorageSync(CACHE_KEYS.USER_PROFILE) || {};
      const locationCity = profile.location_city || '北京';
      const tasteTags = profile.taste_tags || [];
      const taboos = profile.taboos || [];
      const scenePreference = profile.scene_preference || '不限';
      const viewHistory = profile.view_history || [];

      // 从数据库获取菜谱
      const db = wx.cloud.database();
      let candidates = [];
      
      try {
        const recipeRes = await db.collection('recipes')
          .where({ solar_term: solarTerm.name })
          .limit(100)
          .get();
        candidates = recipeRes.data;
      } catch (e) {
        console.log('DB query failed:', e.message);
      }

      // 兜底
      if (candidates.length === 0) {
        candidates = this.getFallbackRecipes(solarTerm.name);
      }

      // 场景过滤
      if (scenePreference !== '不限') {
        let f = candidates.filter(r => r.category === scenePreference);
        if (f.length > 0) candidates = f;
      }

      // 忌口过滤
      if (taboos.length > 0) {
        let f = candidates.filter(r => !r.main_ingredients.some(i => taboos.some(t => i.includes(t))));
        if (f.length > 0) candidates = f;
      }

      // 地域加权
      const userRegion = getDietRegion(locationCity);
      candidates.sort((a, b) => {
        const aM = (a.suitable_regions || []).includes(userRegion) ? 3 : 1;
        const bM = (b.suitable_regions || []).includes(userRegion) ? 3 : 1;
        return bM - aM;
      });

      // 口味加权
      if (tasteTags.length > 0) {
        candidates.sort((a, b) => {
          return (b.tags || []).filter(t => tasteTags.includes(t)).length -
                 (a.tags || []).filter(t => tasteTags.includes(t)).length;
        });
      }

      // 排除已展示
      const todayShown = viewHistory.filter(h => h.date === today).map(h => h.dishId);
      let final = candidates.filter(c => !todayShown.includes(c._id || c.id));
      if (final.length === 0) final = candidates;

      // 选一个
      const topN = final.slice(0, Math.min(3, final.length));
      const selected = topN[Math.floor(Math.random() * topN.length)];

      const result = {
        dish: selected,
        solarTerm: solarTerm,
        reason: selected.seasonal_reason || selected.name,
        timestamp: Date.now()
      };

      wx.setStorageSync(CACHE_KEYS.TODAY_RECOMMEND, { date: today, data: result });
      wx.setStorageSync(CACHE_KEYS.LAST_RECOMMEND_DATE, today);
      this.displayRecommendation(result);

    } catch (err) {
      console.error('推荐引擎异常:', err);
      const cached = wx.getStorageSync(CACHE_KEYS.TODAY_RECOMMEND);
      if (cached && cached.data) {
        this.displayRecommendation(cached.data);
      } else {
        this.setData({ loading: false, error: '网络开小差了，下拉刷新重试' });
      }
    }
  },

  // 兜底菜谱（数据库无数据时）
  getFallbackRecipes(solarTerm) {
    const map = {
      '芒种': [
        { name: '冬瓜薏米排骨汤', category: '简单快手', cooking_time: 30, difficulty: '简单', meal_type: '午餐',
          main_ingredients: ['冬瓜', '排骨', '薏米'], tags: ['清淡', '鲜香'], suitable_regions: ['华南','华东','华中'],
          seasonal_reason: '芒种湿热，冬瓜清热利尿正当季。清淡鲜香，正适合这个时节。' },
        { name: '苦瓜炒蛋', category: '简单快手', cooking_time: 15, difficulty: '简单', meal_type: '午餐',
          main_ingredients: ['苦瓜', '鸡蛋'], tags: ['清淡', '家常'], suitable_regions: ['华南','华中','西南'],
          seasonal_reason: '芒种吃苦，清热解暑。苦瓜虽苦，回甘悠长。' },
        { name: '凉拌黄瓜', category: '外卖', cooking_time: 10, difficulty: '简单', meal_type: '午餐',
          main_ingredients: ['黄瓜', '蒜'], tags: ['清淡', '开胃'], suitable_regions: ['华北','东北','华东'],
          seasonal_reason: '夏天吃瓜正当季，黄瓜清脆爽口开胃。' },
        { name: '麻辣香锅', category: '外卖', cooking_time: 30, difficulty: '中等', meal_type: '午餐',
          main_ingredients: ['牛肉', '藕', '土豆', '豆皮'], tags: ['麻辣', '浓郁', '下饭'], suitable_regions: ['西南','华中'],
          seasonal_reason: '芒种湿气重，麻辣祛湿开胃，越吃越香。' },
        { name: '蒜蓉西兰花', category: '自己做', cooking_time: 15, difficulty: '简单', meal_type: '午餐',
          main_ingredients: ['西兰花', '蒜'], tags: ['清淡', '家常'], suitable_regions: ['华北','华东','华南'],
          seasonal_reason: '夏季时蔬鲜嫩，蒜蓉提香，简单健康。' },
      ]
    };
    return map[solarTerm] || map['芒种'];
  },

  displayRecommendation(data) {
    const dish = data.dish;
    const difficultyInfo = DIFFICULTY_MAP[dish.difficulty] || { stars: '⭐' };
    const difficultyStars = difficultyInfo.stars.split('');
    const isFavorited = this.data.favorites.some(f => f === dish._id || f === dish.id);

    const categoryClassMap = {
      '外卖': 'cat-takeout',
      '自己做': 'cat-cook',
      '简单快手': 'cat-quick'
    };
    const categoryClass = categoryClassMap[dish.category] || 'cat-takeout';

    this.setData({
      recommendation: dish,
      categoryClass,
      difficultyStars,
      isFavorited,
      loading: false,
      error: '',
      solarTerm: data.solarTerm || this.data.solarTerm,
    });

    getApp().globalData.todayRecommendation = data;
  },

  async changeOne() {
    this.setData({ loading: true });
    // 清除当日缓存强制刷新
    wx.removeStorageSync(CACHE_KEYS.TODAY_RECOMMEND);
    await this.loadRecommendation();
  },

  async toggleFavorite() {
    const dish = this.data.recommendation;
    if (!dish) return;

    const dishId = dish._id || dish.id;
    const isFavorited = !this.data.isFavorited;
    this.setData({ isFavorited });

    try {
      const db = wx.cloud.database();
      const _ = db.command;
      
      if (isFavorited) {
        await db.collection('users').where({ _openid: '{openid}' }).update({
          data: { favorites: _.push(dishId) }
        });
        wx.showToast({ title: '已收藏 ❤️', icon: 'none' });
      } else {
        await db.collection('users').where({ _openid: '{openid}' }).update({
          data: { favorites: _.pull(dishId) }
        });
        wx.showToast({ title: '已取消收藏', icon: 'none' });
      }

      const favorites = isFavorited 
        ? [...this.data.favorites, dishId]
        : this.data.favorites.filter(f => f !== dishId);
      this.setData({ favorites });
      
      const profile = wx.getStorageSync(CACHE_KEYS.USER_PROFILE) || {};
      profile.favorites = favorites;
      wx.setStorageSync(CACHE_KEYS.USER_PROFILE, profile);

    } catch (err) {
      console.error('收藏操作失败:', err);
      this.setData({ isFavorited: !isFavorited });
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  viewDetail() {
    const dish = this.data.recommendation;
    if (!dish) return;
    wx.navigateTo({
      url: `/pages/detail/detail?dish=${encodeURIComponent(JSON.stringify(dish))}`
    });
  },

  goSettings() {
    wx.switchTab({ url: '/pages/settings/settings' });
  }
});
