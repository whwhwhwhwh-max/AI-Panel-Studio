import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { initDatabase } from './db/index.js'
import discussionRoutes from './routes/discussionRoutes.js'
import discussionWriteRoutes from './routes/discussionWriteRoutes.js'
import panelistRoutes from './routes/panelistRoutes.js'
import sseRoutes from './routes/sseRoutes.js'

const app = express()
const PORT = parseInt(process.env.PORT || '3000', 10)

// ── Middleware ────────────────────────────────────────────
app.use(cors())
app.use(express.json())

// ── Init Database ────────────────────────────────────────
await initDatabase()

// ── Routes ────────────────────────────────────────────────
app.get('/api/v1/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'ai-panel-studio-backend',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
  })
})

app.use('/api/v1/discussions', discussionRoutes)
app.use('/api/v1/discussions', discussionWriteRoutes)
app.use('/api/v1/discussions', sseRoutes)
app.use('/api/v1/panelists', panelistRoutes)

// ── 404 ───────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found',
    },
  })
})

// ── Start ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[AI Panel Studio] Backend server running at http://localhost:${PORT}`)
  console.log(`[AI Panel Studio] Health check: http://localhost:${PORT}/api/v1/health`)
})

export default app
