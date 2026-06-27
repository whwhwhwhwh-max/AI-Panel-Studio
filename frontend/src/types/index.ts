// ============================================
// AI Panel Studio — Frontend Types
// ============================================
// Kept in sync with backend/src/types/index.ts
// ============================================

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

export interface DiscussionDetail extends Discussion {
  panelists: Panelist[]
}

export interface TranscriptItem {
  id: string
  discussion_id: string
  panelist_id: string
  content: string
  sequence: number
  round: number
  created_at: string
}

export interface ConsensusItem {
  id: string
  discussion_id: string
  content: string
  round: number
  created_at: string
}

export interface ConflictItem {
  id: string
  discussion_id: string
  content: string
  round: number
  created_at: string
}

export interface SummaryItem {
  id: string
  discussion_id: string
  content: string
  generated_at: string
}

// ── SSE Event ──────────────────────────────

export interface SSEEvent {
  event?: string
  data: string
}
