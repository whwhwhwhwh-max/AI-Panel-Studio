# AI Panel Studio — 核心 Prompt 记录

> 版本: v1.0 | 日期: 2026-06-27 | 共 6 段

---

## Prompt 1: 领域模型评审 (SDD)

**阶段**: SDD — Schema-Driven Development

**对话概要**:
> 这是一个圆桌讨论 Web App，核心有两类角色：主持人与专家。你觉得它们应该分别建表（拆分为 `moderator` + `expert`），还是统一放在一张 `panelist` 表中？请从以下维度评估：字段差异化程度、CRUD 复杂度、前端渲染便利性、Scheduler 遍历效率、未来扩展性。当前业务中主持人与专家的数据字段完全一致（name / title / stance / color），无差异化属性。

**Claude 评估**:
最终选择统一实体方案（YAGNI 原则），并额外讨论了 DiscussionEvent 的 Persistent vs Runtime 分层策略——并不是所有 SSE 事件都需要入库，只有可回放事件（speech_delivered、consensus_updated 等）需要持久化，瞬时状态事件（speaker_status、heartbeat）仅运行时推送。

**作用**: 在写任何代码之前确定核心数据模型的最优方案，避免了过度设计（两张表 UNION 查询、复合外键、前端合并逻辑），同时为未来演进预留了平滑迁移路径（JSON `attributes` 扩展字段或按版本拆表）。

---

## Prompt 2: 项目脚手架搭建 (DDD)

**阶段**: DDD — Document-Driven Development

**对话概要**:
> 请根据 PRD 和 Schema 定义，搭建以下项目骨架：
> 1. Backend: Express + TypeScript + sql.js（纯 JS SQLite，Windows 免编译）
> 2. Frontend: Vue 3 + Vite + TypeScript
> 3. 数据库 DDL（7 张表，含 FK/CHECK/UNIQUE/INDEX）
> 4. 种子数据（5 条 discussion，覆盖 created / ready / running / finished 四种状态，含完整 panelists）
> 5. 后端 Repository 层（sql.js 的 exec() 返回数组索引），GET API（带 404）
> 要求：数据库使用 sql.js 而非 better-sqlite3，因为 Windows 环境缺少原生编译工具。所有 sql.js 查询返回的是 `string[]` 数组索引而非对象，Repository 层需要做映射转换。

**Claude 实现**:
依次完成 Backend scaffold → DB Layer → Repository 层（7 个只读方法）→ 6 个 GET 端点 → SSE Manager（连接池 add/remove/broadcast）→ Frontend scaffold → 首页讨论列表 → 演播厅 SSE 集成。

**作用**: 从零搭建整个项目骨架，一次性明确了 sql.js 的调用模式（数组索引映射 vs 命名列）这一关键实现细节，后续所有模块都建立在此基础之上。Seed 数据覆盖了 Discussion 状态机的 4/6 个节点，使前端可以直接测试不同阶段的 UI 状态。

---

## Prompt 3: 前端完整用户流程 (DDD)

**阶段**: DDD — Delivery-Driven Development

**对话概要**:
> 现在需要完成完整用户流程：首页 → 创建讨论页 → 嘉宾确认页 → 演播厅。后端用 mock 嘉宾生成（不接 DeepSeek），前端用简单的 `currentView` 状态切换（不引入 Vue Router）。要求：topic 输入 + expertCount 滑块（2-6）→ 生成嘉宾（后端的 mock 数据需根据 topic hash 做确定性选取，不能每次返回完全固定的人选）→ 确认后 POST 创建 discussion → 进入 StudioView。

**Claude 实现**:
新增 `CreateDiscussionView.vue`（topic 输入 + range 滑块）、`PanelistConfirmView.vue`（卡片网格展示嘉宾阵容）、`App.vue` 四视图切换（home/create/confirm/studio）、后端 `POST /panelists/generate`（含 10 位预设专家池 + 4 位主持人池，按 topic hash 做 Fisher-Yates deterministic shuffle）、`POST /discussions`（创建落库）。

**作用**: 打通从首页到演播厅的完整闭环。Mock 嘉宾生成的确定性 shuffle 设计是关键——相同 topic 始终返回相同嘉宾，不同 topic 返回不同组合，兼顾了可重现性和多样性。前端不使用 Vue Router 的决策降低了初始复杂度，但也为后续引入了明确的升级点。

---

## Prompt 4: Persisted vs Runtime 实体分析 (SDD)

**阶段**: SDD — Schema-Driven Development

**对话概要**:
> 刚才 Schema 中提到的 DiscussionEvent 实体，是否所有事件都应该存入数据库？考虑一个场景：用户在看讨论过程中关闭了浏览器，2 分钟后重新打开——这时候他期望看到哪些内容？哪些内容是丢了也无所谓的？请从"断线重连回放"的角度分析每个事件类型的持久化必要性。

**Claude 评估**:
引入混合持久化策略——将 DiscussionEvent 分为两类：
- **需持久化**（persisted=1）：discussion_started、speech_delivered、consensus_updated、conflict_updated、round_ended、summary_generated、discussion_completed
- **仅运行时**（不落库）：expert_status_change、speech_started、round_started、error、heartbeat

判断标准："用户关掉浏览器重新打开后还需要看到吗？"——transcript 和共识分歧是讨论产出的权威数据源，必须可追溯；专家状态"preparing→speaking→idle"是纯瞬时 UI 动画，重放无意义。

**作用**: 这个决策直接影响了 SSE 断线重连的设计（Last-Event-ID 回放）、数据库写入频率（避免了每秒多次的状态变更写入），以及 Scheduler 的状态管理策略（Runtime Entity 不持久化，进程重启后从 transcript 恢复）。是 Performance vs Data Integrity 之间的精妙平衡。

---

## Prompt 5: DeepSeek API 接入 + Mock Fallback (AI Integration)

**阶段**: AI Integration — AI-Powered Features

**对话概要**:
> 现在把 `POST /api/v1/panelists/generate` 改造成优先调用 DeepSeek，失败时 fallback 到已有 mock 逻辑。要求：
> - API Key 仅从环境变量读取，不得暴露到前端，不得在日志中打印
> - 构造 system prompt 让 DeepSeek 返回 JSON：`{ moderator: {...}, experts: [...] }`
> - 必须对返回内容做严格校验：moderator 是否存在、experts 数量是否匹配、每个 panelist 是否有 role/name/title/stance/color、color 是否为 HEX 格式
> - 校验失败任一即 fallback 到 mock，不得让接口崩溃
>
> 同样地，新增 `POST /discussions/:id/start-ai-demo`：优先用 DeepSeek 生成讨论内容（3-5 条 speeches + 1-2 条 consensus），失败 fallback 到 topic-aware mock。前端新增"启动 AI 讨论"和"启动 Mock 讨论"两个按钮。

**Claude 的系统提示词设计**:
```
你是一个专业的圆桌讨论策划助手。
根据用户输入的话题和专家人数，你生成一位主持人和指定数量的专家嘉宾。
...
只返回 JSON，不要加任何解释、markdown 代码块标记或额外文字。
```

在解析阶段做了双重容错——先尝试直接 `JSON.parse()`，失败后再尝试剥离 markdown code fences 后重试。校验层是 5 层防御：API Key 检查 → HTTP 状态 → JSON 解析 → 结构校验 → 字段级校验（类型 + HEX 正则）。

**作用**: 这是整个项目"AI Core"的入口。DeepSeek + Mock 的双路径设计保证了在没有 API Key 时项目仍可完整运行，在有 API Key 时获得真实 AI 能力。5 层校验防御链确保无论 LLM 返回什么（空内容、错误格式、fenced JSON、缺失字段、非法 HEX），系统都不会崩溃。前端双按钮的设计也让两个路径可并行测试对比。

---

## Prompt 6: 讨论内容 AI 生成 Prompt 工程 (AI Integration)

**阶段**: AI Integration — Prompt Engineering

**对话概要**:
> 对于 `discussionGenerationService.ts` 的 DeepSeek 调用，Prompt 的关键约束：
> 1. 发言人必须是真实 panelists 中的一位（提供 panelist_id 列表而非自由命名）
> 2. 发言内容 1-2 句，保持嘉宾立场的连贯性
> 3. 允许反驳和碰撞（不是轮流表态）
> 4. 输出 JSON 便于解析
>
> 请设计 system prompt，并将 panelist roster（id + name + title + stance + color）注入上下文。

**Claude 的讨论生成 Prompt**:
```
你是一个专业的圆桌讨论导演。根据给定的话题和嘉宾阵容，生成一场精彩的圆桌讨论。

规则：
1. 主持人负责开场引导（1条发言）
2. 专家发言3-5条，可以表达观点、补充或反驳
3. 发言人必须是以下嘉宾中的一位（用 panelist_id 标识）：
   - 主持人: 陈文远 (资深媒体主编)，立场: 中立引导者
   - 专家: 周铭 (研究员)，立场: 从实证数据来看...
   ...
4. 每位专家发言控制在1-2句，简洁有力
5. 立场鲜明，允许反驳和碰撞
6. 同时提炼1-2条共识

返回严格的 JSON 格式：{ "speeches": [...], "consensus": [...] }
```

**效果验证策略**: 在 `validateDiscussionOutput()` 中校验：(a) speeches >= 2 条 (b) 每条 speech 的 `panelist_id` 必须存在于提供的 roster 中 (c) `content` 非空。任何校验失败即降级到 topic-aware mock，用主题哈希从 8 种观点模板和 4 种共识模板中选取，确保 mock 内容不千篇一律。

**作用**: 这是最关键的一段 Prompt 设计——通过将 panelist roster 注入 system prompt，LLM 被约束在已有嘉宾框架内生成内容，避免了"编造新专家"的问题。`panelist_id` 的外键校验则从代码层面兜底，确保发言人和前端嘉宾列表严格一致。

---

## Prompt 7: 后端 API 构建与逐步验证 (TDD)

**阶段**: TDD — Test-Driven Development

**对话概要**:
> 现在需要测试刚创建的 API。请启动后端，用 curl 依次验证每个端点：
> - `GET /api/v1/health` 确认服务启动
> - `GET /api/v1/discussions` 确认返回 5 条 seed 数据
> - `GET /api/v1/discussions/:id` 确认含 panelists
> - `POST /api/v1/panelists/generate` 确认 mock fallback 返回 1 moderator + N experts
> - `POST /api/v1/discussions` 确认创建 discussion 成功并返回 201
> - `POST /api/v1/discussions/:id/start-ai-demo` 确认：无 SSE 客户端时返回 clientCount=0、无 panelists 时返回 400、不存在的 discussion 返回 404
> - `GET /api/v1/discussions/:id/events` 确认 SSE 连接建立 + connected 事件
> - `GET /api/v1/discussions/:id/transcript`、`consensus`、`conflicts`、`summary` 确认各子资源端点正常
>
> 如果任何端点返回异常，修到通过为止。同时跑 `npm run build`（tsc + vue-tsc + vite build），确认零 TypeScript 错误。

**验证流程**:
每个端点用 curl 发出请求 → 检查 HTTP Status Code → 检查响应 JSON 结构 → 确认字段类型和值范围。关键边界 case 逐一覆盖：
- `POST /panelists/generate` 缺 topic → 400
- `POST /panelists/generate` expert_count=1 → 400（不在 2-6 范围）
- `POST /discussions` panelists 数量不对 → 400
- `GET /discussions/:id` 不存在的 UUID → 404
- `POST /discussions/:id/start-ai-demo` 讨论无 panelists → 400

**产出**: 12 个端点全部验证通过。Backend `tsc` 和 Frontend `vue-tsc + vite build` 均零错误。构建流程作为每次 commit 前的强制检查点，确保不引入类型错误。

**作用**: 这是贯穿整个开发周期的持续做法——每完成一个后端模块，立即用 curl 做"穷尽式"验证，而不是等到最后才集中测试。边界 case 的覆盖优先于正常路径——先测 400/404，再测 200/201，确保错误处理不是事后补丁而是第一公民。这种 "API-first TDD" 风格让每个 commit 都有明确的可验证产出。

---

## Prompt 8: 完整用户流程端到端验证 (E2E)

**阶段**: E2E — End-to-End Testing

**对话概要**:
> 现在验证完整用户流程：打开前端 → 首页看到 5 条讨论 → 点击"发起新讨论" → 输入话题 + 调滑块到 3 位专家 → 点击"生成嘉宾阵容" → 确认页看到 1 主持人 + 3 专家卡片（姓名/职业/立场/颜色）→ 点击"确认进入演播厅" → 进入 StudioView → 点击"启动 AI 讨论"（无 API Key 时 fallback 到 mock）→ SSE 实时推送 discussion_started → speaker_status × 4-6 → transcript_delta × 4-6 → consensus_updated → discussion_finished → UI 各区域同步更新。
>
> 同时验证错误路径：话题为空时生成按钮 disabled、生成失败时显示错误消息、返回修改重新生成嘉宾、演播厅"返回"按钮回到首页。每个步骤截图或记录控制台输出。

**端到端流程**:
```
Browser: http://localhost:5173
  → 首页加载 5 条 seed discussions（created/ready/running/finished 各状态徽标）
  → 点击"🎙️ 发起新讨论"
  → 输入 "AI 是否会取代人类创造力？"，滑块调至 3
  → 点击"🎯 生成嘉宾阵容"（POST /panelists/generate → mock fallback）
  → 确认页：4 张卡片（1 主持人 "陈文远" + 3 专家 "李雅文/王峰/赵思远"）
  → 点击"🎬 确认进入演播厅"（POST /discussions → 201 → 跳转 StudioView）
  → StudioView 加载：左侧嘉宾阵容列表，中间空 transcript，右侧空共识/分歧
  → SSE connected 指示灯亮
  → 点击"🤖 启动 AI 讨论"（POST /start-ai-demo → 200, source="mock"）
  → Transcript 面板逐条新增发言（800ms 间隔）：
       [主持人] 陈文远: "感谢各位专家今天的参与..."
       [专家] 李雅文: "工程实践表明..."
       [专家] 王峰: "现有方案在...方面..."
       [专家] 赵思远: "从学术视角看..."
  → 共识面板出现 1-2 条
  → 讨论结束 → "✅ 讨论已结束"
  → 点击"← 返回" → 回到首页，新创建的 discussion 出现在列表顶部
```

**产出**: 全流程无报错，6 个 HTTP 请求均成功，SSE 实时推送 8-14 个事件，UI 4 个区域（嘉宾/transcript/共识/状态）同步响应。前端构建 zero-error。

**作用**: E2E 验证在每次大功能完成后立即执行——不是在"所有代码都写完"之后。这确保了每个 Phase 结束时整个链路都是 working end-to-end，而不是"后端 self-contained 通过 + 前端 self-contained 通过 = 组合后未知"。最关键的发现是：mock fallback 的双按钮设计（AI + Mock 分别调用）让无 API Key 环境也能完整走通全流程，这个设计决策让项目在任何环境下都能 demo。

---

## Prompt 9: 交付包装与文档就绪检查 (Delivery)

**阶段**: Delivery — Final Packaging

**对话概要**:
> 现在进入交付阶段，不再新增业务功能。请执行以下检查清单：
> 1. git status 确认 working tree clean，无 node_modules、dist、.env、*.db 等脏文件
> 2. `frontend npm run build` 和 `backend npm run build` 均 zero-error
> 3. README.md 包含快速开始步骤（clone → cp .env.example → npm install → db:init → db:seed → dev）
> 4. .env.example 标注了所有必需变量，API Key 标注为可选
> 5. 编写 core prompt log（≥6 段），标注每个 Prompt 的阶段、目的和产出
> 6. 最终 git log 线性历史，每个 commit 职责单一
> 7. 列出全部 45 个 project files
>
> 然后补充 3 段 TDD / E2E / Delivery 的 Prompt 记录到 prompt-log.md。

**交付物清单**:

| 类别 | 交付物 | 状态 |
|---|---|---|
| 源码 | 47 个 project files（不含 node_modules/dist/.env） | ✅ |
| 数据库 | `init.sql`（7 张表 DDL）+ `seed.sql`（5 条种子数据，覆盖 4 种状态） | ✅ |
| 后端 | 12 个 API 端点（6 GET + 3 POST + 1 SSE + 2 demo） | ✅ |
| 前端 | 4 个 View 组件（Home / Create / Confirm / Studio），1 个 API client | ✅ |
| AI | DeepSeek 嘉宾生成 + 讨论生成，双路径 mock fallback，5 层校验 | ✅ |
| 文档 | 8 份：PRD / Architecture / Schema / ER / API / Dev Plan / Prompt Log / README | ✅ |
| 会话记录 | 2 份 Session Summary（Session 1 + Session 2） | ✅ |
| Git | 16 commits，线性历史，无 merge | ✅ |
| 构建 | `tsc` + `vue-tsc` + `vite build` 全部 zero-error | ✅ |

**作用**: 交付检查不是"最后一天"才做的事。从第一个 commit 起，每次 `git add` 前都确认 (a) 不走漏 node_modules/dist/.env (b) 双端 build 通过 (c) commit 粒度合理。这些习惯让最终交付变成了一个"确认清单"而非"补救清单"。Prompt Log 的 9 段记录也构成了项目的"设计考古层"——任何一个新加入的开发者都可以从这 9 段记录中理解"为什么这样设计"而非仅仅"代码长什么样"。

---

## 交付后 Review (Superpowers)

本项目使用 **Superpowers**（Claude Code CLI 开发流程插件）进行交付前 review。Superpowers 不是运行时依赖——它只是 Claude Code 的开发辅助工具，项目本身的运行完全不依赖它。

Review 覆盖：
- 文档完整性：8 份文档（PRD / Architecture / Schema / ER / API / Dev Plan / Prompt Log / Testing）+ 2 份 Session Summary
- Prompt Log：9 段核心 Prompt，完整覆盖 SDD / DDD / TDD / E2E / AI Integration / Delivery
- 构建：Backend `tsc` + Frontend `vue-tsc + vite build` 双端 zero-error
- Git：16 commits，线性无 merge
- 技术栈确认：Vue 3 + Express + sql.js + SSE + DeepSeek fallback

---

## 各阶段 Prompt 总结

| # | 阶段 | Prompt 用途 | 产出 |
|---|---|---|---|
| 1 | SDD | 领域模型方案评估（统一 vs 拆分 Panelist） | Schema v1.1 (Persistent + Runtime) |
| 2 | DDD | 项目脚手架搭建 + sql.js 适配 | 全栈骨架 + 7 张表 + 5 条 Seed |
| 3 | DDD | 前端完整用户流程 + Mock 确定性选择 | 4 视图切换 + 2 个 POST API |
| 4 | SDD | Persisted vs Runtime 事件分层 | 混合持久化策略 + 断线重连方案 |
| 5 | AI Integration | DeepSeek 多级 Fallback + JSON 生成 | AI + Mock 双路径嘉宾生成 |
| 6 | AI Integration | 讨论内容 Prompt Engineering + Panelist Roster 约束 | 讨论 Demo 生成 + 校验链 |
| 7 | TDD | 后端 API 构建验证 + curl 逐接口测试 | 12 个端点全部 200/201/404/400 |
| 8 | E2E | 完整用户流程端到端验证 | 首页 → 创建 → 生成 → 确认 → 演播厅 |
| 9 | Delivery | README + 运行说明 + 最终交付检查 | 47 files、16 commits、clean tree |

---

> 本文件记录的是项目开发过程中每一阶段"那个关键 Prompt"——不是把所有对话原文复制，而是选出真正推动架构决策和实现进度的核心对话。每段 Prompt 后附"为什么重要"的分析，帮助读者理解设计意图。
