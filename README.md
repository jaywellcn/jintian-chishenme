# 「今天吃什么」微信小程序

> 基于二十四节气的时令饮食推荐 | 顺时而食，一口吃掉选择困难

## 📁 项目结构

```
今天吃什么-miniapp/
├── project.config.json          # 微信小程序项目配置
├── miniprogram/                 # 小程序前端代码
│   ├── app.js                   # 入口文件
│   ├── app.json                 # 全局配置
│   ├── app.wxss                 # 全局样式
│   ├── sitemap.json
│   ├── pages/
│   │   ├── index/               # 首页 - 今日推荐
│   │   ├── welcome/             # 首次引导页
│   │   ├── detail/              # 菜谱详情页
│   │   ├── favorites/           # 收藏列表页
│   │   └── settings/            # 偏好设置页
│   ├── components/              # 组件（预留）
│   ├── utils/
│   │   ├── solar-terms.js       # 24节气计算工具
│   │   └── constants.js         # 常量定义
│   ├── data/
│   │   └── seed_recipes.json    # 155道种子菜谱数据
│   └── images/                  # 图标资源
├── cloudfunctions/              # 云函数
│   ├── getRecommendation/       # 推荐引擎（核心）
│   ├── getRecipes/              # 菜谱查询
│   ├── getUserProfile/          # 用户偏好获取
│   └── updatePreferences/      # 用户偏好更新
└── 需求文档/                    # PRD等文档
```

## 🚀 快速开始

### 前置条件

1. **注册微信小程序账号**
   - 访问 https://mp.weixin.qq.com 注册（个人主体即可）
   - 获取 AppID
   - 服务类目选择「工具 → 信息查询」

2. **下载微信开发者工具**
   - https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html

### 启动步骤

#### 第一步：导入项目
1. 打开微信开发者工具
2. 选择「导入项目」
3. 目录选择 `今天吃什么-miniapp/`
4. 填入你的 AppID
5. 选择「不使用云服务」先导入（后续再开通）

#### 第二步：修改 AppID
1. 编辑 `project.config.json`，将 `"appid": "YOUR_APPID_HERE"` 改为你的 AppID
2. 编辑 `miniprogram/app.js`，将 `env: 'prod-xxxxxxxxx'` 改为你的云环境ID

#### 第三步：开通云开发
1. 在微信开发者工具中点击「云开发」按钮
2. 开通云环境（选择免费环境）
3. 获取环境ID，填入 `app.js`

#### 第四步：创建数据库集合
在云开发控制台 → 数据库中创建：
- `recipes` 集合（菜谱数据）
- `users` 集合（用户数据）

#### 第五步：导入菜谱数据
1. 将 `miniprogram/data/seed_recipes.json` 转换为 JSON Lines 格式
2. 在云开发控制台 → recipes 集合 → 导入

#### 第六步：上传并部署云函数
在微信开发者工具中，右键每个云函数目录 →「上传并部署：云端安装依赖」

#### 第七步：编译预览
点击「编译」按钮，在模拟器中查看效果

## 🧠 推荐引擎逻辑

```
当前日期 → 节气匹配 → 时令菜谱池
                           ↓
用户归属地 → 饮食区域 → 地域加权排序
                           ↓
用户偏好 → 口味/忌口/场景 → 过滤+排序
                           ↓
                      输出 Top 1 推荐
```

## 📊 数据规模

- 155 道种子菜谱
- 覆盖 24 个节气
- 覆盖 7 大饮食区域
- 3 种场景分类（外卖/自己做/简单快手）

## 🔧 技术栈

- 前端：微信小程序原生开发
- 后端：微信云开发（CloudBase）
- 数据库：云开发文档型数据库
- 云函数：Node.js

## 📝 后续开发

详见 PRD 文档中的「后续迭代规划」章节。

## ⚠️ 注意事项

1. 个人主体小程序不能使用微信支付，商业化需注册个体工商户
2. 云开发免费环境有 15 天有效期，需及时续费
3. tab bar 图标需要自行准备 81x81px 的 PNG 图片
4. 上线前需通过微信审核（个人主体选「工具-信息查询」类目）
