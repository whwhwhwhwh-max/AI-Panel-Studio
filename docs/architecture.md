# 系统架构设计

> 版本: v1.0 | 日期: 2026-06-26 | 状态: Draft

---

## 1. 整体架构图

```
┌──────────────────────────────────────────────────────────────┐
│                        Frontend (Vue 3)                       │
│  ┌─────────┐ ┌──────────┐ ┌───────────┐ ┌────────────────┐  │
│  │ 首页     │ │ 嘉宾生成  │ │  演播厅    │ │  Transcript    │  │
│  │ 讨论列表 │ │ 确认页    │ │ 主视图    │ │  共识/分歧面板  │  │
│  └─────────┘ └──────────┘ └───────────┘ └────────────────┘  │
│                         │ SSE Client                          │
└─────────────────────────┼────────────────────────────────────┘
                          │ HTTP + SSE
┌─────────────────────────┼────────────────────────────────────┐
│                   Backend (Express + TypeScript)              │
│  ┌──────────┐ ┌─────────┐ ┌────────────┐ ┌───────────────┐  │
│  │ REST API │ │  SSE    │ │ AI Service │ │ Consensus     │  │
│  │ Router   │ │ Manager │ │  (DeepSeek)│ │ Engine        │  │
│  └──────────┘ └─────────┘ └────────────┘ └───────────────┘  │
│                         │                                      │
│                    ┌─────┴─────┐                              │
│                    │  SQLite   │                              │
│                    └───────────┘                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. 技术选型

| 层 | 技术 | 理由 |
|---|---|---|
| 前端 | Vue 3 + Vite + TypeScript | Composition API，响应式数据流天然适合演播厅实时 UI |
| 后端 | Node.js + Express + TypeScript | 前后端统一语言，SSE 原生支持好 |
| 数据库 | SQLite (better-sqlite3) | 同步 API，零配置，单文件存储 |
| 实时通信 | SSE (Server-Sent Events) | 单向推送讨论事件流，比 WebSocket 更轻量 |
| AI | DeepSeek V4 Pro API | 作业指定模型 |

---

## 3. AI Agent 调度流程

```
用户输入 Topic
      │
      ▼
┌─────────────┐
│  Moderator   │  ← 大模型生成主持人角色（姓名/风格/开场白）
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Scheduler   │  ← 核心调度器：读取当前 transcript，
└──────┬──────┘     评估哪位专家最应发言（举手/抢答/补充/反驳）
       │           按优先级分配发言权，禁止轮流转
       ▼
┌─────────────┐
│   Experts    │  ← 大模型以指定专家身份生成 1-2 句发言
└──────┬──────┘     每专家有独立立场、知识背景、语言风格
       │
       ▼
┌─────────────┐
│  Consensus   │  ← 持续从 transcript 中提炼：
│   Engine     │     - 共识（各方一致的点）
└──────┬──────┘     - 分歧（对立/矛盾的观点）
       │           实时更新，不等讨论结束
       ▼
┌─────────────┐
│  Transcript  │  ← 记录所有发言 + 发言人元信息
└──────┬──────┘
       │
       ▼
┌─────────────┐
│     SSE      │  ← 将 DiscussionEvent 推送到前端
└──────┬──────┘    事件类型：speech / status_change / consensus_update / round_end / summary
       │
       ▼
┌─────────────┐
│   Frontend   │  ← 接收 SSE 事件 → 更新 UI 各区域
└─────────────┘
```

### 3.1 各模块职责

| 模块 | 职责 | 输入 | 输出 |
|---|---|---|---|
| **Moderator** | 生成开场白、追问串联、结语总结 | Topic + Transcript 上下文 | 主持发言文本 |
| **Scheduler** | 根据当前讨论上下文决定下一发言人 | Transcript 历史 + 专家状态 | 选中专家 ID + 发言动机 |
| **Experts** | 以各自立场生成 1-2 句高质量发言 | 当前上下文 + 专家 persona | 发言文本 |
| **Consensus Engine** | 持续提炼共识与分歧 | 全部 Transcript | 共识列表 / 分歧列表 |
| **Transcript** | 记录、存储、格式化所有发言 | 每次发言数据 | 结构化 transcript 记录 |
| **SSE Manager** | 管理 SSE 连接、事件广播、多讨论隔离 | DiscussionEvent | 推送至各讨论的 SSE 通道 |
| **Frontend** | 渲染演播厅 UI，独立滚动区域 | SSE 事件流 | 可视化圆桌讨论 |

### 3.2 Scheduler 调度策略

1. **举手机制**：Scheduler 评估当前讨论上下文，决定哪位专家的立场与当前话题最相关
2. **抢答**：当上一发言提出强主张或反问时，持有对立立场的专家优先获得发言权
3. **补充**：同一阵营专家可补充队友观点
4. **反驳**：对立立场专家可直接反驳
5. **主持人介入**：讨论偏离主题或某专家长期未发言时，主持人追问 or 引导
6. **禁止轮流转**：Scheduler 必须根据内容相关性而非序号决定发言人

---

## 4. 目录结构

```
AI-Panel-Studio/
├── docs/                    # 开发文档
│   ├── PRD.md
│   ├── architecture.md
│   ├── schema.md
│   ├── er.md
│   ├── api.md
│   └── development-plan.md
├── database/                # 数据库脚本
│   ├── init.sql
│   └── seed.sql
├── backend/                 # 后端项目
│   ├── src/
│   │   ├── index.ts         # 入口
│   │   ├── routes/          # REST API 路由
│   │   ├── sse/             # SSE 管理
│   │   ├── ai/              # AI 服务（DeepSeek）
│   │   ├── scheduler/       # 发言调度器
│   │   ├── consensus/       # 共识引擎
│   │   ├── db/              # 数据库层
│   │   └── types/           # 共享类型
│   ├── package.json
│   └── tsconfig.json
├── frontend/                # 前端项目
│   ├── src/
│   │   ├── App.vue
│   │   ├── main.ts
│   │   ├── views/           # 页面级组件
│   │   ├── components/      # 通用组件
│   │   ├── composables/     # 组合式函数
│   │   ├── stores/          # 状态管理
│   │   ├── types/           # 类型定义
│   │   └── assets/          # 样式/图标
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── .env.example
└── README.md
```

---

<!-- TODO: Phase 2+ 补充更详细的组件树、数据流图、SSE 连接管理细节 -->
