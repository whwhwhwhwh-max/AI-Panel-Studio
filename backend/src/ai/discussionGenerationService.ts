// ============================================
// AI Panel Studio — Discussion Generation Service
// ============================================
// Generates a complete discussion demo (3-5 speeches
// + consensus). Tries DeepSeek first; falls back to
// deterministic mock if unavailable or invalid.
// ============================================

import type { DiscussionDetail, Panelist } from '../types/index.js'
import { isDeepSeekAvailable, chatCompletion } from './deepseekClient.js'

// ── Types ────────────────────────────────────

export interface SpeechEvent {
  type: 'transcript_delta'
  panelist_id: string
  name: string
  title: string
  color: string
  content: string
  sequence: number
  round: number
}

export interface StatusEvent {
  type: 'speaker_status'
  panelist_id: string
  name: string
  status: 'speaking'
  public_thought: string
}

export interface ConsensusEvent {
  type: 'consensus_updated'
  items: Array<{ id: string; content: string; round: number }>
}

export interface FinishEvent {
  type: 'discussion_finished'
  discussion_id: string
  total_rounds: number
  total_speeches: number
}

export type DemoEvent = SpeechEvent | StatusEvent | ConsensusEvent | FinishEvent

export interface DemoResult {
  events: DemoEvent[]
  source: 'deepseek' | 'mock'
}

// ── Mock Generation ──────────────────────────

/**
 * Generate mock discussion events based on the topic and panelists.
 * Content varies by topic (via hash), speaker names from panelists.
 */
function generateMockDiscussion(
  discussion: DiscussionDetail,
  panelists: Panelist[]
): DemoResult {
  const moderator = panelists.find((p) => p.role === 'moderator')!
  const experts = panelists.filter((p) => p.role === 'expert')
  const topic = discussion.topic

  // Topic-aware mock snippets
  const seed = Math.abs(
    topic.split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0)
  )

  const openings = [
    `感谢各位专家今天的参与。我们今天要讨论的话题是："${topic}"。这是一个非常有深度的问题，期待听到各位从不同角度的见解。`,
    `欢迎来到今天的圆桌讨论。我们今天聚焦的主题是："${topic}"。在座的各位都是相关领域的专家，希望我们能展开一场有深度的对话。`,
    `今天很高兴邀请到各位专家一起来探讨"${topic}"这个话题。这是一个既复杂又重要的问题，让我们从多个维度来剖析。`,
  ]

  const opinionTemplates = [
    `关于"${topic}"，我从自己的专业领域来看，核心问题在于我们如何平衡创新与风险。`,
    `对于"${topic}"这个话题，我认为不能简单地二元化思考。实际情况远比表面复杂。`,
    `${topic}确实是一个值得深入探讨的问题。我想从数据的角度来补充一些被忽视的事实。`,
    `我不同意上一个观点。"${topic}"的关键不在于技术本身，而在于我们如何使用它。`,
    `${topic}让我想到一个经常被忽视的角度：我们是否问对了问题？`,
    `从实践经验来看，"${topic}"面临的真正挑战不是理论层面的，而是落地执行。`,
    `我想反驳一下前面的看法。如果说"${topic}"有什么确定的东西，那就是不确定性本身。`,
    `补充一点：${topic}的讨论往往忽略了底层的基础设施问题，这才是真正的瓶颈。`,
  ]

  const consensusTemplates = [
    '各方一致认可该议题在当前阶段的重要性',
    `大家同意"${topic}"需要多方协作才能推进`,
    '与会专家普遍认为问题比预期更复杂，不宜急于求成',
    '所有嘉宾都认同需要更多的实证数据来支撑观点',
  ]

  const events: DemoEvent[] = []
  let seq = 1

  // 1. Speaker status: moderator preparing
  events.push({
    type: 'speaker_status',
    panelist_id: moderator.id,
    name: moderator.name,
    status: 'speaking',
    public_thought: '正在组织开场引导……',
  })

  // 2. Moderator opening speech
  events.push({
    type: 'transcript_delta',
    panelist_id: moderator.id,
    name: moderator.name,
    title: moderator.title,
    color: moderator.color,
    content: openings[seed % openings.length],
    sequence: seq++,
    round: 1,
  })

  // 3. Expert speeches (3-5)
  const speechCount = 3 + (seed % 3) // 3, 4, or 5
  for (let i = 0; i < speechCount; i++) {
    const expert = experts[(seed + i) % experts.length]
    const thoughtTemplates = [
      '正在整理观点……',
      '正在准备发言内容……',
      '正在回应对手观点……',
      '正在补充论据……',
    ]

    events.push({
      type: 'speaker_status',
      panelist_id: expert.id,
      name: expert.name,
      status: 'speaking',
      public_thought: thoughtTemplates[(seed + i) % thoughtTemplates.length],
    })

    events.push({
      type: 'transcript_delta',
      panelist_id: expert.id,
      name: expert.name,
      title: expert.title,
      color: expert.color,
      content: opinionTemplates[(seed + i) % opinionTemplates.length],
      sequence: seq++,
      round: 1,
    })
  }

  // 4. Consensus (1-2 items)
  const consensusCount = 1 + (seed % 2) // 1 or 2
  const items = []
  for (let i = 0; i < consensusCount; i++) {
    items.push({
      id: `consensus-${Date.now()}-${i}`,
      content: consensusTemplates[(seed + i) % consensusTemplates.length],
      round: 1,
    })
  }
  events.push({ type: 'consensus_updated', items })

  // 5. Finish
  events.push({
    type: 'discussion_finished',
    discussion_id: discussion.id,
    total_rounds: 1,
    total_speeches: seq - 1,
  })

  return { events, source: 'mock' }
}

// ── DeepSeek Prompt ──────────────────────────

function buildDiscussionSystemPrompt(
  discussion: DiscussionDetail,
  panelists: Panelist[]
): string {
  const moderator = panelists.find((p) => p.role === 'moderator')!
  const experts = panelists.filter((p) => p.role === 'expert')

  const panelistLines = [
    `- 主持人: ${moderator.name} (${moderator.title})，立场: ${moderator.stance}`,
  ]
  for (const e of experts) {
    panelistLines.push(`- 专家: ${e.name} (${e.title})，立场: ${e.stance}，标识色: ${e.color}`)
  }

  return [
    '你是一个专业的圆桌讨论导演。根据给定的话题和嘉宾阵容，生成一场精彩的圆桌讨论。',
    '',
    '规则：',
    '1. 主持人负责开场引导（1条发言）',
    '2. 专家发言3-5条，可以表达观点、补充或反驳',
    `3. 发言人必须是以下嘉宾中的一位（用 panelist_id 标识）：`,
    ...panelistLines,
    '4. 每位专家发言控制在1-2句，简洁有力',
    '5. 立场鲜明，允许反驳和碰撞',
    '6. 同时提炼1-2条共识',
    '',
    '返回严格的 JSON 格式：',
    '{',
    '  "speeches": [',
    '    {',
    '      "panelist_id": "发言人的 id（见上）",',
    '      "content": "发言内容 (1-2 句)",',
    '      "round": 1',
    '    }',
    '  ],',
    '  "consensus": [',
    '    { "content": "共识内容" }',
    '  ]',
    '}',
    '',
    `话题：${discussion.topic}`,
    `speeches 数量要求：4-6 条（含主持人开场）`,
    '只返回 JSON，不要任何额外文字。',
  ].join('\n')
}

interface DeepSeekDiscussionOutput {
  speeches?: Array<{
    panelist_id?: string
    content?: string
    round?: number
  }>
  consensus?: Array<{ content?: string }>
}

// ── Validation ───────────────────────────────

function validateDiscussionOutput(
  raw: DeepSeekDiscussionOutput,
  panelists: Panelist[]
): { speeches: Array<{ panelist: Panelist; content: string; round: number }>; consensus: string[] } | null {
  if (!raw || typeof raw !== 'object') return null
  if (!Array.isArray(raw.speeches) || raw.speeches.length < 2) return null

  const panelistMap = new Map(panelists.map((p) => [p.id, p]))
  const speeches: Array<{ panelist: Panelist; content: string; round: number }> = []

  for (const s of raw.speeches) {
    if (typeof s.panelist_id !== 'string' || typeof s.content !== 'string') return null
    const p = panelistMap.get(s.panelist_id)
    if (!p) return null
    if (s.content.trim().length === 0) return null
    speeches.push({ panelist: p, content: s.content.trim(), round: s.round ?? 1 })
  }

  const consensus: string[] = []
  if (Array.isArray(raw.consensus)) {
    for (const c of raw.consensus) {
      if (typeof c.content === 'string' && c.content.trim().length > 0) {
        consensus.push(c.content.trim())
      }
    }
  }

  return { speeches, consensus }
}

function buildEventsFromSpeeches(
  discussion: DiscussionDetail,
  speeches: Array<{ panelist: Panelist; content: string; round: number }>,
  consensusItems: string[]
): DemoEvent[] {
  const events: DemoEvent[] = []

  for (let i = 0; i < speeches.length; i++) {
    const s = speeches[i]
    events.push({
      type: 'speaker_status',
      panelist_id: s.panelist.id,
      name: s.panelist.name,
      status: 'speaking',
      public_thought: '正在发言……',
    })
    events.push({
      type: 'transcript_delta',
      panelist_id: s.panelist.id,
      name: s.panelist.name,
      title: s.panelist.title,
      color: s.panelist.color,
      content: s.content,
      sequence: i + 1,
      round: s.round,
    })
  }

  if (consensusItems.length > 0) {
    events.push({
      type: 'consensus_updated',
      items: consensusItems.map((content, i) => ({
        id: `consensus-${Date.now()}-${i}`,
        content,
        round: 1,
      })),
    })
  }

  events.push({
    type: 'discussion_finished',
    discussion_id: discussion.id,
    total_rounds: 1,
    total_speeches: speeches.length,
  })

  return events
}

// ── Public API ───────────────────────────────

/**
 * Generate a discussion demo.
 *
 * Tries DeepSeek first; falls back to mock if anything fails.
 */
export async function generateDiscussionDemo(
  discussion: DiscussionDetail,
  panelists: Panelist[]
): Promise<DemoResult> {
  if (isDeepSeekAvailable()) {
    try {
      const response = await chatCompletion({
        model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: buildDiscussionSystemPrompt(discussion, panelists),
          },
          {
            role: 'user',
            content: `请生成关于"${discussion.topic}"的讨论内容。speeches 4-6 条，consensus 1-2 条。只返回 JSON。`,
          },
        ],
        temperature: 0.85,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        console.warn('[discussionService] Empty AI response, falling back to mock')
        return generateMockDiscussion(discussion, panelists)
      }

      // Parse JSON (strip possible markdown fences)
      let parsed: DeepSeekDiscussionOutput
      try {
        parsed = JSON.parse(content)
      } catch {
        const cleaned = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
        try {
          parsed = JSON.parse(cleaned)
        } catch {
          console.warn('[discussionService] Failed to parse AI response, falling back to mock')
          return generateMockDiscussion(discussion, panelists)
        }
      }

      const validated = validateDiscussionOutput(parsed, panelists)
      if (validated) {
        console.log(
          `[discussionService] Successfully generated ${validated.speeches.length} speeches via DeepSeek`
        )
        return {
          events: buildEventsFromSpeeches(discussion, validated.speeches, validated.consensus),
          source: 'deepseek',
        }
      }

      console.warn('[discussionService] Validation failed on AI output, falling back to mock')
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.warn(`[discussionService] DeepSeek API call failed: ${message}`)
      console.warn('[discussionService] Falling back to mock')
    }
  } else {
    console.log('[discussionService] DeepSeek not configured, using mock discussion')
  }

  return generateMockDiscussion(discussion, panelists)
}
