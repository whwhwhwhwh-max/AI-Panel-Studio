// ============================================
// AI Panel Studio — Discussion Routes
// ============================================

import { Router } from 'express'
import {
  findAllDiscussions,
  findDiscussionById,
  findPanelistsByDiscussionId,
  findTranscriptByDiscussionId,
  findConsensusByDiscussionId,
  findConflictsByDiscussionId,
  findSummaryByDiscussionId,
} from '../repositories/discussionRepository.js'

const router = Router()

// ── GET /api/v1/discussions ─────────────────

router.get('/', (_req, res) => {
  const discussions = findAllDiscussions()
  res.json({ discussions })
})

// ── GET /api/v1/discussions/:id ─────────────

router.get('/:id', (req, res) => {
  const discussion = findDiscussionById(req.params.id)
  if (!discussion) {
    return res.status(404).json({
      error: {
        code: 'DISCUSSION_NOT_FOUND',
        message: `Discussion ${req.params.id} not found`,
      },
    })
  }
  res.json({ discussion })
})

// ── GET /api/v1/discussions/:id/panelists ───

router.get('/:id/panelists', (req, res) => {
  const discussion = findDiscussionById(req.params.id)
  if (!discussion) {
    return res.status(404).json({
      error: {
        code: 'DISCUSSION_NOT_FOUND',
        message: `Discussion ${req.params.id} not found`,
      },
    })
  }
  const panelists = findPanelistsByDiscussionId(req.params.id)
  res.json({ panelists })
})

// ── GET /api/v1/discussions/:id/transcript ──

router.get('/:id/transcript', (req, res) => {
  const discussion = findDiscussionById(req.params.id)
  if (!discussion) {
    return res.status(404).json({
      error: {
        code: 'DISCUSSION_NOT_FOUND',
        message: `Discussion ${req.params.id} not found`,
      },
    })
  }
  const transcript = findTranscriptByDiscussionId(req.params.id)
  res.json({ transcript })
})

// ── GET /api/v1/discussions/:id/consensus ───

router.get('/:id/consensus', (req, res) => {
  const discussion = findDiscussionById(req.params.id)
  if (!discussion) {
    return res.status(404).json({
      error: {
        code: 'DISCUSSION_NOT_FOUND',
        message: `Discussion ${req.params.id} not found`,
      },
    })
  }
  const consensus = findConsensusByDiscussionId(req.params.id)
  res.json({ consensus })
})

// ── GET /api/v1/discussions/:id/conflicts ───

router.get('/:id/conflicts', (req, res) => {
  const discussion = findDiscussionById(req.params.id)
  if (!discussion) {
    return res.status(404).json({
      error: {
        code: 'DISCUSSION_NOT_FOUND',
        message: `Discussion ${req.params.id} not found`,
      },
    })
  }
  const conflicts = findConflictsByDiscussionId(req.params.id)
  res.json({ conflicts })
})

// ── GET /api/v1/discussions/:id/summary ─────

router.get('/:id/summary', (req, res) => {
  const discussion = findDiscussionById(req.params.id)
  if (!discussion) {
    return res.status(404).json({
      error: {
        code: 'DISCUSSION_NOT_FOUND',
        message: `Discussion ${req.params.id} not found`,
      },
    })
  }
  const summary = findSummaryByDiscussionId(req.params.id)

  // 如果讨论已结束但没有 summary，返回空对象
  if (!summary) {
    return res.json({ summary: null })
  }

  res.json({ summary })
})

export default router
