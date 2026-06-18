// pages/favorites/favorites.js
const { CACHE_KEYS } = require('../../utils/constants');

Page({
  data: {
    favorites: [],
    loading: true
  },

  onShow() {
    this.loadFavorites();
  },

  async loadFavorites() {
    this.setData({ loading: true });

    try {
      const db = wx.cloud.database();
      const userRes = await db.collection('users').where({ _openid: '{openid}' }).get();
      
      if (userRes.data.length === 0 || !userRes.data[0].favorites || userRes.data[0].favorites.length === 0) {
        this.setData({ favorites: [], loading: false });
        return;
      }

      const favIds = userRes.data[0].favorites;
      const _ = db.command;
      const recipeRes = await db.collection('recipes').where({
        _id: _.in(favIds.slice(0, 100))
      }).get();

      this.setData({ favorites: recipeRes.data, loading: false });
      
      const profile = wx.getStorageSync(CACHE_KEYS.USER_PROFILE) || {};
      profile.favorites = favIds;
      wx.setStorageSync(CACHE_KEYS.USER_PROFILE, profile);

    } catch (err) {
      console.error('加载收藏失败:', err);
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

  async removeFavorite(e) {
    const dishId = e.currentTarget.dataset.id;
    const index = e.currentTarget.dataset.index;

    wx.showModal({
      title: '取消收藏',
      content: '确定要取消收藏这道菜吗？',
      success: async (res) => {
        if (!res.confirm) return;

        try {
          const db = wx.cloud.database();
          const _ = db.command;
          await db.collection('users').where({ _openid: '{openid}' }).update({
            data: { favorites: _.pull(dishId) }
          });

          // 更新本地列表
          const favorites = this.data.favorites.filter((_, i) => i !== index);
          this.setData({ favorites });

          // 更新缓存
          const profile = wx.getStorageSync(CACHE_KEYS.USER_PROFILE) || {};
          if (profile.favorites) {
            profile.favorites = profile.favorites.filter(f => f !== dishId);
            wx.setStorageSync(CACHE_KEYS.USER_PROFILE, profile);
          }

          wx.showToast({ title: '已取消收藏', icon: 'none' });
        } catch (err) {
          console.error('取消收藏失败:', err);
          wx.showToast({ title: '操作失败', icon: 'none' });
        }
      }
    });
  },

  goHome() {
    wx.switchTab({ url: '/pages/index/index' });
  }
});
