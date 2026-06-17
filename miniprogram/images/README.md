# 图标文件说明

tab bar 图标需要放置在 `/miniprogram/images/` 目录下：

## 必需图标（每个需要两种状态：默认 + 激活态）

| 文件名 | 用途 | 规格 |
|--------|------|------|
| tab-home.png | 首页默认图标 | 81x81px, PNG |
| tab-home-active.png | 首页激活图标 | 81x81px, PNG |
| tab-fav.png | 收藏默认图标 | 81x81px, PNG |
| tab-fav-active.png | 收藏激活图标 | 81x81px, PNG |
| tab-set.png | 设置默认图标 | 81x81px, PNG |
| tab-set-active.png | 设置激活图标 | 81x81px, PNG |

## 临时方案

可以使用 iconfont 或微信自带图标替代。
在 app.json 中修改 tabBar 配置，去掉 iconPath 和 selectedIconPath 即可使用纯文字 tab。

## 推荐图标风格

- 默认态：灰色 (#999999)
- 激活态：绿色 (#4CAF50)
- 简洁线性风格
