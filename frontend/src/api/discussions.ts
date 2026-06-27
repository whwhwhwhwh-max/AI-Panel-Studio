// ============================================
// AI Panel Studio — Discussions API client
// ============================================

import type { Discussion } from '@/types'

export async function fetchDiscussions(): Promise<Discussion[]> {
  const res = await fetch('/api/v1/discussions')
  if (!res.ok) {
    throw new Error(`Failed to fetch discussions: ${res.status} ${res.statusText}`)
  }
  const body = await res.json()
  return body.discussions as Discussion[]
}
