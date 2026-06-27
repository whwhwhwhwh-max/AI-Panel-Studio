import 'dotenv/config'
import express from 'express'
import cors from 'cors'

const app = express()
const PORT = parseInt(process.env.PORT || '3000', 10)

// ── Middleware ────────────────────────────────────────────
app.use(cors())
app.use(express.json())

// ── Routes ────────────────────────────────────────────────
app.get('/api/v1/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'ai-panel-studio-backend',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
  })
})

// ── Start ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[AI Panel Studio] Backend server running at http://localhost:${PORT}`)
  console.log(`[AI Panel Studio] Health check: http://localhost:${PORT}/api/v1/health`)
})

export default app
