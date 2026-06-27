// ============================================
// AI Panel Studio — Discussion Repository
// ============================================

import { getDatabase } from '../db/index.js'
import type {
  Discussion,
  Panelist,
  Transcript,
  Consensus,
  Conflict,
  Summary,
  DiscussionDetail,
} from '../types/index.js'

/**
 * 将 SQL 行映射为 Discussion 对象
 */
function mapDiscussion(row: any): Discussion {
  return {
    id: row[0],
    topic: row[1],
    expert_count: row[2],
    status: row[3],
    created_at: row[4],
    updated_at: row[5],
  }
}

/**
 * 将 SQL 行映射为 Panelist 对象
 */
function mapPanelist(row: any): Panelist {
  return {
    id: row[0],
    discussion_id: row[1],
    role: row[2],
    name: row[3],
    title: row[4],
    stance: row[5],
    color: row[6],
    created_at: row[7],
  }
}

/**
 * 将 SQL 行映射为 Transcript 对象
 */
function mapTranscript(row: any): Transcript {
  return {
    id: row[0],
    discussion_id: row[1],
    panelist_id: row[2],
    content: row[3],
    sequence: row[4],
    round: row[5],
    created_at: row[6],
  }
}

/**
 * 将 SQL 行映射为 Consensus 对象
 */
function mapConsensus(row: any): Consensus {
  return {
    id: row[0],
    discussion_id: row[1],
    content: row[2],
    round: row[3],
    created_at: row[4],
  }
}

/**
 * 将 SQL 行映射为 Conflict 对象
 */
function mapConflict(row: any): Conflict {
  return {
    id: row[0],
    discussion_id: row[1],
    content: row[2],
    round: row[3],
    created_at: row[4],
  }
}

/**
 * 将 SQL 行映射为 Summary 对象
 */
function mapSummary(row: any): Summary {
  return {
    id: row[0],
    discussion_id: row[1],
    content: row[2],
    generated_at: row[3],
  }
}

// ── Public API ──────────────────────────────

/**
 * 获取所有讨论列表（不含 panelists）
 */
export function findAllDiscussions(): Discussion[] {
  const db = getDatabase()
  const result = db.exec(
    `SELECT id, topic, expert_count, status, created_at, updated_at
     FROM discussion
     ORDER BY created_at DESC`
  )
  if (!result.length || !result[0].values.length) return []
  return result[0].values.map(mapDiscussion)
}

/**
 * 获取单个讨论详情（含 panelists）
 */
export function findDiscussionById(id: string): DiscussionDetail | null {
  const db = getDatabase()
  const discResult = db.exec(
    `SELECT id, topic, expert_count, status, created_at, updated_at
     FROM discussion WHERE id = ?`,
    [id]
  )
  if (!discResult.length || !discResult[0].values.length) return null

  const discussion = mapDiscussion(discResult[0].values[0])
  const panelists = findPanelistsByDiscussionId(id)

  return { ...discussion, panelists }
}

/**
 * 获取某讨论的所有嘉宾
 */
export function findPanelistsByDiscussionId(discussionId: string): Panelist[] {
  const db = getDatabase()
  const result = db.exec(
    `SELECT id, discussion_id, role, name, title, stance, color, created_at
     FROM panelist
     WHERE discussion_id = ?
     ORDER BY role DESC, created_at ASC`,
    [discussionId]
  )
  if (!result.length || !result[0].values.length) return []
  return result[0].values.map(mapPanelist)
}

/**
 * 获取某讨论的 transcript（按序号升序）
 */
export function findTranscriptByDiscussionId(discussionId: string): Transcript[] {
  const db = getDatabase()
  const result = db.exec(
    `SELECT id, discussion_id, panelist_id, content, sequence, round, created_at
     FROM transcript
     WHERE discussion_id = ?
     ORDER BY sequence ASC`,
    [discussionId]
  )
  if (!result.length || !result[0].values.length) return []
  return result[0].values.map(mapTranscript)
}

/**
 * 获取某讨论的共识列表
 */
export function findConsensusByDiscussionId(discussionId: string): Consensus[] {
  const db = getDatabase()
  const result = db.exec(
    `SELECT id, discussion_id, content, round, created_at
     FROM consensus
     WHERE discussion_id = ?
     ORDER BY round ASC, created_at ASC`,
    [discussionId]
  )
  if (!result.length || !result[0].values.length) return []
  return result[0].values.map(mapConsensus)
}

/**
 * 获取某讨论的分歧列表
 */
export function findConflictsByDiscussionId(discussionId: string): Conflict[] {
  const db = getDatabase()
  const result = db.exec(
    `SELECT id, discussion_id, content, round, created_at
     FROM conflict
     WHERE discussion_id = ?
     ORDER BY round ASC, created_at ASC`,
    [discussionId]
  )
  if (!result.length || !result[0].values.length) return []
  return result[0].values.map(mapConflict)
}

/**
 * 获取某讨论的总结
 */
export function findSummaryByDiscussionId(discussionId: string): Summary | null {
  const db = getDatabase()
  const result = db.exec(
    `SELECT id, discussion_id, content, generated_at
     FROM summary
     WHERE discussion_id = ?`,
    [discussionId]
  )
  if (!result.length || !result[0].values.length) return null
  return mapSummary(result[0].values[0])
}
