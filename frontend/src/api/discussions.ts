// ============================================
// AI Panel Studio — Discussions API client
// ============================================

import type { Discussion, DiscussionDetail } from '@/types'

export async function fetchDiscussions(): Promise<Discussion[]> {
  const res = await fetch('/api/v1/discussions')
  if (!res.ok) {
    throw new Error(`Failed to fetch discussions: ${res.status} ${res.statusText}`)
  }
  const body = await res.json()
  return body.discussions as Discussion[]
}

export async function fetchDiscussionById(id: string): Promise<DiscussionDetail> {
  const res = await fetch(`/api/v1/discussions/${encodeURIComponent(id)}`)
  if (!res.ok) {
    throw new Error(`Failed to fetch discussion: ${res.status} ${res.statusText}`)
  }
  const body = await res.json()
  return body.discussion as DiscussionDetail
}

export async function triggerMockEvents(id: string): Promise<void> {
  const res = await fetch(
    `/api/v1/discussions/${encodeURIComponent(id)}/mock-events`,
    { method: 'POST' }
  )
  if (!res.ok) {
    throw new Error(`Failed to trigger mock events: ${res.status} ${res.statusText}`)
  }
}
