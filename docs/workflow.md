# AI Panel Studio — 开发工作流说明

> 版本: v1.0 | 日期: 2026-06-27

---

## 1. 开发环境与工具

| 工具 | 用途 |
|---|---|
| **Claude Code** | 主体开发工具：代码生成、架构设计、文档编写、调试 |
| **DeepSeek V4 Pro** | AI 模型（通过 Claude Code API 调用），负责自然语言到代码的转换 |
| **Superpowers** | Claude Code 开发流程插件（project scope 安装），用于交付前 review / checklist |
| **GitHub Desktop** | Git 管理（解决命令行 push 认证/网络问题后的替代方案） |

开发模式：**Claude Code 作为"副驾驶"** —— 每个决策由人工确认，每段代码经过 review，每步提交保持原子性。

---

## 2. 开发阶段与方法论

项目严格遵循 **SDD → DDD → TDD → E2E** 四阶段递进，禁止"一键生成整个项目"。

### Phase 0: SDD — 文档驱动 (Spec-Driven Development)

**产出**: 6 份设计文档（PRD / Architecture / Schema / ER / API / Dev Plan）

**做法**: 在写任何代码之前，先完成：
- 领域模型评审（Panelist 统一 vs 拆分，Persistent vs Runtime 分层）
- 技术选型决策（sql.js 替代 better-sqlite3）
- API 契约定义（REST + SSE 协议）
- 开发计划与 Git commit 规划

**关键 Prompt**: "主持人与专家应该分别建表还是统一放在一张 panelist 表？请从字段差异化、CRUD 复杂度、前端渲染、调度器遍历、扩展性五个维度评估。"

### Phase 1: SDD — 数据建模与 API

**产出**: DDL（7 张表）、Seed 数据（5 条讨论）、Repository 层、REST API、SSE Manager

**做法**: 从 Schema 直接驱动实现——DDL 严格对齐 Schema，Repository 方法名反映领域语义（`findById`、`findAllWithPanelists`），API 端点对应 PRD 功能需求。

### Phase 2: DDD — 文档驱动前端开发 (Document-Driven Development)

**产出**: 4 个 View 组件（Home / Create / Confirm / Studio）

**做法**: 每个页面对应 PRD 中的一个用户故事。前端不使用 Vue Router，用 `currentView` 状态变量做简单视图切换。前端直接对着 dev server 开发，不做前端 mock——所有 API 调用走真实后端，通过 Vite proxy 转发。

### Phase 3: TDD + AI Integration

**产出**: DeepSeek API 客户端、Mock Fallback、AI 讨论 Demo

**做法**: 先定义 API 契约（输入/输出类型），再编写校验逻辑（5 层防御），最后接入 DeepSeek。每个 API 端点用 curl 逐接口验证正确路径（200/201）和错误路径（400/404），修到全部通过。

### Phase 4: E2E + Delivery

**产出**: Prompt Log、Testing Guide、README、交付前 Review

**做法**: 完整用户流程端到端验证（首页 → 创建 → 生成嘉宾 → 确认 → 演播厅 → AI 讨论 → 返回）。双端构建 (`tsc` + `vue-tsc + vite build`) 作为每次 commit 前的强制检查点。

---

## 3. 典型问题与解决路径

### 问题 1: better-sqlite3 在 Windows 原生编译失败

**现象**: `npm install better-sqlite3` 失败——Windows 环境缺少 Visual Studio C++ 构建工具，`node-gyp` 无法编译原生模块。

**解决**: 放弃原生 SQLite 绑定，改用 **sql.js**（纯 JavaScript/WebAssembly 实现的 SQLite）。代价是 API 风格不同——`exec()` 返回 `string[]` 数组索引而非命名列对象，需要在 Repository 层做映射转换。收益是 Windows 开箱即用，零编译依赖。

**教训**: 技术选型需考虑目标环境的实际约束。文档中明确记录了"为什么用 sql.js"以及"数组索引映射"的实现细节，避免后续维护者踩坑。

### 问题 2: DeepSeek API Key 缺失或调用失败

**现象**: 项目需要支持"无 API Key 也能运行"的演示场景。

**解决**: 设计 **双路径 Fallback 架构**：
- **DeepSeek 路径**: 有 API Key → 调用真实 AI → 严格校验返回 JSON（5 层防御）
- **Mock 路径**: 无 Key 或调用失败 → 自动降级到 topic-aware mock 生成

Mock 的嘉宾生成使用确定性 shuffle（按 topic hash 从 10 位预设专家池中选取），保证相同 topic 返回相同嘉宾、不同 topic 返回不同组合。讨论内容也从 8 种观点模板中按 hash 选取，mock 内容不千篇一律。

前端设计"启动 AI 讨论"和"启动 Mock 讨论"两个按钮，两个路径可并行测试对比。

### 问题 3: GitHub Push 认证/网络问题

**现象**: 命令行 `git push` 遇到认证失败（HTTPS 凭据过期 + SSH 未配置）和网络超时。

**解决**: 临时使用 **GitHub Desktop** 完成 push，同时保留命令行 `git add` / `git commit` 的细粒度控制。最终在 `.git/config` 中配置好 SSH remote 后恢复命令行 push。

### 问题 4: 交付前质量保障

**解决**: 使用 **Superpowers 插件**（project scope 安装）进行交付前 review / checklist。Superpowers 是 Claude Code 的 CLI 开发流程插件，不是项目运行时依赖。项目运行仍基于 Vue 3 + Express + sql.js + SSE + DeepSeek fallback。

---

## 4. 对工程化 AI 开发的理解

通过本项目，我形成了以下几点认知：

1. **AI 是副驾驶，不是自动驾驶。** Claude Code 擅长生成代码骨架、编写文档、定位 bug，但架构决策（如 sql.js vs better-sqlite3、统一 Panelist vs 拆分）必须由人来权衡——AI 可以提供选项分析，但最终判断来自对业务场景和目标环境的理解。

2. **小步开发、小步测试、小步 commit。** 每完成一个模块（一个 API 端点、一个前端页面），立即用 curl 或浏览器验证，然后原子提交。不等到"全部写完"再集中测试——那时定位问题的成本指数级上升。17 个 commits 每个都有明确的可验证产出。

3. **文档不是事后补的。** SDD（Spec-Driven Development）的核心价值在于"先想清楚再动手"。Schema 文档中 Persistent vs Runtime 的分层决策避免了后期大量重构；API 契约文档让前后端可以并行开发。

4. **Fallback 是第一公民，不是事后补丁。** DeepSeek API 的 5 层校验防御链和 Mock 双路径设计，确保项目在任何环境下都能完整运行演示。这个设计从 Phase 3 一开始就确立了，而不是"最后做一下错误处理"。

---

## 5. Git 历史总览

```
67c9cca docs: document Superpowers review workflow
1c84b0c docs: update README for delivery
2c23e65 docs: add testing guide
2380660 docs: complete prompt log coverage
c2c4c16 docs: add prompt log
edde37d feat: add AI discussion demo flow
357f494 feat: integrate DeepSeek panelist generation
2c8d526 feat: add discussion creation flow
26652ff docs: add session 2 summary
fbd3e84 feat: add studio view with SSE integration
7e0e2dd feat: add frontend discussion list
1111eb6 feat: add SSE event stream
a2a79e1 chore: add frontend scaffold
97a44ee chore: fix backend scripts
b6ebe22 feat: implement discussion read APIs
aa20a6f chore: add backend scaffold and database schema
60de6b5 chore: initialize project structure
```

17 commits，线性历史，无 merge。每个 commit 职责单一，commit message 遵循 `type: description` 规范。

---

> 本项目严格遵循"小步开发、小步测试、小步 commit"的原则，没有使用任何"一键生成整个项目"的方式。每一行代码都经过人工 review 和验证。
