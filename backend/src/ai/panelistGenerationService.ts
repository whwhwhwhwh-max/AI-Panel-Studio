// ============================================
// AI Panel Studio — Panelist Generation Service
// ============================================
// Orchestrates AI-powered panelist generation with
// automatic fallback to mock when DeepSeek is
// unavailable or returns invalid output.
// ============================================

import type { GeneratedPanelist } from '../types/index.js'
import { isDeepSeekAvailable, chatCompletion } from './deepseekClient.js'
import { generateMockPanelists } from './mockPanelistGenerator.js'

// ── Prompt ───────────────────────────────────

function buildSystemPrompt(): string {
  return [
    '你是一个专业的圆桌讨论策划助手。',
    '根据用户输入的话题和专家人数，你生成一位主持人和指定数量的专家嘉宾。',
    '',
    '要求：',
    '1. 主持人 (moderator)：中立引导者，擅长串联和追问',
    '2. 每位专家 (expert)：有不同的职业背景和鲜明立场',
    '3. 姓名必须是中文，职业和立场必须与话题高度相关',
    '4. 颜色必须是 HEX 色值（如 #4A90D9），不同专家用不同颜色',
    '5. stance 简短有力，1-2 句话',
    '',
    '你必须返回严格的 JSON，格式如下：',
    '{',
    '  "moderator": {',
    '    "role": "moderator",',
    '    "name": "...",',
    '    "title": "...",',
    '    "stance": "...",',
    '    "color": "#..."',
    '  },',
    '  "experts": [',
    '    {',
    '      "role": "expert",',
    '      "name": "...",',
    '      "title": "...",',
    '      "stance": "...",',
    '      "color": "#..."',
    '    }',
    '  ]',
    '}',
    '',
    '只返回 JSON，不要加任何解释、markdown 代码块标记或额外文字。',
  ].join('\n')
}

function buildUserPrompt(topic: string, expertCount: number): string {
  return [
    `话题：${topic}`,
    `专家人数：${expertCount}`,
    '',
    `请生成 1 位主持人和 ${expertCount} 位专家。`,
  ].join('\n')
}

// ── Validation ───────────────────────────────

const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/

function validateGeneratedPanelist(
  p: unknown,
  expectedRole: 'moderator' | 'expert'
): p is GeneratedPanelist {
  if (!p || typeof p !== 'object') return false
  const obj = p as Record<string, unknown>

  if (typeof obj.role !== 'string' || obj.role !== expectedRole) return false
  if (typeof obj.name !== 'string' || obj.name.trim().length === 0) return false
  if (typeof obj.title !== 'string' || obj.title.trim().length === 0) return false
  if (typeof obj.stance !== 'string' || obj.stance.trim().length === 0) return false
  if (typeof obj.color !== 'string' || !HEX_COLOR_RE.test(obj.color)) return false

  return true
}

interface DeepSeekRawOutput {
  moderator?: unknown
  experts?: unknown
}

function validateAndNormalize(
  raw: DeepSeekRawOutput,
  topic: string,
  expertCount: number
): GeneratedPanelist[] | null {
  try {
    // Validate moderator
    if (!validateGeneratedPanelist(raw.moderator, 'moderator')) {
      console.warn('[panelistService] Invalid moderator in AI response, falling back to mock')
      return null
    }

    // Validate experts
    if (!Array.isArray(raw.experts) || raw.experts.length !== expertCount) {
      console.warn(
        `[panelistService] Expected ${expertCount} experts, got ${Array.isArray(raw.experts) ? raw.experts.length : 'non-array'}, falling back to mock`
      )
      return null
    }

    const experts: GeneratedPanelist[] = []
    for (const e of raw.experts) {
      if (!validateGeneratedPanelist(e, 'expert')) {
        console.warn('[panelistService] Invalid expert in AI response, falling back to mock')
        return null
      }
      experts.push({
        role: 'expert',
        name: (e as GeneratedPanelist).name.trim(),
        title: (e as GeneratedPanelist).title.trim(),
        stance: (e as GeneratedPanelist).stance.trim(),
        color: (e as GeneratedPanelist).color,
      })
    }

    const moderator: GeneratedPanelist = {
      role: 'moderator',
      name: (raw.moderator as GeneratedPanelist).name.trim(),
      title: (raw.moderator as GeneratedPanelist).title.trim(),
      stance: (raw.moderator as GeneratedPanelist).stance.trim(),
      color: (raw.moderator as GeneratedPanelist).color,
    }

    return [moderator, ...experts]
  } catch {
    console.warn('[panelistService] Unexpected error during validation, falling back to mock')
    return null
  }
}

// ── Public API ───────────────────────────────

export interface GenerateResult {
  panelists: GeneratedPanelist[]
  source: 'deepseek' | 'mock'
}

/**
 * Generate panelists for a discussion topic.
 *
 * Tries DeepSeek first. Falls back to deterministic mock generation if:
 * - DEEPSEEK_API_KEY is not configured
 * - API call fails (network, auth, rate-limit, etc.)
 * - API returns invalid / malformed JSON
 * - API returns wrong number of panelists
 * - Validation fails for any panelist
 */
export async function generatePanelists(
  topic: string,
  expertCount: number
): Promise<GenerateResult> {
  // Try DeepSeek
  if (isDeepSeekAvailable()) {
    try {
      const response = await chatCompletion({
        model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          { role: 'user', content: buildUserPrompt(topic, expertCount) },
        ],
        temperature: 0.8,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        console.warn('[panelistService] Empty AI response, falling back to mock')
        return { panelists: generateMockPanelists(topic, expertCount), source: 'mock' }
      }

      // Parse JSON — the model may wrap in ```json fences despite instructions
      let parsed: unknown
      try {
        parsed = JSON.parse(content)
      } catch {
        // Try stripping markdown fences
        const cleaned = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
        try {
          parsed = JSON.parse(cleaned)
        } catch {
          console.warn('[panelistService] Failed to parse AI response as JSON, falling back to mock')
          return { panelists: generateMockPanelists(topic, expertCount), source: 'mock' }
        }
      }

      const validated = validateAndNormalize(parsed as DeepSeekRawOutput, topic, expertCount)
      if (validated) {
        console.log(`[panelistService] Successfully generated panelists via DeepSeek for topic: "${topic}"`)
        return { panelists: validated, source: 'deepseek' }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.warn(`[panelistService] DeepSeek API call failed: ${message}`)
      console.warn('[panelistService] Falling back to mock generation')
    }
  } else {
    console.log('[panelistService] DeepSeek not configured, using mock generation')
  }

  // Fallback: mock
  return { panelists: generateMockPanelists(topic, expertCount), source: 'mock' }
}
