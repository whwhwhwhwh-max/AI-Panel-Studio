// ============================================
// AI Panel Studio — 共享类型定义
// ============================================
// 字段与 database/init.sql 严格一致
// ============================================

// ── Discussion ──────────────────────────────

export type DiscussionStatus =
  | 'created'
  | 'generating'
  | 'ready'
  | 'running'
  | 'finished'
  | 'failed'

export interface Discussion {
  id: string
  topic: string
  expert_count: number
  status: DiscussionStatus
  created_at: string
  updated_at: string
}

// ── Panelist ────────────────────────────────

export type PanelistRole = 'moderator' | 'expert'

export interface Panelist {
  id: string
  discussion_id: string
  role: PanelistRole
  name: string
  title: string
  stance: string
  color: string
  created_at: string
}

// ── Transcript ──────────────────────────────

export interface Transcript {
  id: string
  discussion_id: string
  panelist_id: string
  content: string
  sequence: number
  round: number
  created_at: string
}

// ── Discussion Event (混合持久化) ──────────

export type EventType =
  | 'discussion_started'
  | 'speech_delivered'
  | 'consensus_updated'
  | 'conflict_updated'
  | 'round_ended'
  | 'summary_generated'
  | 'discussion_completed'

export interface DiscussionEvent {
  id: string
  discussion_id: string
  event_type: EventType
  payload: string // JSON 字符串
  sequence: number
  persisted: number // 0 | 1
  created_at: string
}

// ── Consensus ───────────────────────────────

export interface Consensus {
  id: string
  discussion_id: string
  content: string
  round: number
  created_at: string
}

// ── Conflict ────────────────────────────────

export interface Conflict {
  id: string
  discussion_id: string
  content: string
  round: number
  created_at: string
}

// ── Summary ─────────────────────────────────

export interface Summary {
  id: string
  discussion_id: string
  content: string
  generated_at: string
}

// ── API Response helpers ────────────────────

export interface DiscussionDetail extends Discussion {
  panelists: Panelist[]
}

export interface ApiError {
  error: {
    code: string
    message: string
  }
}
