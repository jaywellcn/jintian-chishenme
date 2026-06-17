// cloudfunctions/getRecommendation/index.js
// 推荐引擎云函数 - 三层推荐逻辑

const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

// 节气数据（精简版，与前端保持一致）
const SOLAR_TERMS = [
  { name: '小寒', start: '01-05', end: '01-19', season: '冬' },
  { name: '大寒', start: '01-20', end: '02-02', season: '冬' },
  { name: '立春', start: '02-03', end: '02-17', season: '春' },
  { name: '雨水', start: '02-18', end: '03-04', season: '春' },
  { name: '惊蛰', start: '03-05', end: '03-19', season: '春' },
  { name: '春分', start: '03-20', end: '04-03', season: '春' },
  { name: '清明', start: '04-04', end: '04-19', season: '春' },
  { name: '谷雨', start: '04-20', end: '05-04', season: '春' },
  { name: '立夏', start: '05-05', end: '05-20', season: '夏' },
  { name: '小满', start: '05-21', end: '06-04', season: '夏' },
  { name: '芒种', start: '06-05', end: '06-20', season: '夏' },
  { name: '夏至', start: '06-21', end: '07-05', season: '夏' },
  { name: '小暑', start: '07-06', end: '07-21', season: '夏' },
  { name: '大暑', start: '07-22', end: '08-06', season: '夏' },
  { name: '立秋', start: '08-07', end: '08-22', season: '秋' },
  { name: '处暑', start: '08-23', end: '09-06', season: '秋' },
  { name: '白露', start: '09-07', end: '09-22', season: '秋' },
  { name: '秋分', start: '09-23', end: '10-07', season: '秋' },
  { name: '寒露', start: '10-08', end: '10-22', season: '秋' },
  { name: '霜降', start: '10-23', end: '11-06', season: '秋' },
  { name: '立冬', start: '11-07', end: '11-21', season: '冬' },
  { name: '小雪', start: '11-22', end: '12-06', season: '冬' },
  { name: '大雪', start: '12-07', end: '12-20', season: '冬' },
  { name: '冬至', start: '12-21', end: '01-04', season: '冬' }
];

// 地域到饮食区域的映射（精简核心）
const REGION_MAP = {
  '北京': '华北', '天津': '华北', '石家庄': '华北', '太原': '华北', '呼和浩特': '华北',
  '沈阳': '东北', '大连': '东北', '长春': '东北', '哈尔滨': '东北',
  '上海': '华东', '南京': '华东', '苏州': '华东', '杭州': '华东', '宁波': '华东', '合肥': '华东',
  '郑州': '华中', '武汉': '华中', '长沙': '华中', '南昌': '华中',
  '广州': '华南', '深圳': '华南', '佛山': '华南', '东莞': '华南', '南宁': '华南', '海口': '华南', '福州': '华南', '厦门': '华南',
  '成都': '西南', '重庆': '西南', '贵阳': '西南', '昆明': '西南',
  '西安': '西北', '兰州': '西北', '西宁': '西北', '银川': '西北', '乌鲁木齐': '西北'
};

function getDietRegion(city) {
  if (!city) return '华北';
  const cleanCity = city.replace(/市$/, '');
  if (REGION_MAP[cleanCity]) return REGION_MAP[cleanCity];
  for (const key of Object.keys(REGION_MAP)) {
    if (key.startsWith(cleanCity) || cleanCity.startsWith(key)) return REGION_MAP[key];
  }
  return '华北';
}

function getSolarTerm(date) {
  const dateStr = formatDate(date);
  const monthDay = dateStr.slice(5);
  for (const term of SOLAR_TERMS) {
    if (term.end >= term.start) {
      if (monthDay >= term.start && monthDay <= term.end) return term;
    } else {
      if (monthDay >= term.start || monthDay <= term.end) return term;
    }
  }
  return SOLAR_TERMS[0];
}

function formatDate(date) {
  const d = date || new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const now = new Date(event.timestamp || Date.now());
  const todayStr = formatDate(now);

  try {
    // 1. 获取当前节气
    const solarTerm = getSolarTerm(now);

    // 2. 获取用户偏好
    let userProfile = null;
    try {
      const userRes = await db.collection('users').where({ _openid: openid }).get();
      if (userRes.data.length > 0) {
        userProfile = userRes.data[0];
      }
    } catch (e) {
      console.log('获取用户偏好失败，使用默认值:', e.message);
    }

    // 用户偏好默认值
    const locationCity = userProfile?.location_city || '北京';
    const hometownCity = userProfile?.hometown_city || locationCity;
    const tasteTags = userProfile?.taste_tags || [];
    const taboos = userProfile?.taboos || [];
    const scenePreference = userProfile?.scene_preference || '不限';
    const viewHistory = userProfile?.view_history || [];
    const favorites = userProfile?.favorites || [];

    // 3. 获取当前节气菜谱候选集
    let candidates = [];
    try {
      const recipeRes = await db.collection('recipes')
        .where({ solar_term: solarTerm.name })
        .limit(100)
        .get();
      candidates = recipeRes.data;
    } catch (e) {
      console.error('获取菜谱失败:', e.message);
    }

    // 如果当前节气菜谱不足，补充相邻节气菜谱
    if (candidates.length < 5) {
      try {
        const currentIdx = SOLAR_TERMS.findIndex(t => t.name === solarTerm.name);
        const prevTerm = SOLAR_TERMS[(currentIdx - 1 + 24) % 24];
        const nextTerm = SOLAR_TERMS[(currentIdx + 1) % 24];
        const extraRes = await db.collection('recipes')
          .where(_.or([{ solar_term: prevTerm.name }, { solar_term: nextTerm.name }]))
          .limit(30)
          .get();
        candidates = [...candidates, ...extraRes.data];
      } catch (e) {
        console.log('获取补充菜谱失败:', e.message);
      }
    }

    // 如果还是没有足够菜谱，获取全量
    if (candidates.length === 0) {
      try {
        const allRes = await db.collection('recipes').limit(100).get();
        candidates = allRes.data;
      } catch (e) {
        console.error('获取全量菜谱失败:', e.message);
      }
    }

    // 4. 场景过滤
    if (scenePreference !== '不限') {
      let sceneFiltered = candidates.filter(r => r.category === scenePreference);
      if (sceneFiltered.length > 0) {
        candidates = sceneFiltered;
      }
    }

    // 5. 忌口过滤
    if (taboos.length > 0) {
      const tabooFiltered = candidates.filter(r => {
        return !r.main_ingredients.some(i => taboos.some(t => i.includes(t)));
      });
      if (tabooFiltered.length > 0) {
        candidates = tabooFiltered;
      }
    }

    // 6. 地域加权排序
    const userRegion = getDietRegion(hometownCity);
    candidates.sort((a, b) => {
      const aMatch = (a.suitable_regions && a.suitable_regions.includes(userRegion)) ? 3 : 1;
      const bMatch = (b.suitable_regions && b.suitable_regions.includes(userRegion)) ? 3 : 1;
      return bMatch - aMatch;
    });

    // 7. 口味匹配加权
    if (tasteTags.length > 0) {
      candidates.sort((a, b) => {
        const aScore = (a.tags || []).filter(t => tasteTags.includes(t)).length;
        const bScore = (b.tags || []).filter(t => tasteTags.includes(t)).length;
        return bScore - aScore;
      });
    }

    // 8. 排除今天已展示的
    const todayShown = viewHistory
      .filter(h => h.date === todayStr)
      .map(h => h.dishId);
    
    let finalCandidates = candidates.filter(c => !todayShown.includes(c._id || c.id));
    
    // 如果全部排除了，重置
    if (finalCandidates.length === 0) {
      finalCandidates = candidates;
    }

    // 9. 选择 Top 1（加入一定随机性，从前3名中随机选）
    const topN = finalCandidates.slice(0, Math.min(3, finalCandidates.length));
    const selected = topN[Math.floor(Math.random() * topN.length)];

    // 10. 构建推荐理由
    const regionName = userRegion;
    const reason = `${solarTerm.name}${solarTerm.season === '冬' ? '天寒' : solarTerm.season === '夏' ? '暑热' : solarTerm.season === '秋' ? '气爽' : '回暖'}，${selected.seasonal_reason || selected.name + '正当季'}。${regionName}口味，这道${selected.name}正适合这个时节。`;

    // 11. 更新用户查看历史
    try {
      await db.collection('users').where({ _openid: openid }).update({
        data: {
          view_history: _.push({
            dishId: selected._id || selected.id,
            dishName: selected.name,
            date: todayStr,
            timestamp: now.getTime()
          })
        }
      });
    } catch (e) {
      console.log('更新查看历史失败:', e.message);
    }

    return {
      success: true,
      data: {
        dish: selected,
        solarTerm: solarTerm,
        reason: reason,
        timestamp: now.getTime()
      }
    };

  } catch (err) {
    console.error('推荐引擎异常:', err);
    return {
      success: false,
      error: err.message,
      data: null
    };
  }
};
