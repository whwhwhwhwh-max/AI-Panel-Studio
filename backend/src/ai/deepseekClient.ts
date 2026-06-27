// ============================================
// AI Panel Studio — DeepSeek API Client
// ============================================
// Minimal chat-completion client for DeepSeek.
// Reads credentials from env vars ONLY (never hardcoded).
// ============================================

// ── Config ───────────────────────────────────

export interface DeepSeekConfig {
  apiKey: string
  baseUrl: string
  model: string
}

let cachedConfig: DeepSeekConfig | null = null

/**
 * Read DeepSeek configuration from environment variables.
 * Returns null if DEEPSEEK_API_KEY is not set.
 */
export function getDeepSeekConfig(): DeepSeekConfig | null {
  if (cachedConfig) return cachedConfig

  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey || apiKey === 'sk-your-api-key-here') {
    return null
  }

  cachedConfig = {
    apiKey,
    baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
    model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
  }
  return cachedConfig
}

/**
 * Returns true if DeepSeek API is configured and available.
 */
export function isDeepSeekAvailable(): boolean {
  return getDeepSeekConfig() !== null
}

// ── Types ────────────────────────────────────

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatCompletionRequest {
  model: string
  messages: ChatMessage[]
  temperature?: number
  max_tokens?: number
  response_format?: { type: 'json_object' }
}

export interface ChatCompletionResponse {
  id: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
}

// ── Client ───────────────────────────────────

/**
 * Send a chat completion request to DeepSeek.
 * Throws on network error or non-2xx response.
 * Never logs the API key.
 */
export async function chatCompletion(
  req: ChatCompletionRequest
): Promise<ChatCompletionResponse> {
  const config = getDeepSeekConfig()
  if (!config) {
    throw new Error('DeepSeek API is not configured. Set DEEPSEEK_API_KEY in .env.')
  }

  const url = `${config.baseUrl}/chat/completions`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(req),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    // Trim the body in case it contains the key by accident (should not happen)
    const preview = body.length > 200 ? body.slice(0, 200) + '...' : body
    throw new Error(
      `DeepSeek API returned ${res.status} ${res.statusText}: ${preview}`
    )
  }

  return res.json() as Promise<ChatCompletionResponse>
}
