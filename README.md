# 购买记录（Vue 3 网页版）

已按你的反馈改为 **Vue 3 技术栈**，并使用炫酷的玻璃态 + 渐变霓虹 UI。

## 功能

- 记录物品名称、购买日期、价格
- 自动计算使用至今天数（至少 1 天）
- 自动计算每日成本 = 价格 / 使用天数
- 展示总支出
- `localStorage` 本地持久化
- 单条删除、清空全部

## 运行方式

直接打开 `index.html`，或用静态服务：

```bash
python3 -m http.server 8000
```

访问：<http://localhost:8000>

## 技术说明

- Vue 3 通过 ESM CDN 引入（`unpkg`）
- 无需打包工具即可运行
- 数据键名：`purchaseRecords.v2`
