// cloudfunctions/getUserProfile/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    const res = await db.collection('users').where({ _openid: openid }).get();

    if (res.data.length > 0) {
      return {
        success: true,
        data: res.data[0]
      };
    }

    return {
      success: true,
      data: null
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      data: null
    };
  }
};
