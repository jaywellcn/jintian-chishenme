// pages/settings/settings.js
const { TASTE_TAGS, TABOO_OPTIONS, SCENE_OPTIONS, CACHE_KEYS } = require('../../utils/constants');

Page({
  data: {
    profile: {
      location_city: '北京',
      hometown_city: '北京',
      taste_tags: [],
      taboos: [],
      scene_preference: '不限'
    },
    allTasteTags: TASTE_TAGS,
    allTabooOptions: TABOO_OPTIONS,
    allSceneOptions: SCENE_OPTIONS,
    utils: {
      isSelected: (arr, val) => (arr || []).includes(val)
    }
  },

  onShow() {
    this.loadProfile();
  },

  loadProfile() {
    const cached = wx.getStorageSync(CACHE_KEYS.USER_PROFILE);
    if (cached) {
      this.setData({ profile: cached });
    } else {
      // 从云数据库加载
      const app = getApp();
      app.getUserProfile().then(profile => {
        if (profile) {
          this.setData({ profile });
        }
      });
    }
  },

  changeCity() {
    wx.showModal({
      title: '修改城市',
      editable: true,
      placeholderText: '输入城市名',
      success: (res) => {
        if (res.confirm && res.content) {
          const profile = { ...this.data.profile };
          profile.location_city = res.content;
          profile.hometown_city = res.content;
          this.setData({ profile });
        }
      }
    });
  },

  toggleTaste(e) {
    const value = e.currentTarget.dataset.value;
    const profile = { ...this.data.profile };
    const tags = [...(profile.taste_tags || [])];
    const idx = tags.indexOf(value);
    if (idx > -1) {
      tags.splice(idx, 1);
    } else {
      tags.push(value);
    }
    profile.taste_tags = tags;
    this.setData({ profile });
  },

  toggleTaboo(e) {
    const value = e.currentTarget.dataset.value;
    const profile = { ...this.data.profile };
    const taboos = [...(profile.taboos || [])];
    const idx = taboos.indexOf(value);
    if (idx > -1) {
      taboos.splice(idx, 1);
    } else {
      taboos.push(value);
    }
    profile.taboos = taboos;
    this.setData({ profile });
  },

  selectScene(e) {
    const value = e.currentTarget.dataset.value;
    const profile = { ...this.data.profile };
    profile.scene_preference = value;
    this.setData({ profile });
  },

  async savePreferences() {
    wx.showLoading({ title: '保存中...' });

    const profile = { ...this.data.profile };
    profile.updated_at = new Date().toISOString();

    try {
      const db = wx.cloud.database();
      const existRes = await db.collection('users').where({ _openid: '{openid}' }).get();
      
      if (existRes.data.length > 0) {
        await db.collection('users').doc(existRes.data[0]._id).update({
          data: profile
        });
      } else {
        profile.created_at = new Date().toISOString();
        await db.collection('users').add({ data: profile });
      }

      wx.setStorageSync(CACHE_KEYS.USER_PROFILE, profile);
      getApp().setUserProfile(profile);

      wx.hideLoading();
      wx.showToast({ title: '已保存', icon: 'success' });
      
      // 清除推荐缓存，让首页重新推荐
      wx.removeStorageSync(CACHE_KEYS.TODAY_RECOMMEND);

    } catch (err) {
      wx.hideLoading();
      console.error('保存失败:', err);
      wx.showToast({ title: '保存失败，请重试', icon: 'none' });
    }
  }
});
