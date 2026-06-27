// ============================================
// AI Panel Studio — Discussion Write Routes
// ============================================
// POST /api/v1/discussions
//   → 创建 discussion + panelists，返回 DiscussionDetail
// ============================================

import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import { getDatabase } from '../db/index.js'
import type { CreateDiscussionRequest, DiscussionDetail } from '../types/index.js'

const router = Router()

router.post('/', (req, res) => {
  const { topic, expert_count, panelists } = req.body as CreateDiscussionRequest

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
  if (!Array.isArray(panelists) || panelists.length !== expert_count + 1) {
    return res.status(400).json({
      error: {
        code: 'INVALID_INPUT',
        message: `panelists must be an array of length expert_count + 1 (${expert_count + 1})`,
      },
    })
  }

  // 确保有 1 moderator + N experts
  const moderators = panelists.filter((p) => p.role === 'moderator')
  const experts = panelists.filter((p) => p.role === 'expert')
  if (moderators.length !== 1 || experts.length !== expert_count) {
    return res.status(400).json({
      error: {
        code: 'INVALID_INPUT',
        message: `panelists must contain exactly 1 moderator and ${expert_count} experts`,
      },
    })
  }

  const db = getDatabase()
  const now = new Date().toISOString()
  const discussionId = uuid()

  const run = (sql: string, params: any[] = []) => {
    db.run(sql, params)
  }

  try {
    // 1. INSERT discussion (status = ready, 因为嘉宾已在确认页确认)
    run(
      `INSERT INTO discussion (id, topic, expert_count, status, created_at, updated_at)
       VALUES (?, ?, ?, 'ready', ?, ?)`,
      [discussionId, topic.trim(), expert_count, now, now]
    )

    // 2. INSERT panelists
    for (const p of panelists) {
      const panelistId = uuid()
      run(
        `INSERT INTO panelist (id, discussion_id, role, name, title, stance, color, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [panelistId, discussionId, p.role, p.name, p.title, p.stance, p.color, now]
      )
    }

    // 3. Read back the created discussion
    const discResult = db.exec(
      `SELECT id, topic, expert_count, status, created_at, updated_at
       FROM discussion WHERE id = ?`,
      [discussionId]
    )
    const row = discResult[0].values[0]
    const discussion: DiscussionDetail = {
      id: row[0] as string,
      topic: row[1] as string,
      expert_count: row[2] as number,
      status: row[3] as any,
      created_at: row[4] as string,
      updated_at: row[5] as string,
      panelists: [],
    }

    const pResult = db.exec(
      `SELECT id, discussion_id, role, name, title, stance, color, created_at
       FROM panelist WHERE discussion_id = ?
       ORDER BY role DESC, created_at ASC`,
      [discussionId]
    )
    if (pResult.length && pResult[0].values.length) {
      discussion.panelists = pResult[0].values.map((r: any) => ({
        id: r[0],
        discussion_id: r[1],
        role: r[2],
        name: r[3],
        title: r[4],
        stance: r[5],
        color: r[6],
        created_at: r[7],
      }))
    }

    res.status(201).json({ discussion })
  } catch (err) {
    console.error('[POST /discussions] Failed to create discussion:', err)
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create discussion',
      },
    })
  }
})

export default router
