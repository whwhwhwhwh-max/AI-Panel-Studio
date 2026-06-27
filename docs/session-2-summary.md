# AI Panel Studio — Session 2 记录

> 日期: 2026-06-27 | 时间: 12:30 ~ 13:30

---

## 会话概要

接续 Session 1，完成了 Phase 0 收尾、Phase 1 全部、Phase 1.5 SSE、Phase 2 前端首页和演播厅。

1. 文档一致性修复（is_moderator → role）
2. 数据库 DDL + Seed 全部落库
3. Backend 数据库层 + 7 个只读 Repository + 6 个 GET API
4. SSE Manager + mock-events 测试接口
5. Frontend scaffold (Vue 3 + Vite + TypeScript)
6. 首页讨论列表 (HomeView) — 连通后端 API
7. 演播厅页面 (StudioView) — SSE 实时事件流 + 模拟讨论

---

## 关键决策

### 数据库
- sql.js 确认：Windows 免原生编译，纯 JS/WebAssembly
- 7 张表：discussion, panelist, transcript, discussion_event, consensus, conflict, summary
- 5 条种子数据，覆盖 created / ready / running / finished 四种状态
- 内存数据库默认模式（.env 缺失时）；配置 DB_PATH 可落盘

### 后端架构
- `backend/src/types/` — 7 个实体类型，与 init.sql 严格对齐
- `backend/src/db/` — sql.js 初始化，启动时自动加载 init.sql + seed.sql
- `backend/src/repositories/discussionRepository.ts` — 纯只读查询，7 个方法
- `backend/src/routes/discussionRoutes.ts` — 6 个 GET 端点 + 404 处理
- `backend/src/sse/sseManager.ts` — 连接池管理 (add/remove/broadcast/sendToClient)
- `backend/src/routes/sseRoutes.ts` — GET /events (SSE) + POST /mock-events (dev only)

### 前端架构
- 无 Vue Router — App.vue 中用 `currentView` + `selectedDiscussionId` 做简单切换
- HomeView — emit('discussion-selected', id) 通知父组件
- StudioView — prop discussionId + emit('back')，挂载时创建 EventSource
- SSE 事件监听：connected → discussion_started → transcript_delta → consensus_updated → discussion_finished
- Vite proxy 配置 `/api` → `http://localhost:3000`

### 剧本一致性修复
- 删除所有 `is_moderator` — 统一使用 `role` 枚举 (`moderator` | `expert`)
- 涉及文件：er.md, api.md, schema.md, init.sql, seed.sql

---

## Git 历史

```
fbd3e84 feat: add studio view with SSE integration
7e0e2dd feat: add frontend discussion list
1111eb6 feat: add SSE event stream
a2a79e1 chore: add frontend scaffold
97a44ee chore: fix backend scripts
b6ebe22 feat: implement discussion read APIs
aa20a6f chore: add backend scaffold and database schema
60de6b5 chore: initialize project structure
```

8 commits，线性历史，无 merge。

---

## 当前状态

### Backend API (已验证)

| Method | Path | Status |
|---|---|---|
| GET | `/api/v1/health` | ✅ |
| GET | `/api/v1/discussions` | ✅ 5 条 |
| GET | `/api/v1/discussions/:id` | ✅ 含 panelists |
| GET | `/api/v1/discussions/:id/panelists` | ✅ |
| GET | `/api/v1/discussions/:id/transcript` | ✅ |
| GET | `/api/v1/discussions/:id/consensus` | ✅ |
| GET | `/api/v1/discussions/:id/conflicts` | ✅ |
| GET | `/api/v1/discussions/:id/summary` | ✅ |
| GET | `/api/v1/discussions/:id/events` | ✅ SSE stream |
| POST | `/api/v1/discussions/:id/mock-events` | ✅ 5 events @ 800ms |

### Frontend (已验证)

- `npm run build` ✅ vue-tsc + vite build 通过
- `npm run dev` ✅ 启动 http://localhost:5173
- 首页 → 点击讨论 → 演播厅 → "启动模拟讨论" → SSE 实时更新

### 启动方式

```bash
# 终端 1: 后端
cd backend && npm run dev     # http://localhost:3000

# 终端 2: 前端
cd frontend && npm run dev    # http://localhost:5173
```

---

## 产出文件清单

```
AI-Panel-Studio/
├── .claude/
│   └── settings.local.json
├── .env.example                  (sql.js 说明)
├── .gitignore
├── README.md                     (sql.js 引用)
├── database/
│   ├── init.sql                  (7 tables, FK/CHECK/UNIQUE/INDEX)
│   └── seed.sql                  (5 discussions, 4 statuses)
├── docs/
│   ├── PRD.md
│   ├── architecture.md           (sql.js 引用)
│   ├── schema.md                 (v1.1, Persistent + Runtime)
│   ├── er.md                     (无 is_moderator)
│   ├── api.md                    (无 is_moderator)
│   ├── development-plan.md
│   └── session-1-summary.md
├── backend/
│   ├── package.json              (dev/typecheck/build/start)
│   ├── tsconfig.json             (noEmit)
│   └── src/
│       ├── index.ts              (Express entry, DB init, routes)
│       ├── sql.js.d.ts           (TypeScript declarations)
│       ├── db/index.ts           (sql.js init + init.sql + seed.sql)
│       ├── repositories/
│       │   └── discussionRepository.ts  (7 read methods)
│       ├── routes/
│       │   ├── discussionRoutes.ts      (6 GET endpoints)
│       │   └── sseRoutes.ts             (SSE + mock-events)
│       ├── sse/sseManager.ts      (SSE connection pool)
│       └── types/index.ts        (7 entity types)
└── frontend/
    ├── package.json              (Vue 3 + Vite + TypeScript)
    ├── tsconfig.json             (paths: @/*)
    ├── vite.config.ts            (proxy /api → :3000)
    ├── index.html
    ├── env.d.ts
    └── src/
        ├── main.ts
        ├── App.vue               (简单页面切换)
        ├── style.css
        ├── api/discussions.ts    (fetchDiscussions, fetchDiscussionById, triggerMockEvents)
        ├── types/index.ts        (7 entity types + SSEEvent)
        └── views/
            ├── HomeView.vue      (讨论列表 → emit discussion-selected)
            └── StudioView.vue    (演播厅 + SSE + mock events)
```

---

## 下一步

Phase 3: TDD — AI 核心逻辑
- DeepSeek API 接入
- AI 嘉宾生成 (generate-panelists)
- Scheduler 发言调度
- Consensus Engine
- Discussion Orchestrator

Phase 2 剩余（非阻塞）:
- 创建讨论页 (CreateDiscussion)
- 嘉宾确认页 (PanelistConfirm)
- 响应式布局完善
