// data/import-recipes.js
// 菜谱数据导入脚本
// 使用方式：在微信开发者工具中，打开云开发控制台 → 数据库 → recipes集合 → 导入此JSON

// 本文件为导入模板，实际数据请使用 seed_recipes.json
// 导入前需要对数据进行格式转换

// 1. 将 seed_recipes.json 中的每条记录包装为云数据库文档格式
// 2. 确保 _id 字段存在（或让云数据库自动生成）
// 3. 批量导入到 recipes 集合

// 数据格式示例：
// {
//   "_id": "solarterm_dish_001",
//   "name": "春笋炒腊肉",
//   "solar_term": "立春",
//   ...
// }

module.exports = {
  importInstructions: `
    导入步骤：
    1. 打开微信开发者工具
    2. 点击"云开发"按钮进入云开发控制台
    3. 选择"数据库"
    4. 创建集合 "recipes"（如果不存在）
    5. 创建集合 "users"（如果不存在）
    6. 在 recipes 集合中点击"导入"
    7. 选择 ../seed_recipes.json 文件
    8. 导入格式选择 "JSON Lines"（每行一个JSON对象）
    9. 确认导入
    
    注意：
    - 需要先安装 Node.js 依赖来转换JSON格式
    - 或直接在云开发控制台使用导入功能
  `
};
