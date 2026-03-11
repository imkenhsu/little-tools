# little-tools

一个用于收集和维护**个人工具类网页**的仓库。

## 目标

- 统一管理常用小工具（如：时间转换、文本处理、编码解码、格式化）。
- 每个工具可独立开发、独立部署。
- 保持轻量，优先使用原生 HTML/CSS/JS。

## 当前初始化内容

- 一个首页（`index.html`），用于展示工具入口。
- 基础样式与交互脚本（`styles.css`、`app.js`）。
- `tools/` 目录作为后续每个工具页面的容器。

## 快速开始

直接使用任意静态服务器运行：

```bash
python3 -m http.server 8080
```

然后访问：

- `http://localhost:8080`

## 目录结构

```text
.
├── app.js
├── index.html
├── styles.css
└── tools/
    └── README.md
```

## 后续建议

1. 在 `tools/` 下按功能创建子目录，例如 `tools/json-formatter/`。
2. 每个工具目录中至少包含：
   - `index.html`
   - `README.md`
3. 在 `app.js` 的工具清单中登记入口信息，首页自动展示。
