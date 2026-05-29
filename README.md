# ✍️ 碎片写作 — 积思成文

一个专为碎片化写作设计的 Web 应用。随时记录零散的想法和素材，AI 帮你整合为完整文章。

🔗 **在线体验**: https://fragment-writer.vercel.app

---

## ✨ 功能特性

### 📝 碎片收集
- 按项目组织写作素材
- 支持标签分类（灵感、数据、引用、观点等）
- AI 智能推荐标签
- 全文搜索（支持 FTS5 全文索引）

### 🤖 AI 写作助手
- **一键生成**: 基于素材自动生成文章大纲并分段写作
- **智能优化**: 文本润色、语法纠错
- **写作引导**: 实时关键词推荐、句式建议、结构指导
- **素材分析**: 主题聚类、隐藏关联发现、缺失角度提示

### 🎨 风格系统
- 口语随笔
- 深度长文
- 学术思辨
- 文学叙事（支持莫迪亚诺等子风格）

### 📖 文章管理
- 文章预览与阅读
- 历史版本对比
- 风格评分与改进建议
- 导出 Markdown / 纯文本 / HTML

### 🌓 其他
- 暗色/亮色模式
- 响应式设计（支持移动端）
- 键盘快捷键支持

---

## 🛠️ 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS |
| 状态管理 | React Context + useReducer |
| 后端 (Vercel) | Serverless Functions + `@vercel/kv` (Redis) |
| 后端 (本地) | Express + better-sqlite3 + FTS5 |
| AI 接入 | DeepSeek API |
| 部署 | Vercel |

---

## 🚀 本地开发

```bash
# 克隆项目
git clone https://github.com/linzelun/fragment-writer.git
cd fragment-writer

# 安装依赖
npm install

# 启动前端开发服务器
npm run dev

# 启动本地后端服务器（SQLite）
npm run server
```

前端默认运行在 `http://localhost:5173`，本地后端运行在 `http://localhost:3001`。

---

## 📁 项目结构

```
fragment-writer/
├── src/
│   ├── components/    # React 组件
│   ├── pages/         # 页面组件
│   ├── stores/        # 状态管理
│   ├── services/      # API 服务与 AI 逻辑
│   ├── contexts/      # React Context
│   └── types/         # TypeScript 类型定义
├── api/               # Vercel Serverless Functions
├── server/            # 本地开发后端 (Express + SQLite)
└── vercel.json        # Vercel 路由配置
```

---

## ⌨️ 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl/Cmd + K` | 聚焦搜索框 |
| `Ctrl/Cmd + Enter` | 提交/保存素材 |
| `?` | 显示快捷键帮助 |
| `Esc` | 关闭面板 / 取消操作 |

---

## 📝 使用说明

1. **创建项目**: 点击左上角菜单，创建一个新的写作项目，设置主题、风格、篇幅
2. **记录素材**: 在主界面输入框中随时记录想法、引用、数据片段，添加标签便于分类
3. **AI 整合**: 积累足够素材后，点击底部 "AI 生成" 按钮，AI 会自动整合为完整文章
4. **迭代优化**: 在文章预览中输入修改建议，AI 会针对性重写

---

## ⚠️ 注意事项

- Vercel 线上版本使用 Redis (`@vercel/kv`) 存储数据
- 本地开发版本使用 SQLite，需安装 Python 和 C++ 构建工具以编译 `better-sqlite3`
- DeepSeek API Key 请在本地开发时通过环境变量 `DEEPSEEK_API_KEY` 配置

---

## 📄 License

MIT
