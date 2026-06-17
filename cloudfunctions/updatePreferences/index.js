// cloudfunctions/updatePreferences/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { preferences } = event;

  if (!preferences) {
    return { success: false, error: '缺少偏好数据' };
  }

  try {
    const existRes = await db.collection('users').where({ _openid: openid }).get();

    if (existRes.data.length > 0) {
      await db.collection('users').doc(existRes.data[0]._id).update({
        data: {
          ...preferences,
          updated_at: new Date().toISOString()
        }
      });
    } else {
      await db.collection('users').add({
        data: {
          _openid: openid,
          ...preferences,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      });
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};
