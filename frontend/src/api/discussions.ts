// ============================================
// AI Panel Studio — Discussions API client
// ============================================

import type {
  Discussion,
  DiscussionDetail,
  GeneratePanelistsResponse,
  CreateDiscussionRequest,
} from '@/types'

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

export async function generatePanelists(
  topic: string,
  expertCount: number
): Promise<GeneratePanelistsResponse> {
  const res = await fetch('/api/v1/panelists/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, expert_count: expertCount }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(
      err?.error?.message ?? `Failed to generate panelists: ${res.status} ${res.statusText}`
    )
  }
  return res.json() as Promise<GeneratePanelistsResponse>
}

export async function createDiscussion(
  req: CreateDiscussionRequest
): Promise<DiscussionDetail> {
  const res = await fetch('/api/v1/discussions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(
      err?.error?.message ?? `Failed to create discussion: ${res.status} ${res.statusText}`
    )
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

export async function startAIDemo(id: string): Promise<{ source: string; eventCount: number }> {
  const res = await fetch(
    `/api/v1/discussions/${encodeURIComponent(id)}/start-ai-demo`,
    { method: 'POST' }
  )
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(
      err?.error?.message ?? `Failed to start AI demo: ${res.status} ${res.statusText}`
    )
  }
  return res.json()
}
