// cloudfunctions/getRecipes/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { solar_term, category, ids, limit = 50 } = event;

  try {
    let query = {};
    
    if (solar_term) {
      query.solar_term = solar_term;
    }
    if (category) {
      query.category = category;
    }
    if (ids && ids.length > 0) {
      query._id = _.in(ids);
    }

    const res = await db.collection('recipes')
      .where(query)
      .limit(Math.min(limit, 100))
      .get();

    return {
      success: true,
      data: res.data,
      total: res.data.length
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      data: []
    };
  }
};
