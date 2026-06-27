// ============================================
// AI Panel Studio — Panelist Generation Routes
// ============================================
// POST /api/v1/panelists/generate
//   → 返回 1 moderator + N experts (mock，不接 DeepSeek)
// ============================================

import { Router } from 'express'
import type {
  GeneratePanelistsRequest,
  GeneratePanelistsResponse,
  GeneratedPanelist,
} from '../types/index.js'

const router = Router()

// ── 预设嘉宾数据库 ──────────────────────────

interface PresetPersona {
  name: string
  title: string
  stance_templates: string[]
  color: string
}

const EXPERTS: PresetPersona[] = [
  {
    name: '周铭',
    title: '研究员 / 数据科学家',
    stance_templates: [
      '从实证数据来看，${topic}需要更多量化研究支撑',
      '我认为${topic}的关键在于底层机制的深入理解',
    ],
    color: '#4A90D9',
  },
  {
    name: '李雅文',
    title: '高级工程师 / 技术架构师',
    stance_templates: [
      '工程实践表明，${topic}的落地面临比预期更大的挑战',
      '${topic}在技术上是可行的，但必须考虑实际部署的边界条件',
    ],
    color: '#E06C42',
  },
  {
    name: '王峰',
    title: '创业公司 CTO / 行业创新者',
    stance_templates: [
      '${topic}正处于范式转移的关键节点，先行者将获得巨大优势',
      '现有方案在${topic}方面的不足恰恰是创新的最佳切入点',
    ],
    color: '#3CB371',
  },
  {
    name: '赵思远',
    title: '教授 / 学术研究者',
    stance_templates: [
      '从学术视角看，${topic}的理论基础尚需进一步完善',
      '${topic}是一个值得深入研究的领域，但不宜过度简化',
    ],
    color: '#9B59B6',
  },
  {
    name: '郑海',
    title: '哲学 / 社会科学学者',
    stance_templates: [
      '问题不在于${topic}"能不能做"，而在于"为什么做"和"为谁做"',
      '${topic}的讨论需要超越技术层面，进入价值与伦理的维度',
    ],
    color: '#F39C12',
  },
  {
    name: '黄敏君',
    title: '战略顾问 / 行业分析师',
    stance_templates: [
      '从行业趋势判断，${topic}将在未来 3-5 年内重塑竞争格局',
      '${topic}不是简单的技术选择，而是涉及组织架构与文化转型的系统工程',
    ],
    color: '#4A90D9',
  },
  {
    name: '陈星宇',
    title: '独立咨询师 / 自由职业者',
    stance_templates: [
      '我在一线实践中发现，${topic}的真实体验与媒体报道有很大差距',
      '${topic}的成败取决于执行细节，而非宏大叙事',
    ],
    color: '#3CB371',
  },
  {
    name: '丁洁',
    title: '心理学博士 / 行为研究者',
    stance_templates: [
      '从人类行为的角度看，${topic}需要充分考虑认知偏差和适应成本',
      '${topic}不应陷入二元对立，需要从人的真实需求出发',
    ],
    color: '#9B59B6',
  },
  {
    name: '孙若兰',
    title: '伦理学者 / 政策研究员',
    stance_templates: [
      '${topic}在快速发展中不应忽视对弱势群体的影响',
      '我们需要为${topic}建立底线思维和护栏机制',
    ],
    color: '#E06C42',
  },
  {
    name: '马腾',
    title: '连续创业者 / 天使投资人',
    stance_templates: [
      '市场已经对${topic}做出了选择，后来者需要找到差异化路径',
      '${topic}的真正机会不在表面，而在被忽视的细分领域',
    ],
    color: '#3CB371',
  },
]

const MODERATORS: PresetPersona[] = [
  {
    name: '陈文远',
    title: '资深媒体主编 / 科技记者',
    stance_templates: ['中立引导者，擅长在争议中引导理性对话'],
    color: '#708090',
  },
  {
    name: '方可欣',
    title: '财经主持人 / 专栏作家',
    stance_templates: ['中立但不回避尖锐问题，平衡理性辩论与公众关切'],
    color: '#708090',
  },
  {
    name: '徐曼',
    title: '商业主持人 / 组织行为学硕士',
    stance_templates: ['中立引导，关注数据与个体体验的平衡'],
    color: '#708090',
  },
  {
    name: '吴若曦',
    title: '媒体创始人 / 深度报道记者',
    stance_templates: ['中立引导，关注本质问题与技术伦理'],
    color: '#708090',
  },
]

// ── Helpers ─────────────────────────────────

/**
 * Simple topic hash to seed variation — avoid fully deterministic output
 * while staying pure mock (no LLM call).
 */
function topicHash(topic: string): number {
  let h = 0
  for (let i = 0; i < topic.length; i++) {
    h = ((h << 5) - h + topic.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

function pickDeterministic<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length]
}

/**
 * Generate a stance by substituting ${topic} into a template.
 */
function fillStance(template: string, topic: string): string {
  return template.replace(/\$\{topic\}/g, topic)
}

// ── Route ───────────────────────────────────

router.post('/generate', (req, res) => {
  const { topic, expert_count } = req.body as GeneratePanelistsRequest

  // 参数校验
  if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
    return res.status(400).json({
      error: { code: 'INVALID_INPUT', message: 'topic is required and must be a non-empty string' },
    })
  }
  if (
    typeof expert_count !== 'number' ||
    !Number.isInteger(expert_count) ||
    expert_count < 2 ||
    expert_count > 6
  ) {
    return res.status(400).json({
      error: {
        code: 'INVALID_INPUT',
        message: 'expert_count must be an integer between 2 and 6',
      },
    })
  }

  const seed = topicHash(topic.trim())
  const panelists: GeneratedPanelist[] = []

  // 1. 选 moderator（按 topic hash 变化）
  const moderator = pickDeterministic(MODERATORS, seed)
  panelists.push({
    role: 'moderator',
    name: moderator.name,
    title: moderator.title,
    stance: moderator.stance_templates[0],
    color: moderator.color,
  })

  // 2. 选 N 个 experts（从 preset 池中按确定性方式选取，保证相同 topic 返回相同结果）
  //   用 seed + 位置作为偏移量，使同一 topic 始终选同一组专家
  const shuffled = [...EXPERTS]
  // Fisher-Yates deterministic shuffle
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = (seed * (i + 1) * 7) % (i + 1)
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  const chosen = shuffled.slice(0, expert_count)
  for (let i = 0; i < chosen.length; i++) {
    const expert = chosen[i]
    const stanceIdx = (seed + i) % expert.stance_templates.length
    panelists.push({
      role: 'expert',
      name: expert.name,
      title: expert.title,
      stance: fillStance(expert.stance_templates[stanceIdx], topic.trim()),
      color: expert.color,
    })
  }

  const response: GeneratePanelistsResponse = {
    topic: topic.trim(),
    expert_count,
    panelists,
  }

  res.json(response)
})

export default router
