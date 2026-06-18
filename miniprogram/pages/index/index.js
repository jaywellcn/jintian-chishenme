// pages/index/index.js - 首页逻辑
const { getSolarTerm, formatDate } = require('../../utils/solar-terms');
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
    // 检查是否首次使用
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
      this.setData({
        hasPreferences: true,
        favorites: cachedProfile.favorites || []
      });
      app.setUserProfile(cachedProfile);
    } else {
      const profile = await app.getUserProfile();
      if (profile) {
        this.setData({
          hasPreferences: true,
          favorites: profile.favorites || []
        });
        wx.setStorageSync(CACHE_KEYS.USER_PROFILE, profile);
      }
    }

    await this.loadRecommendation();
  },

  async loadRecommendation() {
    this.setData({ loading: true, error: '' });

    try {
      const today = formatDate(new Date());
      const cachedRecommend = wx.getStorageSync(CACHE_KEYS.TODAY_RECOMMEND);
      
      if (cachedRecommend && cachedRecommend.date === today && cachedRecommend.data) {
        this.displayRecommendation(cachedRecommend.data);
        return;
      }

      const res = await wx.cloud.callFunction({
        name: 'getRecommendation',
        data: { timestamp: Date.now() }
      });

      if (res.result && res.result.success && res.result.data) {
        const data = res.result.data;
        wx.setStorageSync(CACHE_KEYS.TODAY_RECOMMEND, { date: today, data: data });
        wx.setStorageSync(CACHE_KEYS.LAST_RECOMMEND_DATE, today);
        this.displayRecommendation(data);
      } else {
        throw new Error(res.result?.error || '获取推荐失败');
      }
    } catch (err) {
      console.error('加载推荐失败:', err);
      const cachedRecommend = wx.getStorageSync(CACHE_KEYS.TODAY_RECOMMEND);
      if (cachedRecommend && cachedRecommend.data) {
        this.displayRecommendation(cachedRecommend.data);
        this.setData({ error: '' });
      } else {
        this.setData({ loading: false, error: '网络开小差了，下拉刷新重试' });
      }
    }
  },

  displayRecommendation(data) {
    const dish = data.dish;
    const difficultyInfo = DIFFICULTY_MAP[dish.difficulty] || { stars: '⭐' };
    const difficultyStars = difficultyInfo.stars.split('');
    const isFavorited = this.data.favorites.some(f => f === dish._id || f === dish.id);

    // category Chinese to English class name mapping
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
    try {
      const res = await wx.cloud.callFunction({
        name: 'getRecommendation',
        data: { 
          timestamp: Date.now(),
          exclude: this.data.recommendation?._id || this.data.recommendation?.id
        }
      });

      if (res.result && res.result.success && res.result.data) {
        this.displayRecommendation(res.result.data);
        wx.vibrateShort({ type: 'light' });
      } else {
        throw new Error(res.result?.error || '换一个失败');
      }
    } catch (err) {
      console.error('换一个失败:', err);
      this.setData({ loading: false });
      wx.showToast({ title: '稍后再试', icon: 'none' });
    }
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
