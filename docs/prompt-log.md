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

## 各阶段 Prompt 总结

| # | 阶段 | Prompt 用途 | 产出 |
|---|---|---|---|
| 1 | SDD | 领域模型方案评估（统一 vs 拆分 Panelist） | Schema v1.1 (Persistent + Runtime) |
| 2 | DDD | 项目脚手架搭建 + sql.js 适配 | 全栈骨架 + 7 张表 + 5 条 Seed |
| 3 | DDD | 前端完整用户流程 + Mock 确定性选择 | 4 视图切换 + 2 个 POST API |
| 4 | SDD | Persisted vs Runtime 事件分层 | 混合持久化策略 + 断线重连方案 |
| 5 | AI Integration | DeepSeek 多级 Fallback + JSON 生成 | AI + Mock 双路径嘉宾生成 |
| 6 | AI Integration | 讨论内容 Prompt Engineering + Panelist Roster 约束 | 讨论 Demo 生成 + 校验链 |

---

> 本文件记录的是项目开发过程中每一阶段"那个关键 Prompt"——不是把所有对话原文复制，而是选出真正推动架构决策和实现进度的核心对话。每段 Prompt 后附"为什么重要"的分析，帮助读者理解设计意图。
