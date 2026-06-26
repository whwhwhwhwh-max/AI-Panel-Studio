# API 契约文档

> 版本: v1.0 | 日期: 2026-06-26 | 状态: Draft

---

## Chapter 1: REST API

### 1.1 基础信息

| 项 | 值 |
|---|---|
| Base URL | `http://localhost:3000/api/v1` |
| Content-Type | `application/json; charset=utf-8` |
| 编码 | UTF-8 |

### 1.2 端点列表

| Method | Path | 说明 |
|---|---|---|
| GET | `/discussions` | 获取讨论列表 |
| POST | `/discussions` | 创建新讨论（含话题 + 专家人数） |
| GET | `/discussions/:id` | 获取单个讨论详情 |
| POST | `/discussions/:id/generate-panelists` | 生成嘉宾阵容 |
| GET | `/discussions/:id/panelists` | 获取讨论的嘉宾列表 |
| POST | `/discussions/:id/start` | 用户确认嘉宾后开始讨论 |
| GET | `/discussions/:id/transcript` | 获取讨论 transcript |
| GET | `/discussions/:id/consensus` | 获取共识列表 |
| GET | `/discussions/:id/conflicts` | 获取分歧列表 |
| GET | `/discussions/:id/summary` | 获取讨论总结 |

---

### 1.3 请求/响应结构

#### GET /discussions

```
Response 200:
{
  "discussions": [
    {
      "id": "uuid",
      "topic": "AI 是否会取代人类创造力？",
      "expert_count": 4,
      "status": "in_progress",
      "created_at": "2026-06-26T10:00:00Z",
      "updated_at": "2026-06-26T10:05:00Z"
    }
  ]
}
```

#### POST /discussions

```
Request:
{
  "topic": "AI 是否会取代人类创造力？",
  "expert_count": 4           // 默认 4，范围 2-6
}

Response 201:
{
  "discussion": {
    "id": "uuid",
    "topic": "AI 是否会取代人类创造力？",
    "expert_count": 4,
    "status": "pending_panelists",
    "created_at": "2026-06-26T10:00:00Z",
    "updated_at": "2026-06-26T10:00:00Z"
  }
}
```

#### POST /discussions/:id/generate-panelists

```
Response 200:
{
  "moderator": {
    "id": "uuid",
    "role": "moderator",
    "name": "张维",
    "title": "资深媒体人 / 圆桌主持人",
    "stance": "中立引导者",
    "color": "#C0C0C0",
    "is_moderator": true
  },
  "experts": [
    {
      "id": "uuid",
      "role": "expert",
      "name": "林晓",
      "title": "AI 研究员 / 前 OpenAI 工程师",
      "stance": "AI 是工具，不会取代而是增强人类创造力",
      "color": "#4A90D9",
      "is_moderator": false
    }
    // ... 2-6 位专家
  ]
}
```

#### POST /discussions/:id/start

```
Response 200:
{
  "discussion_id": "uuid",
  "status": "in_progress",
  "message": "讨论已开始，请通过 SSE 订阅实时事件"
}
```

#### GET /discussions/:id/transcript

```
Response 200:
{
  "transcript": [
    {
      "id": "uuid",
      "panelist_id": "uuid",
      "name": "林晓",
      "title": "AI 研究员 / 前 OpenAI 工程师",
      "color": "#4A90D9",
      "content": "我认为 AI 并不会取代创造力，恰恰相反...",
      "sequence": 1,
      "round": 1,
      "created_at": "2026-06-26T10:05:00Z"
    }
  ]
}
```

#### GET /discussions/:id/consensus

```
Response 200:
{
  "consensus": [
    {
      "id": "uuid",
      "content": "各方一致认为 AI 在数据处理方面远超人类",
      "round": 1
    }
  ]
}
```

#### GET /discussions/:id/conflicts

```
Response 200:
{
  "conflicts": [
    {
      "id": "uuid",
      "content": "林晓认为 AI 不会取代创造力，王刚持相反观点",
      "round": 1
    }
  ]
}
```

#### GET /discussions/:id/summary

```
Response 200:
{
  "summary": {
    "id": "uuid",
    "content": "经过今天的讨论...（自然语言总结）",
    "generated_at": "2026-06-26T10:30:00Z"
  }
}
```

---

### 1.4 错误码规范

| HTTP Status | code | 说明 |
|---|---|---|
| 400 | `BAD_REQUEST` | 请求参数校验失败 |
| 404 | `DISCUSSION_NOT_FOUND` | 讨论不存在 |
| 409 | `INVALID_STATUS` | 当前状态不允许该操作 |
| 500 | `INTERNAL_ERROR` | 服务器内部错误 |
| 502 | `AI_SERVICE_ERROR` | AI 接口调用失败 |

```
Error Response:
{
  "error": {
    "code": "INVALID_STATUS",
    "message": "讨论状态为 in_progress，无法重新生成嘉宾"
  }
}
```

---

## Chapter 2: SSE 协议

### 2.1 SSE Endpoint

| 项 | 值 |
|---|---|
| URL | `GET /api/v1/discussions/:id/events` |
| Content-Type | `text/event-stream` |
| 连接保活 | 每 15 秒发送 heartbeat |

---

### 2.2 Event 类型枚举

| Event Type | 方向 | 说明 |
|---|---|---|
| `discussion_started` | S→C | 讨论开始 |
| `panelists_generated` | S→C | 嘉宾阵容生成完毕 |
| `expert_status_change` | S→C | 专家状态变化 |
| `speech_delivered` | S→C | 一段发言完成（逐句推送） |
| `consensus_updated` | S→C | 共识更新 |
| `conflict_updated` | S→C | 分歧更新 |
| `round_ended` | S→C | 一轮讨论结束 |
| `summary_generated` | S→C | 总结已生成 |
| `discussion_completed` | S→C | 讨论结束 |
| `error` | S→C | 错误事件 |
| `heartbeat` | S→C | 连接保活 |

---

### 2.3 Event 数据结构

#### discussion_started
```
event: discussion_started
data: {
  "discussion_id": "uuid",
  "topic": "...",
  "moderator": { "id": "...", "name": "...", "title": "..." }
}
```

#### expert_status_change
```
event: expert_status_change
data: {
  "panelist_id": "uuid",
  "status": "preparing",          // "idle" | "preparing" | "speaking"
  "public_thought": "正在组织关于技术可行性的论点..."  // 公开思考摘要
}
```

#### speech_delivered
```
event: speech_delivered
data: {
  "id": "uuid",
  "panelist_id": "uuid",
  "name": "林晓",
  "title": "AI 研究员",
  "color": "#4A90D9",
  "content": "我认为 AI 并不会取代创造力，恰恰相反...",
  "sequence": 1,
  "round": 1,
  "timestamp": "2026-06-26T10:05:00Z"
}
```

#### consensus_updated
```
event: consensus_updated
data: {
  "items": [
    { "id": "uuid", "content": "各方一致认为..." }
  ]
}
```

#### conflict_updated
```
event: conflict_updated
data: {
  "items": [
    { "id": "uuid", "content": "林晓 vs 王刚：关于..." }
  ]
}
```

#### summary_generated
```
event: summary_generated
data: {
  "content": "今天的讨论中，各位专家围绕..."
}
```

#### discussion_completed
```
event: discussion_completed
data: {
  "discussion_id": "uuid",
  "total_rounds": 5,
  "total_speeches": 23
}
```

#### error
```
event: error
data: {
  "code": "AI_SERVICE_ERROR",
  "message": "AI 接口响应超时，正在重试..."
}
```

#### heartbeat
```
event: heartbeat
data: { "timestamp": "2026-06-26T10:05:00Z" }
```

---

### 2.4 SSE 错误处理

| 场景 | 处理方式 |
|---|---|
| 客户端断连 | 前端自动重连（EventSource 内置），携带 `Last-Event-ID` |
| 服务端重连 | 根据 `Last-Event-ID` 补推遗漏事件（从 DB 查询 sequence > last_event_id） |
| 讨论已结束 | 服务端推送 `discussion_completed` 后主动关闭连接 |
| 讨论不存在 | 返回 404，EventSource 触发 onerror |
| 心跳超时 | 客户端 30s 未收到任何事件则主动重连 |

---

<!-- TODO: Phase 2+ 补充更多边界 case，如并发讨论隔离的实现细节 -->
