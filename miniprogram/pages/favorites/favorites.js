// pages/favorites/favorites.js
const { CACHE_KEYS } = require('../../utils/constants');

Page({
  data: {
    favorites: [],
    loading: true,
    utils: {
      stringify: (obj) => JSON.stringify(obj)
    }
  },

  onShow() {
    this.loadFavorites();
  },

  async loadFavorites() {
    this.setData({ loading: true });

    try {
      const db = wx.cloud.database();
      
      // 获取用户收藏ID列表
      const userRes = await db.collection('users').where({ _openid: '{openid}' }).get();
      
      if (userRes.data.length === 0 || !userRes.data[0].favorites || userRes.data[0].favorites.length === 0) {
        this.setData({ favorites: [], loading: false });
        return;
      }

      const favIds = userRes.data[0].favorites;
      
      // 获取收藏的菜谱详情
      const _ = db.command;
      const recipeRes = await db.collection('recipes').where({
        _id: _.in(favIds.slice(0, 100))
      }).get();

      this.setData({ favorites: recipeRes.data, loading: false });
      
      // 更新本地缓存
      const profile = wx.getStorageSync(CACHE_KEYS.USER_PROFILE) || {};
      profile.favorites = favIds;
      wx.setStorageSync(CACHE_KEYS.USER_PROFILE, profile);

    } catch (err) {
      console.error('加载收藏失败:', err);
      
      // 尝试从缓存加载
      const cachedProfile = wx.getStorageSync(CACHE_KEYS.USER_PROFILE);
      if (cachedProfile && cachedProfile.favorites && cachedProfile.favorites.length > 0) {
        try {
          const db = wx.cloud.database();
          const _ = db.command;
          const recipeRes = await db.collection('recipes').where({
            _id: _.in(cachedProfile.favorites.slice(0, 100))
          }).get();
          this.setData({ favorites: recipeRes.data, loading: false });
        } catch (e2) {
          this.setData({ loading: false });
        }
      } else {
        this.setData({ loading: false });
      }
    }
  },

  viewDetail(e) {
    const dish = JSON.parse(e.currentTarget.dataset.dish);
    wx.navigateTo({
      url: `/pages/detail/detail?dish=${encodeURIComponent(JSON.stringify(dish))}`
    });
  },

  goHome() {
    wx.switchTab({ url: '/pages/index/index' });
  }
});
