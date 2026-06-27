<template>
  <div class="home">
    <header class="home-header">
      <h1>AI Panel Studio</h1>
      <p class="subtitle">AI 圆桌讨论工作台</p>
    </header>

    <main class="home-main">
      <!-- Action bar -->
      <div class="home-actions">
        <button class="btn-new-discussion" @click="$emit('create-discussion')">
          🎙️ 发起新讨论
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="state-message">
        <p>加载中……</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="state-message error">
        <p>⚠️ {{ error }}</p>
        <button @click="load">重试</button>
      </div>

      <!-- Empty -->
      <div v-else-if="!discussions.length" class="state-message">
        <p>暂无讨论</p>
      </div>

      <!-- Discussion List -->
      <ul v-else class="discussion-list">
        <li
          v-for="d in discussions"
          :key="d.id"
          class="discussion-card"
          @click="handleClick(d)"
        >
          <div class="card-top">
            <h2 class="card-topic">{{ d.topic }}</h2>
            <span :class="['status-badge', statusClass(d.status)]">
              {{ statusLabel(d.status) }}
            </span>
          </div>
          <div class="card-meta">
            <span>👥 {{ d.expert_count }} 位专家</span>
            <span>{{ formatDate(d.created_at) }}</span>
          </div>
        </li>
      </ul>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fetchDiscussions } from '@/api/discussions'
import type { Discussion, DiscussionStatus } from '@/types'

const discussions = ref<Discussion[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    discussions.value = await fetchDiscussions()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Unknown error'
  } finally {
    loading.value = false
  }
}

const emit = defineEmits<{
  (e: 'discussion-selected', id: string): void
  (e: 'create-discussion'): void
}>()

function handleClick(d: Discussion) {
  emit('discussion-selected', d.id)
}

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

function formatDate(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

onMounted(load)
</script>
