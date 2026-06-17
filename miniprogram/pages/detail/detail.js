// pages/detail/detail.js
const { SEASON_COLOR, CACHE_KEYS } = require('../../utils/constants');
const { getSolarTerm } = require('../../utils/solar-terms');

Page({
  data: {
    dish: {},
    seasonColor: SEASON_COLOR['春'],
    isFavorited: false,
    seasonalIngredients: []
  },

  onLoad(options) {
    if (options.dish) {
      try {
        const dish = JSON.parse(decodeURIComponent(options.dish));
        this.setData({ dish });
        this.checkFavorite(dish);
        
        const solarTerm = getSolarTerm(new Date());
        this.setData({ 
          seasonColor: SEASON_COLOR[solarTerm.season] || SEASON_COLOR['春'],
          seasonalIngredients: solarTerm.detail?.key_ingredients || []
        });
      } catch (e) {
        console.error('解析菜品数据失败:', e);
        wx.showToast({ title: '数据异常', icon: 'none' });
      }
    }
  },

  checkFavorite(dish) {
    const profile = wx.getStorageSync(CACHE_KEYS.USER_PROFILE);
    if (profile && profile.favorites) {
      const dishId = dish._id || dish.id;
      this.setData({
        isFavorited: profile.favorites.some(f => f === dishId)
      });
    }
  },

  isSeasonal(ingredient) {
    return this.data.seasonalIngredients.some(si => 
      ingredient.includes(si) || si.includes(ingredient)
    );
  },

  async toggleFavorite() {
    const dish = this.data.dish;
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

      const profile = wx.getStorageSync(CACHE_KEYS.USER_PROFILE) || {};
      profile.favorites = isFavorited 
        ? [...(profile.favorites || []), dishId]
        : (profile.favorites || []).filter(f => f !== dishId);
      wx.setStorageSync(CACHE_KEYS.USER_PROFILE, profile);

    } catch (err) {
      console.error('收藏操作失败:', err);
      this.setData({ isFavorited: !isFavorited });
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  goBack() {
    wx.navigateBack();
  }
});
