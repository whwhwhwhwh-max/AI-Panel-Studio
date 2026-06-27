# AI Panel Studio — 测试说明

> 版本: v1.0 | 日期: 2026-06-27 | 状态: MVP

---

## 一、构建测试

### 1.1 Backend 构建

```bash
cd backend
npm run build    # 执行 tsc（TypeScript 编译器）
# 预期输出: (无错误，正常退出)
```

| 项目 | 值 |
|---|---|
| 编译器 | `tsc` (TypeScript Compiler) |
| 配置 | `backend/tsconfig.json` — `noEmit: true`（仅类型检查，不产出 JS） |
| 预期 | 零错误退出，无 warning |
| 状态 | ✅ 通过 |

### 1.2 Frontend 构建

```bash
cd frontend
npm run build    # 执行 vue-tsc + vite build
# 预期输出: ✓ 23 modules transformed, ✓ built in <1s
```

| 项目 | 值 |
|---|---|
| 类型检查 | `vue-tsc` (Vue TypeScript 类型检查) |
| 打包 | `vite build` — 产出 `dist/` 目录 |
| 文件输出 | `index.html` + CSS + JS（gzip ~30KB） |
| 预期 | 零类型错误，构建成功 |
| 状态 | ✅ 通过 |

### 1.3 双端构建结果

```
✅ Backend  — tsc              zero-error
✅ Frontend — vue-tsc + vite   zero-error, 23 modules built
```

---

## 二、后端 API 测试

> 前置条件: Backend 运行在 `http://localhost:3000`

### 2.1 端点一览

| # | Method | Path | 说明 | 测试状态 |
|---|---|---|---|---|
| 1 | GET | `/api/v1/health` | 服务健康检查 | ✅ |
| 2 | GET | `/api/v1/discussions` | 讨论列表 | ✅ |
| 3 | GET | `/api/v1/discussions/:id` | 讨论详情（含 panelists） | ✅ |
| 4 | GET | `/api/v1/discussions/:id/events` | SSE 事件流 | ✅ |
| 5 | POST | `/api/v1/discussions/:id/mock-events` | 触发模拟事件（仅开发用） | ✅ |
| 6 | POST | `/api/v1/panelists/generate` | 生成嘉宾阵容（AI + mock） | ✅ |
| 7 | POST | `/api/v1/discussions` | 创建新讨论 | ✅ |
| 8 | POST | `/api/v1/discussions/:id/start-ai-demo` | 启动 AI 讨论 Demo | ✅ |

### 2.2 端点测试方法

#### GET /api/v1/health

```bash
curl -s http://localhost:3000/api/v1/health
# 预期: {"status":"ok","service":"ai-panel-studio-backend","version":"0.1.0",...}
```

#### GET /api/v1/discussions

```bash
curl -s http://localhost:3000/api/v1/discussions
# 预期: {"discussions": [...]}  包含 5 条 seed 讨论
```

#### GET /api/v1/discussions/:id

```bash
curl -s http://localhost:3000/api/v1/discussions/d001-0000-0000-000000000001
# 预期: {"discussion": {...}}  topic="量子计算是否会取代经典计算机？", 含 panelists 数组

# 不存在
curl -s http://localhost:3000/api/v1/discussions/does-not-exist
# 预期: {"error":{"code":"DISCUSSION_NOT_FOUND","message":"..."}}  HTTP 404
```

#### GET /api/v1/discussions/:id/events

```bash
curl -N http://localhost:3000/api/v1/discussions/d001-0000-0000-000000000001/events
# 预期: SSE 连接建立，立即收到 connected 事件，之后每 15s 收到 heartbeat
```

#### POST /api/v1/discussions/:id/mock-events

```bash
curl -X POST http://localhost:3000/api/v1/discussions/d001-0000-0000-000000000001/mock-events
# 预期: 如果有 SSE 客户端连接，返回 200 + 推送 5 个事件；否则返回 clientCount=0
```

#### POST /api/v1/panelists/generate

```bash
# 正常请求
curl -s -X POST http://localhost:3000/api/v1/panelists/generate \
  -H "Content-Type: application/json" \
  -d '{"topic":"AI 是否会取代人类创造力？","expert_count":3}'
# 预期: {"topic":"...","expert_count":3,"panelists":[...]}  1 moderator + 3 experts

# 缺少 topic
curl -s -X POST http://localhost:3000/api/v1/panelists/generate \
  -H "Content-Type: application/json" \
  -d '{"expert_count":3}'
# 预期: {"error":{"code":"INVALID_INPUT","message":"..."}}  HTTP 400

# expert_count 超出范围
curl -s -X POST http://localhost:3000/api/v1/panelists/generate \
  -H "Content-Type: application/json" \
  -d '{"topic":"测试","expert_count":1}'
# 预期: {"error":{"code":"INVALID_INPUT","message":"..."}}  HTTP 400
```

#### POST /api/v1/discussions

```bash
# 正常创建
curl -s -X POST http://localhost:3000/api/v1/discussions \
  -H "Content-Type: application/json" \
  -d '{
    "topic":"测试讨论",
    "expert_count":2,
    "panelists":[
      {"name":"主持人","title":"Host","stance":"Neutral","color":"#708090","role":"moderator"},
      {"name":"专家A","title":"Doctor","stance":"Pro","color":"#4A90D9","role":"expert"},
      {"name":"专家B","title":"Engineer","stance":"Con","color":"#E06C42","role":"expert"}
    ]
  }'
# 预期: {"discussion":{...}}  HTTP 201，含 panelists 数组

# panelists 数量不对
curl -s -X POST http://localhost:3000/api/v1/discussions \
  -H "Content-Type: application/json" \
  -d '{"topic":"测试","expert_count":2,"panelists":[{"name":"X","title":"T","stance":"S","color":"#708090","role":"moderator"}]}'
# 预期: {"error":{"code":"INVALID_INPUT","message":"..."}}  HTTP 400
```

#### POST /api/v1/discussions/:id/start-ai-demo

```bash
# 无 SSE 客户端时
curl -s -X POST http://localhost:3000/api/v1/discussions/d001-0000-0000-000000000001/start-ai-demo
# 预期: {"message":"No SSE clients connected...","clientCount":0}  HTTP 200

# 不存在的 discussion
curl -s -X POST http://localhost:3000/api/v1/discussions/does-not-exist/start-ai-demo
# 预期: {"error":{"code":"DISCUSSION_NOT_FOUND","message":"..."}}  HTTP 404

# 无 panelists 的 discussion（如 d004，status=created）
curl -s -X POST http://localhost:3000/api/v1/discussions/d004-0000-0000-000000000004/start-ai-demo
# 预期: {"error":{"code":"NO_PANELISTS","message":"..."}}  HTTP 400
```

---

## 三、SSE 测试

### 3.1 建立 SSE 连接

```bash
# 终端 1: 建立 SSE 连接并保持
curl -N http://localhost:3000/api/v1/discussions/d001-0000-0000-000000000001/events
```

连接建立后立即收到：

```
event: connected
data: {"clientId":"uuid","discussionId":"d001-0000-0000-000000000001"}
```

之后每 15 秒收到：

```
event: heartbeat
data: {"timestamp":"2026-06-27T..."}
```

### 3.2 触发 mock-events

在 **终端 2** 执行触发命令：

```bash
curl -X POST http://localhost:3000/api/v1/discussions/d001-0000-0000-000000000001/mock-events
```

终端 1 的 SSE 流中将依次收到（800ms 间隔）：

```
event: discussion_started
event: speaker_status
event: transcript_delta
event: consensus_updated
event: discussion_finished
```

### 3.3 触发 start-ai-demo

在保持 SSE 连接的同时：

```bash
curl -X POST http://localhost:3000/api/v1/discussions/d001-0000-0000-000000000001/start-ai-demo
# 预期: {"message":"AI demo queued...","source":"mock","eventCount":6-10}
```

SSE 流中将收到 6-10 个事件：
- `discussion_started` (1)
- `speaker_status` + `transcript_delta` (4-6 对，含主持人开场 + 专家发言)
- `consensus_updated` (1)
- `discussion_finished` (1)

### 3.4 前端 SSE 验证

在浏览器中打开演播厅页面，前端自动建立 EventSource 连接到 SSE 端点。点击"启动 Mock 讨论"或"启动 AI 讨论"按钮 → transcript 区域逐条显示发言，共识面板实时更新，SSE 指示灯显示连接状态。

---

## 四、Fallback 测试

### 4.1 测试目标

验证 DeepSeek API 不可用时，系统自动降级到 mock 生成，不崩溃、不报错。

### 4.2 测试前置

确保 `.env` 文件中 `DEEPSEEK_API_KEY` 未设置或为占位符 `sk-your-api-key-here`。

### 4.3 嘉宾生成 Fallback

```bash
curl -s -X POST http://localhost:3000/api/v1/panelists/generate \
  -H "Content-Type: application/json" \
  -d '{"topic":"AI 与未来教育","expert_count":4}'
```

- 后端日志输出: `[panelistService] DeepSeek not configured, using mock generation`
- 响应: 正常返回 1 moderator + 4 experts，无错误
- 服务未崩溃

### 4.4 AI 讨论 Fallback

```bash
# 先建立 SSE 连接，再触发
curl -s -X POST http://localhost:3000/api/v1/discussions/d001-0000-0000-000000000001/start-ai-demo
```

- 后端日志输出: `[discussionService] DeepSeek not configured, using mock discussion`
- 响应: `{"source":"mock","eventCount":6,"clientCount":1}`
- SSE 流正常推送，发言内容与 discussion topic 相关

### 4.5 Fallback 结论

| 场景 | AI 可用 | AI 不可用 | 结果 |
|---|---|---|---|
| 嘉宾生成 | DeepSeek 返回 | Mock 预设池 | ✅ 始终返回有效嘉宾 |
| 讨论生成 | DeepSeek 返回 | Mock topic-aware | ✅ 始终推送完整讨论流 |
| 接口状态码 | 200 | 200 | ✅ 不返回 500 |
| 前端体验 | 真实 AI 内容 | Mock 内容（与 topic 相关） | ✅ 用户无感知差异 |

---

## 五、E2E 测试

### 5.1 全链路测试流程

```bash
# 终端 1: 启动后端
cd backend && npm run dev     # http://localhost:3000

# 终端 2: 启动前端
cd frontend && npm run dev    # http://localhost:5173
```

浏览器操作流程：

```
Step 1: 打开 http://localhost:5173
        → 首页显示讨论列表（5 条 seed 数据）

Step 2: 点击"🎙️ 发起新讨论"
        → 进入创建讨论页

Step 3: 输入话题 "AI 是否会取代人类创造力？"
        拖动滑块到 3 位专家
        → 滑块值实时更新

Step 4: 点击"🎯 生成嘉宾阵容"
        → 后端 POST /panelists/generate → 200
        → 跳转到嘉宾确认页

Step 5: 确认页展示 4 张卡片：
        - 🎤 主持人: 陈文远（资深媒体主编）
        - 👤 专家: 李雅文（高级工程师）
        - 👤 专家: 王峰（CTO）
        - 👤 专家: 赵思远（教授）
        → 每张卡片含姓名/Title/立场/色块

Step 6: 点击"🎬 确认进入演播厅"
        → 后端 POST /discussions → 201
        → 跳转到演播厅页面
        → 左侧: 嘉宾阵容列表
        → 中间: 空 transcript 区
        → 右侧: 共识/分歧面板（空）
        → SSE 指示灯: "已连接"（绿色）

Step 7: 点击"🤖 启动 AI 讨论"
        → 后端 POST /start-ai-demo → 200
        → Transcript 区逐条显示发言（800ms 间隔）
        → 共识面板同步更新
        → 发言内容与话题相关

Step 8: 讨论结束
        → "✅ 讨论已结束" 提示显示
        → 按钮变为 disabled 状态

Step 9: 点击"← 返回"
        → 回到首页
        → 新创建的讨论出现在列表顶部
```

### 5.2 E2E 请求时序

```
Browser                     Backend                      SSE
  │                            │                          │
  │── GET /discussions ──────→│                          │
  │←── 200 (5 discussions) ───│                          │
  │                            │                          │
  │── [点击"发起新讨论"]       │                          │
  │                            │                          │
  │── POST /panelists/generate →                          │
  │←── 200 (4 panelists) ─────│                          │
  │                            │                          │
  │── [点击"确认进入演播厅"]   │                          │
  │── POST /discussions ─────→│                          │
  │←── 201 (discussion) ──────│                          │
  │                            │                          │
  │── GET /events ────────────→                          │
  │←── connected ────────────────────────────────────────│
  │                            │                          │
  │── POST /start-ai-demo ───→│                          │
  │                            │── discussion_started ──→│
  │←── speaker_status ───────────────────────────────────│
  │←── transcript_delta ─────────────────────────────────│
  │←── transcript_delta ─────────────────────────────────│
  │←── transcript_delta ─────────────────────────────────│
  │←── transcript_delta ─────────────────────────────────│
  │←── consensus_updated ────────────────────────────────│
  │←── discussion_finished ──────────────────────────────│
  │                            │                          │
  │── [点击"返回"] ──────────→│                          │
```

---

## 六、边界测试

### 6.1 404 — 不存在 Discussion

```bash
# 不存在的 discussion id
curl -s http://localhost:3000/api/v1/discussions/00000000-0000-0000-0000-000000000000
# 预期: 404, {"error":{"code":"DISCUSSION_NOT_FOUND"}}

curl -s -X POST http://localhost:3000/api/v1/discussions/00000000-0000-0000-0000-000000000000/start-ai-demo
# 预期: 404, {"error":{"code":"DISCUSSION_NOT_FOUND"}}

curl -s http://localhost:3000/api/v1/discussions/00000000-0000-0000-0000-000000000000/events
# 预期: 404, {"error":{"code":"DISCUSSION_NOT_FOUND"}}
```

### 6.2 400 — 参数校验失败

```bash
# topic 为空
curl -s -X POST http://localhost:3000/api/v1/panelists/generate \
  -H "Content-Type: application/json" -d '{"topic":"","expert_count":3}'
# 预期: 400

# expert_count 超出范围 [2-6]
curl -s -X POST http://localhost:3000/api/v1/panelists/generate \
  -H "Content-Type: application/json" -d '{"topic":"test","expert_count":10}'
# 预期: 400

# panelists 数量与 expert_count 不匹配
curl -s -X POST http://localhost:3000/api/v1/discussions \
  -H "Content-Type: application/json" \
  -d '{"topic":"test","expert_count":4,"panelists":[只有 2 个]}'
# 预期: 400
```

### 6.3 400 — 无 Panelists 启动 AI 讨论

```bash
curl -s -X POST http://localhost:3000/api/v1/discussions/d004-0000-0000-000000000004/start-ai-demo
# 预期: 400, {"error":{"code":"NO_PANELISTS"}}
# 说明: d004 状态为 created，只有 discussion 记录，没有 panelists
```

### 6.4 SSE 客户端数为 0

```bash
# 在不打开 SSE 连接的情况下
curl -s -X POST http://localhost:3000/api/v1/discussions/d001-0000-0000-000000000001/start-ai-demo
# 预期: 200, {"message":"No SSE clients connected...","clientCount":0}
# 说明: 不会抛 500 错误，接口优雅降级
```

### 6.5 空 Topic 前端保护

在创建讨论页中：
- topic 输入框为空时，"生成嘉宾阵容"按钮 `disabled`
- 输入空格后按钮仍 `disabled`（前端 `.trim()` 校验）

---

## 七、测试结论

### 7.1 测试覆盖总结

| 测试类型 | 覆盖范围 | 结果 |
|---|---|---|
| 构建测试 | Backend (`tsc`) + Frontend (`vue-tsc` + `vite build`) | ✅ Zero-error |
| API 正确路径 | 8 个端点正常返回 200/201 | ✅ 全部通过 |
| API 错误路径 | 404 (3 场景) + 400 (5 场景) | ✅ 全部通过 |
| SSE 连接 | 连接建立 → heartbeat → 事件推送 → 自动关闭 | ✅ 通过 |
| Fallback | 无 API Key 时嘉宾生成 + 讨论生成均降级到 mock | ✅ 不崩溃 |
| E2E 流程 | 首页 → 创建 → 生成嘉宾 → 确认 → 演播厅 → AI 讨论 | ✅ 完整可走通 |
| 边界 | 不存在 ID / 无 panelists / 0 SSE 客户端 | ✅ 优雅处理 |

### 7.2 当前局限

- SSE 断线重连回放（Last-Event-ID）: 前端 EventSource 有内置重连能力，后端 `persisted` 字段已为回放预留，但当前未实现 DB 查询回放逻辑
- 真实 AI 调用: 需要配置有效 `DEEPSEEK_API_KEY` 才能验证 DeepSeek 路径；当前 mock 路径已完整验证
- 并发讨论隔离: 已在 SSE Manager 中通过 `Map<discussion_id, Client[]>` 实现通道隔离，但未做并发压测

### 7.3 MVP 交付判定

| 交付标准 | 状态 |
|---|---|
| 后端 API 全部可用，错误处理完备 | ✅ |
| 前端完整用户流程可走通 | ✅ |
| SSE 实时事件流推送正常 | ✅ |
| AI + Mock 双路径 fallback 可用 | ✅ |
| 构建 zero-error | ✅ |
| 文档完备（8 份） | ✅ |
| Git 线性历史，commit 职责单一 | ✅ |

**结论: MVP 已通过手动 E2E 测试和构建测试，具备交付条件。**
