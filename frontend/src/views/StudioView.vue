<template>
  <div class="studio">
    <!-- Top bar -->
    <header class="studio-top">
      <button class="back-btn" @click="$emit('back')">← 返回</button>
      <div class="top-info">
        <h1 class="studio-topic">{{ discussion?.topic ?? '加载中……' }}</h1>
        <span v-if="discussion" :class="['status-badge', statusClass(discussion.status)]">
          {{ statusLabel(discussion.status) }}
        </span>
      </div>
    </header>

    <div v-if="loading" class="state-message"><p>加载中……</p></div>
    <div v-else-if="error" class="state-message error"><p>⚠️ {{ error }}</p></div>

    <template v-else-if="discussion">
      <!-- Main grid -->
      <div class="studio-grid">
        <!-- Panelists -->
        <aside class="panelists-pane">
          <h2 class="pane-title">👥 嘉宾阵容</h2>
          <ul class="panelist-list">
            <li
              v-for="p in discussion.panelists"
              :key="p.id"
              class="panelist-card"
              :style="{ borderLeftColor: p.color }"
            >
              <div class="p-name">
                <span class="p-color-dot" :style="{ background: p.color }"></span>
                {{ p.name }}
                <span class="p-role-tag">{{ p.role === 'moderator' ? '主持人' : '专家' }}</span>
              </div>
              <div class="p-title">{{ p.title }}</div>
              <div class="p-stance">{{ p.stance }}</div>
            </li>
          </ul>
        </aside>

        <!-- Transcript -->
        <section class="transcript-pane">
          <h2 class="pane-title">📜 讨论记录</h2>
          <div class="transcript-body" ref="transcriptEl">
            <div v-if="!transcript.length" class="transcript-empty">
              <p v-if="!discussionStarted">讨论尚未开始</p>
              <p v-else>等待发言……</p>
            </div>
            <div
              v-for="t in transcript"
              :key="t.id ?? t.sequence"
              class="transcript-entry"
            >
              <div class="t-meta">
                <span class="t-name" :style="{ color: t.color }">{{ t.name }}</span>
                <span class="t-title-label">{{ t.title }}</span>
                <span class="t-seq">R{{ t.round }} #{{ t.sequence }}</span>
              </div>
              <p class="t-content">{{ t.content }}</p>
            </div>
          </div>
        </section>

        <!-- Consensus / Conflicts -->
        <aside class="insights-pane">
          <h2 class="pane-title">🤝 共识</h2>
          <ul class="insight-list">
            <li v-if="!consensus.length" class="insight-empty">暂无共识</li>
            <li v-for="c in consensus" :key="c.id" class="insight-item consensus-item">
              {{ c.content }}
            </li>
          </ul>

          <h2 class="pane-title" style="margin-top: 1.25rem">⚡ 分歧</h2>
          <ul class="insight-list">
            <li v-if="!conflicts.length" class="insight-empty">暂无分歧</li>
            <li v-for="c in conflicts" :key="c.id" class="insight-item conflict-item">
              {{ c.content }}
            </li>
          </ul>
        </aside>
      </div>

      <!-- Action bar -->
      <div class="studio-actions">
        <button
          v-if="!discussionStarted"
          class="btn-simulate btn-ai"
          @click="startAIDiscussion"
          :disabled="simulating"
        >
          {{ simulating ? 'AI 讨论进行中……' : '🤖 启动 AI 讨论' }}
        </button>
        <button
          v-if="!discussionStarted"
          class="btn-simulate"
          @click="startSimulation"
          :disabled="simulating"
        >
          {{ simulating ? '模拟进行中……' : '🎬 启动 Mock 讨论' }}
        </button>
        <div v-if="discussionFinished" class="finished-notice">
          ✅ 讨论已结束
        </div>
        <span class="sse-indicator" :class="{ connected: sseConnected }">
          SSE: {{ sseConnected ? '已连接' : '未连接' }}
        </span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { fetchDiscussionById, triggerMockEvents, startAIDemo } from '@/api/discussions'
import type { DiscussionDetail, DiscussionStatus } from '@/types'

const props = defineProps<{ discussionId: string }>()
const emit = defineEmits<{ (e: 'back'): void }>()

const discussion = ref<DiscussionDetail | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

// SSE state
const sseConnected = ref(false)
const discussionStarted = ref(false)
const discussionFinished = ref(false)
const simulating = ref(false)
const transcript = ref<any[]>([])
const consensus = ref<any[]>([])
const conflicts = ref<any[]>([])
const transcriptEl = ref<HTMLElement | null>(null)

let eventSource: EventSource | null = null

// ── Data loading ────────────────────────────

async function load() {
  loading.value = true
  error.value = null
  try {
    discussion.value = await fetchDiscussionById(props.discussionId)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Unknown error'
  } finally {
    loading.value = false
  }
}

// ── SSE ──────────────────────────────────────

function connectSSE() {
  const url = `/api/v1/discussions/${encodeURIComponent(props.discussionId)}/events`
  eventSource = new EventSource(url)

  eventSource.addEventListener('connected', () => {
    sseConnected.value = true
  })

  eventSource.addEventListener('discussion_started', (e) => {
    discussionStarted.value = true
    const data = JSON.parse(e.data)
    // Optionally update moderator info
    console.log('discussion_started', data)
  })

  eventSource.addEventListener('speaker_status', () => {
    // Status updates are transient; we don't persist them
  })

  eventSource.addEventListener('transcript_delta', (e) => {
    const data = JSON.parse(e.data)
    transcript.value.push({
      id: data.id ?? `t-${data.sequence}`,
      name: data.name,
      title: data.title,
      color: data.panelist_id ? getColorForPanelist(data.panelist_id) : '#7f8c8d',
      content: data.content,
      sequence: data.sequence,
      round: data.round,
    })
    nextTick(() => {
      if (transcriptEl.value) {
        transcriptEl.value.scrollTop = transcriptEl.value.scrollHeight
      }
    })
  })

  eventSource.addEventListener('consensus_updated', (e) => {
    const data = JSON.parse(e.data)
    if (data.items) {
      for (const item of data.items) {
        consensus.value.push(item)
      }
    }
  })

  eventSource.addEventListener('discussion_finished', (e) => {
    discussionFinished.value = true
    simulating.value = false
    console.log('discussion_finished', JSON.parse(e.data))
  })

  eventSource.addEventListener('heartbeat', () => {
    // Keep-alive — no action needed
  })

  eventSource.onerror = () => {
    sseConnected.value = false
  }
}

function getColorForPanelist(panelistId: string): string {
  if (!discussion.value) return '#7f8c8d'
  const p = discussion.value.panelists.find((x) => x.id === panelistId)
  return p?.color ?? '#7f8c8d'
}

// ── Actions ──────────────────────────────────

async function startAIDiscussion() {
  simulating.value = true
  try {
    await startAIDemo(props.discussionId)
  } catch (e) {
    console.error('Failed to start AI discussion', e)
    simulating.value = false
  }
}

async function startSimulation() {
  simulating.value = true
  try {
    await triggerMockEvents(props.discussionId)
  } catch (e) {
    console.error('Failed to trigger mock events', e)
    simulating.value = false
  }
}

// ── Lifecycle ────────────────────────────────

onMounted(() => {
  load()
  connectSSE()
})

onUnmounted(() => {
  eventSource?.close()
})

// ── Helpers ──────────────────────────────────

function statusLabel(s: DiscussionStatus): string {
  const map: Record<DiscussionStatus, string> = {
    created: '待生成',
    generating: '生成中',
    ready: '待开始',
    running: '进行中',
    finished: '已结束',
    failed: '异常',
  }
  return map[s] ?? s
}

function statusClass(s: DiscussionStatus): string {
  return `status-${s}`
}
</script>
