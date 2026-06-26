# 开发计划

> 版本: v1.0 | 日期: 2026-06-26 | 状态: Draft

---

## 1. 开发阶段概览

```
Phase 0: 文档与项目脚手架  (← 当前)
Phase 1: SDD — 数据建模与 API 契约
Phase 2: DDD — 前端组件与页面
Phase 3: TDD — 核心逻辑测试驱动
Phase 4: E2E — 端到端测试与质量闭环
```

---

## 2. Phase 详细计划

### Phase 0: 文档与项目脚手架

| # | 任务 | 输出物 | 预计 Commit |
|---|---|---|---|
| 0.1 | 初始化项目目录结构 | 目录骨架 | `chore: initialize project structure` |
| 0.2 | 编写 PRD 文档 | `docs/PRD.md` | `docs: add PRD` |
| 0.3 | 编写架构设计文档 | `docs/architecture.md` | `docs: add architecture design` |
| 0.4 | 编写领域模型文档 | `docs/schema.md` | `docs: define schema` |
| 0.5 | 编写 ER 图文档 | `docs/er.md` | `docs: add ER diagram` |
| 0.6 | 编写 API 契约文档 | `docs/api.md` | `docs: define API contract` |
| 0.7 | 编写开发计划 | `docs/development-plan.md` | `docs: add development plan` |
| 0.8 | 创建 `.env.example` | `.env.example` | `chore: add env template` |
| 0.9 | 初始化前端项目 | `frontend/` | `feat: scaffold frontend (Vue 3 + Vite)` |
| 0.10 | 初始化后端项目 | `backend/` | `feat: scaffold backend (Express + TS)` |
| 0.11 | 创建 README | `README.md` | `docs: add README` |

### Phase 1: SDD — 数据建模与 API 契约实现

| # | 任务 | 输出物 | 预计 Commit |
|---|---|---|---|
| 1.1 | 编写 DDL 建表脚本 | `database/init.sql` | `feat: add database DDL` |
| 1.2 | 编写种子数据脚本 | `database/seed.sql` | `feat: add seed data (5 discussions)` |
| 1.3 | 实现数据库连接层 | `backend/src/db/` | `feat: add database layer` |
| 1.4 | 实现 REST API 路由骨架 | `backend/src/routes/` | `feat: add REST API routes` |
| 1.5 | 实现 SSE 管理器 | `backend/src/sse/` | `feat: add SSE manager` |
| 1.6 | 实现共享类型定义 | `shared types` | `feat: add shared type definitions` |

### Phase 2: DDD — 前端组件与页面

| # | 任务 | 输出物 | 预计 Commit |
|---|---|---|---|
| 2.1 | 演播厅视觉风格设计 | 设计稿/参考 | `design: broadcast studio UI style` |
| 2.2 | 首页 — 讨论列表 | `frontend/src/views/Home.vue` | `feat: add home page with discussion list` |
| 2.3 | 创建讨论页 | `frontend/src/views/CreateDiscussion.vue` | `feat: add create discussion page` |
| 2.4 | 嘉宾确认页 | `frontend/src/views/PanelistConfirm.vue` | `feat: add panelist confirmation page` |
| 2.5 | 演播厅主视图 | `frontend/src/views/Studio.vue` | `feat: add studio main view` |
| 2.6 | 专家状态小窗组件 | `frontend/src/components/ExpertPanel.vue` | `feat: add expert panel component` |
| 2.7 | Transcript 组件 | `frontend/src/components/Transcript.vue` | `feat: add transcript component` |
| 2.8 | 共识/分歧面板 | `frontend/src/components/ConsensusPanel.vue` | `feat: add consensus/conflict panel` |
| 2.9 | SSE 客户端 composable | `frontend/src/composables/useSSE.ts` | `feat: add SSE client composable` |
| 2.10 | 响应式布局 | CSS 调整 | `style: responsive layout for studio` |

### Phase 3: TDD — 核心逻辑测试驱动

| # | 任务 | 输出物 | 预计 Commit |
|---|---|---|---|
| 3.1 | AI 服务单元测试 | `backend/tests/ai.test.ts` | `test: add AI service unit tests` |
| 3.2 | AI 嘉宾生成实现 | `backend/src/ai/` | `feat: implement panelist generation` |
| 3.3 | Scheduler 单元测试 | `backend/tests/scheduler.test.ts` | `test: add scheduler unit tests` |
| 3.4 | Scheduler 实现 | `backend/src/scheduler/` | `feat: implement speech scheduler` |
| 3.5 | Consensus Engine 单元测试 | `backend/tests/consensus.test.ts` | `test: add consensus engine tests` |
| 3.6 | Consensus Engine 实现 | `backend/src/consensus/` | `feat: implement consensus engine` |
| 3.7 | 讨论编排器测试 | `backend/tests/orchestrator.test.ts` | `test: add discussion orchestrator tests` |
| 3.8 | 讨论编排器实现 | `backend/src/orchestrator/` | `feat: implement discussion orchestrator` |

### Phase 4: E2E — 端到端测试与质量闭环

| # | 任务 | 输出物 | 预计 Commit |
|---|---|---|---|
| 4.1 | E2E 测试框架搭建 | Playwright 配置 | `test: setup E2E test framework` |
| 4.2 | 完整讨论流程 E2E | 测试用例 | `test: add full discussion flow E2E` |
| 4.3 | 多讨论并行隔离 E2E | 测试用例 | `test: add parallel discussion isolation E2E` |
| 4.4 | 边界情况测试 | 测试用例 | `test: add edge case tests` |
| 4.5 | Bug 修复与优化 | 修复代码 | `fix: E2E discovered issues` |
| 4.6 | 最终文档完善 | 全部文档 | `docs: finalize all documentation` |

---

## 3. Git Commit Plan

```
chore:  initialize project structure
docs:   add PRD
docs:   add architecture design
docs:   define schema
docs:   add ER diagram
docs:   define API contract
docs:   add development plan
chore:  add env template
feat:   scaffold frontend (Vue 3 + Vite)
feat:   scaffold backend (Express + TypeScript)
docs:   add README
--- Phase 1: SDD ---
feat:   add database DDL
feat:   add seed data (5 discussions)
feat:   add database layer
feat:   add REST API routes
feat:   add SSE manager
feat:   add shared type definitions
--- Phase 2: DDD ---
design: broadcast studio UI style
feat:   add home page with discussion list
feat:   add create discussion page
feat:   add panelist confirmation page
feat:   add studio main view
feat:   add expert panel component
feat:   add transcript component
feat:   add consensus/conflict panel
feat:   add SSE client composable
style:  responsive layout for studio
--- Phase 3: TDD ---
test:   add AI service unit tests
feat:   implement panelist generation
test:   add scheduler unit tests
feat:   implement speech scheduler
test:   add consensus engine tests
feat:   implement consensus engine
test:   add discussion orchestrator tests
feat:   implement discussion orchestrator
--- Phase 4: E2E ---
test:   setup E2E test framework
test:   add full discussion flow E2E
test:   add parallel discussion isolation E2E
test:   add edge case tests
fix:    E2E discovered issues
docs:   finalize all documentation
```

**Commit 总数：约 35+ commits，覆盖 5 个 Phase。**

---

## 4. 里程碑

| 里程碑 | Phase 完成标志 | 预计产出 |
|---|---|---|
| M0: 文档就绪 | Phase 0 完成 | 6 份文档 + 项目骨架 |
| M1: 后端骨架 | Phase 1 完成 | 可运行的 REST API + SSE + 数据库 |
| M2: 可交互 UI | Phase 2 完成 | 完整前端页面（Mock 数据可跑通） |
| M3: 核心逻辑 | Phase 3 完成 | AI 调度 + 共识引擎 + 测试通过 |
| M4: 交付就绪 | Phase 4 完成 | E2E 通过 + 文档完善 + 样例数据 |

---

<!-- TODO: 每个 Phase 完成后更新实际完成日期与偏差说明 -->
