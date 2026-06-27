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
