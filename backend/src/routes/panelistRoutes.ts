// ============================================
// AI Panel Studio — Panelist Generation Routes
// ============================================
// POST /api/v1/panelists/generate
//   → 优先调用 DeepSeek API，失败时 fallback 到 mock
// ============================================

import { Router } from 'express'
import type { GeneratePanelistsRequest, GeneratePanelistsResponse } from '../types/index.js'
import { generatePanelists } from '../ai/panelistGenerationService.js'

const router = Router()

// ── Route ───────────────────────────────────

router.post('/generate', async (req, res) => {
  const { topic, expert_count } = req.body as GeneratePanelistsRequest

  // 参数校验
  if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
    return res.status(400).json({
      error: { code: 'INVALID_INPUT', message: 'topic is required and must be a non-empty string' },
    })
  }
  if (
    typeof expert_count !== 'number' ||
    !Number.isInteger(expert_count) ||
    expert_count < 2 ||
    expert_count > 6
  ) {
    return res.status(400).json({
      error: {
        code: 'INVALID_INPUT',
        message: 'expert_count must be an integer between 2 and 6',
      },
    })
  }

  try {
    const result = await generatePanelists(topic.trim(), expert_count)

    const response: GeneratePanelistsResponse = {
      topic: topic.trim(),
      expert_count,
      panelists: result.panelists,
    }

    res.json(response)
  } catch (err) {
    console.error('[panelistRoutes] Unexpected error:', err)
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to generate panelists',
      },
    })
  }
})

export default router
