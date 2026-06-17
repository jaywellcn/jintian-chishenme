// app.js - 今天吃什么小程序入口
App({
  onLaunch: function () {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'prod-xxxxxxxxx', // 请替换为你的云开发环境ID
        traceUser: true,
      });
    }

    // 初始化全局数据
    this.globalData = {
      userProfile: null,       // 用户偏好数据
      todayRecommendation: null, // 今日推荐结果
      isFirstLaunch: false,    // 是否首次使用
    };

    // 检查是否首次使用
    this.checkFirstLaunch();
  },

  // 检查首次使用
  checkFirstLaunch() {
    const hasLaunched = wx.getStorageSync('hasLaunched');
    if (!hasLaunched) {
      this.globalData.isFirstLaunch = true;
    }
  },

  // 获取用户偏好
  async getUserProfile() {
    try {
      const db = wx.cloud.database();
      const res = await db.collection('users').where({
        _openid: '{openid}' // 云开发自动替换
      }).get();
      
      if (res.data.length > 0) {
        this.globalData.userProfile = res.data[0];
        return res.data[0];
      }
      return null;
    } catch (err) {
      console.error('获取用户偏好失败:', err);
      return null;
    }
  },

  // 更新全局用户偏好
  setUserProfile(profile) {
    this.globalData.userProfile = profile;
  },

  // 获取今日推荐
  async getTodayRecommendation() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'getRecommendation',
        data: {
          timestamp: Date.now()
        }
      });
      
      if (res.result && res.result.success) {
        this.globalData.todayRecommendation = res.result.data;
        return res.result.data;
      }
      return null;
    } catch (err) {
      console.error('获取推荐失败:', err);
      return null;
    }
  }
});
