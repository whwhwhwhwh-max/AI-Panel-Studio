# AI Panel Studio

> AI 圆桌讨论 Web App — 让任何人瞬间召集一支"虚拟智库"

AI Panel Studio 是一款本地运行的 Web 应用。用户输入任意话题、选择专家人数，系统即可生成主持人与专家阵容，在浏览器中观看一场由 AI 驱动的实时圆桌讨论。无需 API Key 也可运行（自动 fallback 到 mock 内容），适合演示、教学和快速原型验证。

---

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Vue 3 + Vite + TypeScript |
| 后端 | Node.js + Express + TypeScript |
| 数据库 | SQLite (sql.js — 纯 JS/WebAssembly，免原生编译) |
| 实时通信 | SSE (Server-Sent Events) |
| AI | DeepSeek API（可选，无 Key 时自动 fallback 到 mock） |

---

## 核心功能

- **首页讨论列表** — 展示所有讨论，按状态区分（待生成/待开始/进行中/已结束/异常）
- **发起新讨论** — 输入话题 + 选择 2-6 位专家
- **嘉宾阵容生成** — 优先调用 DeepSeek API，失败或无 Key 时 fallback 到预设 mock
- **嘉宾确认页** — 卡片网格展示 1 位主持人 + N 位专家（姓名/职业/立场/颜色）
- **演播厅页面** — 三栏布局：嘉宾阵容 / Transcript / 共识与分歧
- **SSE 实时讨论流** — 发言逐条推送（800ms 间隔），共识实时更新
- **AI 讨论 Demo** — 一键生成完整讨论（主持人开场 + 3-5 条专家发言 + 1-2 条共识）
- **Mock Fallback** — 无 DeepSeek API Key 时自动降级，项目仍可完整运行演示

---

## 本地运行

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装与启动

```bash
# 1. 进入项目目录
cd AI-Panel-Studio

# 2. 配置环境变量（可选：不配置则使用 mock 模式）
cp .env.example .env
# 如需 AI 能力，编辑 .env 填入 DEEPSEEK_API_KEY
# 不填也可运行，自动 fallback 到 mock

# 3. 安装后端依赖并启动
cd backend
npm install
npm run dev        # http://localhost:3000

# 4. 新终端，安装前端依赖并启动
cd frontend
npm install
npm run dev        # http://localhost:5173
```

浏览器打开 `http://localhost:5173` 即可使用。

---

## 环境变量

| 变量 | 必需 | 说明 |
|---|---|---|
| `PORT` | 否 | 后端端口，默认 3000 |
| `NODE_ENV` | 否 | 运行环境，默认 development |
| `DB_PATH` | 否 | SQLite 数据库路径，默认 `:memory:`（内存模式） |
| `DEEPSEEK_API_KEY` | **否** | DeepSeek API Key。不填则自动使用 mock 嘉宾生成和 mock 讨论 |
| `DEEPSEEK_BASE_URL` | 否 | API Base URL，默认 `https://api.deepseek.com/v1` |
| `DEEPSEEK_MODEL` | 否 | 模型名称，默认 `deepseek-chat` |

> **重要**: `.env` 文件已在 `.gitignore` 中，不会被提交。API Key 仅在后端读取，不暴露给浏览器。

---

## 测试

```bash
# 构建检查（推荐在每次修改后执行）
cd backend  && npm run build    # tsc TypeScript 类型检查
cd frontend && npm run build    # vue-tsc + vite build
```

完整测试说明（API 测试、SSE 测试、Fallback 测试、E2E 流程、边界测试）见 **[docs/testing.md](docs/testing.md)**。

---

## 项目结构

```
AI-Panel-Studio/
├── backend/                     # 后端 (Express + TypeScript)
│   └── src/
│       ├── index.ts             # 入口
│       ├── db/                  # 数据库层 (sql.js)
│       ├── repositories/        # 数据访问层
│       ├── routes/              # REST API + SSE 路由
│       ├── sse/                 # SSE 连接池管理
│       ├── ai/                  # DeepSeek 客户端 + Mock Fallback
│       └── types/               # 共享类型定义
├── frontend/                    # 前端 (Vue 3 + Vite)
│   └── src/
│       ├── App.vue              # 根组件（视图切换）
│       ├── views/               # 页面组件 (Home / Create / Confirm / Studio)
│       ├── api/                 # API 客户端
│       └── types/               # 前端类型定义
├── database/                    # 数据库脚本
│   ├── init.sql                 # DDL (7 张表)
│   └── seed.sql                 # 种子数据（5 条讨论）
└── docs/                        # 项目文档
    ├── PRD.md                   # 产品需求文档
    ├── architecture.md          # 架构设计
    ├── schema.md                # 领域模型 (Persistent + Runtime)
    ├── er.md                    # ER 图
    ├── api.md                   # API 契约 (REST + SSE)
    ├── development-plan.md      # 开发计划
    ├── prompt-log.md            # 核心 Prompt 记录 (9 段)
    ├── testing.md               # 测试说明
    ├── session-1-summary.md     # Session 1 记录
    └── session-2-summary.md     # Session 2 记录
```

---

## 文档索引

| 文档 | 说明 |
|---|---|
| [PRD.md](docs/PRD.md) | 产品需求文档：背景、用户画像、痛点分析、功能要求 |
| [architecture.md](docs/architecture.md) | 系统架构：技术选型、AI Agent 调度流程、目录结构 |
| [schema.md](docs/schema.md) | 领域模型：7 Persistent Entities + 4 Runtime Entities |
| [er.md](docs/er.md) | 数据库 ER 图：7 张表关系 + 字段速查 |
| [api.md](docs/api.md) | API 契约：REST 端点 + SSE 协议 + 错误码 |
| [development-plan.md](docs/development-plan.md) | 开发计划：5 Phase + 里程碑 + Git Commit Plan |
| [prompt-log.md](docs/prompt-log.md) | 核心 Prompt 记录：9 段，覆盖 SDD/DDD/TDD/E2E/AI/Delivery |
| [testing.md](docs/testing.md) | 测试说明：构建 / API / SSE / Fallback / E2E / 边界 |

---

## 开发过程

本项目使用 **Claude Code** 作为主要开发工具，**DeepSeek V4 Pro** 作为 AI 模型，按以下阶段推进：

| Phase | 方法 | 产出 |
|---|---|---|
| Phase 0 | SDD | 文档体系 + 项目脚手架 |
| Phase 1 | SDD | 数据建模 (DDL) + REST API + SSE Manager |
| Phase 2 | DDD | 前端页面 (Home / Create / Confirm / Studio) |
| Phase 3 | TDD + AI Integration | DeepSeek 接入 + Mock Fallback + AI 讨论 Demo |
| Phase 4 | Delivery | Prompt Log + Testing Guide + README |

Git 提交历史保留完整开发演进（15 commits，线性无 merge）。

---

## 注意事项

- **API Key 安全**: `DEEPSEEK_API_KEY` 仅在后端 `process.env` 中读取，前端代码不会访问，也不在日志中打印
- **Mock Fallback**: 无 API Key 时，嘉宾生成和讨论生成自动使用 topic-aware mock 内容，项目可完整运行
- **sql.js 模式**: 开发模式下数据库为内存模式（`:memory:`），每次重启后端自动运行 `init.sql` + `seed.sql`。如需持久化，在 `.env` 中设置 `DB_PATH`
- **无 Vue Router**: 当前使用 `currentView` 状态变量做简单视图切换，未引入路由库
- **SSE 限制**: 当前 MVP 版本实现了单向 SSE 推送，断线重连回放逻辑已在 Schema 中预留（`discussion_event` 表 `persisted` 字段），但后端尚未实现 DB 查询回放
