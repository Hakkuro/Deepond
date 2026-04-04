# 玄珀 | Deepond

## 📖 项目简介

**玄珀 (Deepond)** 是一个极简精美的全栈协作看板平台。采用顶级的「黑白单色极致美学」设计理念，结合流畅的微交互动效，致力于为个人或中小型团队提供极度清爽、专注和高效的任务视图与状态流转管理。

## ✨ 核心特性

- 🌒 **全链路设计美学**：极高对比度的单色基调，平滑的全局深浅色切换，拒绝任何花哨冗余的界面。
- 🤝 **深层多人协作**：精细化的空间鉴权与分发系统，实现严格的「所有者-编辑者-观察者」身份隔离与保护。
- ⚡ **丝滑交互反馈**：借助全量 Framer Motion 等技术，实现优雅的系统通知队列、组件过渡以及统一的自定义模态系统（深度消除浏览器原生弹窗）。
- 🚀 **实时协作通知**：集成 Server-Sent Events (SSE) 服务端推送，全天候保障看板修改（重命名、增删任务、列编辑）的毫秒级同步，配以全局 Toast 提醒，将团队协同效率提升至极致。
- 🔒 **坚如磐石的安全架构**：Node + Express + SQLite 提供稳定且彻底解耦的服务端方案。基于 JWT 构建鉴权闭环，同时具备完整的瀑布式级联清除能力，从源头杜绝幽灵残留数据。
- 🤖 **内建 AI 能力**：拓展并预留了基于大语言模型的助理支持。

## 🛠 技术栈

- **核心前端**: React 18, Vite, React Router DOM
- **视觉架构**: Tailwind CSS, Framer Motion, Lucide React 
- **稳定后端**: Node.js, Express.js
- **本地存储**: SQLite3
- **密码与安全**: bcryptjs, jsonwebtoken

## 🚀 快速启动

1. **环境依赖**
   请确保您已安装标准 Node.js 环境。克隆或进入项目根目录，运行：
   ```bash
   npm install
   ```

2. **核心变量配置**
   新建或编辑项目根目录中的 `.env.local` 文件并填写安全密钥与配置：
   ```env
   # 您的 Gemini API Key （用于内建智能拓展）
   GEMINI_API_KEY=your_gemini_api_key
   # 会话签名鉴权密钥 (本地开发可不填，默认兜底)
   JWT_SECRET=your_jwt_secret
   ```

3. **运行全后端开发服务**
   直接执行下方命令。项目将初始化 SQLite，拉起服务端，并在端口渲染 Web 主应用。
   ```bash
   npm run dev
   ```
   *(初次运行时系统将自动在 `data/kanban.db` 构建最新的表结构数据库)*

4. **生产环境部署**
   在生产服务器上，您可以运行构建并启动生产服务：
   ```bash
   npm run build
   npm run start
   ```
   *注意：生产环境下，前端资源将由后端 Express 服务器在同一端口直接托管。*

## 📐 页面与目录设计

- `data/`: 存放持久化数据库文件。
- `scripts/`: 包含统一启动脚本与辅助工具。

- `src/components`: 遵循低耦合原则封装的各细分业务组件（包括极简个人控制台 `ProfileHero`、美化弹窗等）。
- `src/contexts`: 状态层深度抽离，包含 `DialogContext` (弹窗挂载中心)、`AuthContext` (JWT 分发) 以及深度整合 SSE 的 `NotificationContext` (实现毫秒级全域同步)。
- `server/routes`: 严格前后端分离设计的 Express 端点分发层，保证业务线独立且可复用扩展。

---
> “抛弃复杂的设定，让业务执行纯粹如初。” —— Deepond 愿景
