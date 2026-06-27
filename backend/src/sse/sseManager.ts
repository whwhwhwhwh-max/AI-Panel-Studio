// ============================================
// AI Panel Studio — SSE Connection Manager
// ============================================
// Manages per-discussion SSE client pools.
// Each client is an Express Response object held open.
// ============================================

import type { Response } from 'express'
import { v4 as uuid } from 'uuid'

// ── Types ────────────────────────────────────

export interface SSEClient {
  id: string
  discussionId: string
  res: Response
  connectedAt: number
}

export interface SSEEvent {
  event: string
  data: unknown
}

// ── Pool ─────────────────────────────────────

/** discussionId → SSEClient[] */
const channels = new Map<string, SSEClient[]>()

// ── Public API ───────────────────────────────

/**
 * Register a new SSE client for a given discussion.
 * Returns the assigned client ID.
 */
export function addClient(discussionId: string, res: Response): string {
  const client: SSEClient = {
    id: uuid(),
    discussionId,
    res,
    connectedAt: Date.now(),
  }

  const existing = channels.get(discussionId)
  if (existing) {
    existing.push(client)
  } else {
    channels.set(discussionId, [client])
  }

  // Remove client on connection close
  res.on('close', () => {
    removeClient(discussionId, client.id)
  })

  return client.id
}

/**
 * Remove a disconnected client from its channel.
 */
export function removeClient(discussionId: string, clientId: string): void {
  const list = channels.get(discussionId)
  if (!list) return

  const idx = list.findIndex((c) => c.id === clientId)
  if (idx !== -1) {
    list.splice(idx, 1)
  }

  // Clean up empty channels
  if (list.length === 0) {
    channels.delete(discussionId)
  }
}

/**
 * Send a single SSE event to one client.
 * Formats the wire protocol: "event: <type>\ndata: <json>\n\n".
 */
export function sendToClient(client: SSEClient, event: SSEEvent): void {
  const { res } = client
  const lines: string[] = []

  if (event.event && event.event !== 'message') {
    lines.push(`event: ${event.event}`)
  }
  lines.push(`data: ${JSON.stringify(event.data)}`)

  // SSE requires double newline to terminate
  res.write(lines.join('\n') + '\n\n')
}

/**
 * Broadcast an SSE event to all clients subscribed to a discussion.
 */
export function broadcast(discussionId: string, event: SSEEvent): void {
  const list = channels.get(discussionId)
  if (!list || list.length === 0) return

  for (const client of list) {
    sendToClient(client, event)
  }
}

/**
 * Return the number of active SSE connections for a discussion.
 */
export function getClientCount(discussionId: string): number {
  return channels.get(discussionId)?.length ?? 0
}
