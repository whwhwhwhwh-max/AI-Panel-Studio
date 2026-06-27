# AI Panel Studio

> AI 圆桌讨论 Web App — 让任何人瞬间召集一支"虚拟智库"

---

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装与运行

```bash
# 1. 克隆项目
git clone <repo-url>
cd AI-Panel-Studio

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env，填入你的 DEEPSEEK_API_KEY

# 3. 初始化数据库
cd backend
npm install
npm run db:init    # 建表
npm run db:seed    # 导入样例数据

# 4. 启动后端
npm run dev        # http://localhost:3000

# 5. 启动前端（新终端）
cd frontend
npm install
npm run dev        # http://localhost:5173
```

---

## 技术选型

| 层 | 技术 |
|---|---|
| 前端 | Vue 3 + Vite + TypeScript |
| 后端 | Node.js + Express + TypeScript |
| 数据库 | SQLite (sql.js) |
| 实时通信 | SSE (Server-Sent Events) |
| AI | DeepSeek V4 Pro |

---

## 主要 API

| Method | Path | 说明 |
|---|---|---|
| GET | `/api/v1/discussions` | 获取讨论列表 |
| POST | `/api/v1/discussions` | 创建新讨论 |
| GET | `/api/v1/discussions/:id` | 获取讨论详情 |
| POST | `/api/v1/discussions/:id/generate-panelists` | 生成嘉宾阵容 |
| POST | `/api/v1/discussions/:id/start` | 开始讨论 |
| GET | `/api/v1/discussions/:id/transcript` | 获取 transcript |
| GET | `/api/v1/discussions/:id/consensus` | 获取共识列表 |
| GET | `/api/v1/discussions/:id/conflicts` | 获取分歧列表 |
| GET | `/api/v1/discussions/:id/events` | SSE 事件流 |
| GET | `/api/v1/discussions/:id/summary` | 获取总结 |

---

## 已完成能力

- [ ] 首页讨论列表
- [ ] 嘉宾自动生成
- [ ] 演播厅实时讨论
- [ ] 专家状态小窗
- [ ] 实时共识与分歧
- [ ] Transcript 回放
- [ ] 主持人总结
- [ ] 多讨论并行隔离
- [ ] 响应式布局

---

## 后续改进方向

- [ ] 讨论录制与回放（视频级）
- [ ] 用户自定义专家 Persona
- [ ] 多语言支持
- [ ] 讨论导出（Markdown/PDF）
- [ ] WebSocket 替代 SSE（双向通信）
- [ ] 讨论模板库
- [ ] 语音合成（TTS）朗读
