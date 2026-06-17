// pages/welcome/welcome.js
const { TASTE_TAGS, TABOO_OPTIONS, SCENE_OPTIONS, CACHE_KEYS } = require('../../utils/constants');

// 热门城市列表
const HOT_CITIES = ['北京', '上海', '广州', '深圳', '成都', '杭州', '武汉', '重庆', '南京', '西安', '长沙', '天津', '苏州', '郑州', '东莞'];

Page({
  data: {
    step: 0,
    selectedCity: '',
    citySearch: '',
    citySuggestions: [],
    showCityPicker: false,
    locating: false,
    tasteTags: [],
    taboos: [],
    scenePreference: '不限',
    allTasteTags: TASTE_TAGS,
    allTabooOptions: TABOO_OPTIONS,
    allSceneOptions: SCENE_OPTIONS,
    utils: {
      isSelected: (arr, val) => (arr || []).includes(val)
    }
  },

  onLoad() {
    // 检查是否已经完成过引导
    const hasLaunched = wx.getStorageSync('hasLaunched');
    if (hasLaunched) {
      wx.switchTab({ url: '/pages/index/index' });
    }
  },

  nextStep() {
    if (this.data.step < 4) {
      this.setData({ step: this.data.step + 1 });
      if (this.data.step + 1 === 1 && !this.data.selectedCity) {
        this.getLocation();
      }
    }
  },

  // 获取定位
  getLocation() {
    this.setData({ locating: true });
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        // 逆地理编码获取城市名
        // 这里使用微信内置的 chooseLocation 备用方案
        this.setData({ locating: false });
      },
      fail: () => {
        this.setData({ locating: false, showCityPicker: true });
        this.setData({ citySuggestions: HOT_CITIES });
      }
    });
  },

  changeCity() {
    this.setData({ showCityPicker: true, citySuggestions: HOT_CITIES, citySearch: '' });
  },

  onCitySearch(e) {
    const keyword = e.detail.value;
    this.setData({ citySearch: keyword });
    if (keyword) {
      // 简单过滤（实际项目中可以用更完整的城市列表）
      const suggestions = HOT_CITIES.filter(c => c.includes(keyword));
      this.setData({ citySuggestions: suggestions.length > 0 ? suggestions : [keyword] });
    } else {
      this.setData({ citySuggestions: HOT_CITIES });
    }
  },

  selectCity(e) {
    const city = e.currentTarget.dataset.city;
    this.setData({
      selectedCity: city,
      showCityPicker: false,
      citySearch: ''
    });
  },

  toggleTaste(e) {
    const value = e.currentTarget.dataset.value;
    const tags = [...this.data.tasteTags];
    const idx = tags.indexOf(value);
    if (idx > -1) {
      tags.splice(idx, 1);
    } else {
      tags.push(value);
    }
    this.setData({ tasteTags: tags });
  },

  toggleTaboo(e) {
    const value = e.currentTarget.dataset.value;
    const taboos = [...this.data.taboos];
    const idx = taboos.indexOf(value);
    if (idx > -1) {
      taboos.splice(idx, 1);
    } else {
      taboos.push(value);
    }
    this.setData({ taboos });
  },

  selectScene(e) {
    const value = e.currentTarget.dataset.value;
    this.setData({ scenePreference: value });
  },

  async finishSetup() {
    wx.showLoading({ title: '保存中...' });

    const profile = {
      location_city: this.data.selectedCity || '北京',
      hometown_city: this.data.selectedCity || '北京',
      taste_tags: this.data.tasteTags,
      taboos: this.data.taboos,
      scene_preference: this.data.scenePreference,
      favorites: [],
      view_history: [],
      created_at: new Date().toISOString()
    };

    try {
      // 保存到云数据库
      const db = wx.cloud.database();
      const existRes = await db.collection('users').where({ _openid: '{openid}' }).get();
      
      if (existRes.data.length > 0) {
        await db.collection('users').doc(existRes.data[0]._id).update({
          data: profile
        });
      } else {
        await db.collection('users').add({ data: profile });
      }

      // 本地缓存
      wx.setStorageSync(CACHE_KEYS.USER_PROFILE, profile);
      wx.setStorageSync('hasLaunched', true);

      // 更新全局
      const app = getApp();
      app.setUserProfile(profile);
      app.globalData.isFirstLaunch = false;

      wx.hideLoading();
      
      // 跳转到首页
      wx.switchTab({ url: '/pages/index/index' });
    } catch (err) {
      wx.hideLoading();
      console.error('保存偏好失败:', err);
      
      // 即使云端保存失败，也本地保存并跳转
      wx.setStorageSync(CACHE_KEYS.USER_PROFILE, profile);
      wx.setStorageSync('hasLaunched', true);
      wx.switchTab({ url: '/pages/index/index' });
    }
  }
});
