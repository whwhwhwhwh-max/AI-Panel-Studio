// ============================================
// AI Panel Studio — SSE Routes
// ============================================

import { Router } from 'express'
import {
  addClient,
  broadcast,
  getClientCount,
} from '../sse/sseManager.js'
import { findDiscussionById } from '../repositories/discussionRepository.js'

const router = Router()

// ── GET /api/v1/discussions/:id/events ──────

router.get('/:id/events', (req, res) => {
  const discussionId = req.params.id

  // 404 if discussion doesn't exist
  const discussion = findDiscussionById(discussionId)
  if (!discussion) {
    return res.status(404).json({
      error: {
        code: 'DISCUSSION_NOT_FOUND',
        message: `Discussion ${discussionId} not found`,
      },
    })
  }

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  })
  res.flushHeaders()

  // Register client
  const clientId = addClient(discussionId, res)

  // Send connected confirmation
  res.write(
    `event: connected\ndata: {"clientId":"${clientId}","discussionId":"${discussionId}"}\n\n`
  )

  // Heartbeat every 15s to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(`event: heartbeat\ndata: {"timestamp":"${new Date().toISOString()}"}\n\n`)
  }, 15000)

  // Cleanup on disconnect
  res.on('close', () => {
    clearInterval(heartbeat)
  })
})

// ── POST /api/v1/discussions/:id/mock-events ─
// ⚠️  DEV ONLY — injects fake SSE events for UI testing.
// Remove before production.

router.post('/:id/mock-events', (req, res) => {
  const discussionId = req.params.id

  const discussion = findDiscussionById(discussionId)
  if (!discussion) {
    return res.status(404).json({
      error: {
        code: 'DISCUSSION_NOT_FOUND',
        message: `Discussion ${discussionId} not found`,
      },
    })
  }

  const clientCount = getClientCount(discussionId)
  if (clientCount === 0) {
    return res.status(200).json({
      message: 'No SSE clients connected. Events were not sent.',
      clientCount: 0,
    })
  }

  // Fire-and-forget: send mock events with 800ms delays
  const mockEvents = [
    {
      event: 'discussion_started',
      data: {
        discussion_id: discussionId,
        topic: discussion.topic,
        moderator: discussion.panelists.find((p) => p.role === 'moderator') ?? null,
        started_at: new Date().toISOString(),
      },
    },
    {
      event: 'speaker_status',
      data: {
        panelist_id: discussion.panelists[0]?.id ?? 'unknown',
        name: discussion.panelists[0]?.name ?? 'Unknown',
        status: 'speaking',
        public_thought: '正在整理开场观点……',
      },
    },
    {
      event: 'transcript_delta',
      data: {
        panelist_id: discussion.panelists[0]?.id ?? 'unknown',
        name: discussion.panelists[0]?.name ?? 'Unknown',
        content:
          '感谢各位专家今天的参与。我们的话题是："' +
          discussion.topic +
          '"。让我们从不同角度来深度探讨这个问题。',
        sequence: 1,
        round: 1,
        timestamp: new Date().toISOString(),
      },
    },
    {
      event: 'consensus_updated',
      data: {
        items: [
          {
            id: 'mock-consensus-001',
            content: '各方均认可该议题的重要性与时效性',
            round: 1,
          },
        ],
      },
    },
    {
      event: 'discussion_finished',
      data: {
        discussion_id: discussionId,
        total_rounds: 1,
        total_speeches: 1,
        message: 'Mock discussion completed.',
      },
    },
  ]

  // Send sequentially with 800ms delays
  let delay = 0
  for (const ev of mockEvents) {
    setTimeout(() => {
      broadcast(discussionId, ev)
    }, delay)
    delay += 800
  }

  res.status(200).json({
    message: `Mock events queued. Delivering to ${clientCount} client(s) with 800ms intervals.`,
    clientCount,
    eventTypes: mockEvents.map((e) => e.event),
  })
})

export default router
