<template>
  <div class="panelist-confirm">
    <header class="confirm-header">
      <button class="back-btn" @click="$emit('back')">← 返回修改</button>
      <h1>确认嘉宾阵容</h1>
    </header>

    <main class="confirm-main">
      <!-- Topic summary -->
      <div class="topic-summary">
        <span class="topic-label">讨论话题</span>
        <h2 class="topic-text">{{ topic }}</h2>
        <span class="topic-meta">{{ panelists.length - 1 }} 位专家 + 1 位主持人</span>
      </div>

      <!-- Panelist grid -->
      <div class="panelist-grid">
        <div
          v-for="p in panelists"
          :key="p.name"
          class="panelist-card"
          :class="{ 'is-moderator': p.role === 'moderator' }"
          :style="{ borderTopColor: p.color }"
        >
          <div class="p-role-badge">
            {{ p.role === 'moderator' ? '🎤 主持人' : '👤 专家' }}
          </div>
          <div class="p-name">
            <span class="p-color-dot" :style="{ background: p.color }"></span>
            {{ p.name }}
          </div>
          <div class="p-title">{{ p.title }}</div>
          <div class="p-stance">{{ p.stance }}</div>
        </div>
      </div>

      <!-- Actions -->
      <div v-if="error" class="confirm-error">
        <p>⚠️ {{ error }}</p>
      </div>

      <div class="confirm-actions">
        <button class="btn-cancel" @click="$emit('back')" :disabled="submitting">
          返回修改
        </button>
        <button
          class="btn-enter"
          :disabled="submitting"
          @click="handleEnter"
        >
          <template v-if="submitting">
            <span class="spinner"></span>
            正在创建……
          </template>
          <template v-else>
            🎬 确认进入演播厅
          </template>
        </button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { createDiscussion } from '@/api/discussions'
import type { GeneratedPanelist } from '@/types'

const props = defineProps<{
  topic: string
  expertCount: number
  panelists: GeneratedPanelist[]
}>()

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'entered-studio', discussionId: string): void
}>()

const submitting = ref(false)
const error = ref<string | null>(null)

async function handleEnter() {
  error.value = null
  submitting.value = true
  try {
    const discussion = await createDiscussion({
      topic: props.topic,
      expert_count: props.expertCount,
      panelists: props.panelists.map((p) => ({
        name: p.name,
        title: p.title,
        stance: p.stance,
        color: p.color,
        role: p.role,
      })),
    })
    emit('entered-studio', discussion.id)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '创建讨论失败，请重试'
    submitting.value = false
  }
}
</script>

<style scoped>
.panelist-confirm {
  max-width: 860px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.confirm-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.confirm-header h1 {
  font-size: 1.5rem;
  font-weight: 700;
}

.back-btn {
  flex-shrink: 0;
  padding: 0.35rem 1rem;
  border: 1px solid #bdc3c7;
  border-radius: 6px;
  background: #fff;
  color: #2c3e50;
  font-size: 0.9rem;
  cursor: pointer;
}

.back-btn:hover {
  background: #ecf0f1;
}

.confirm-main {
  background: #fff;
  border: 1px solid #e0e4e8;
  border-radius: 12px;
  padding: 2rem;
}

.topic-summary {
  text-align: center;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e0e4e8;
  margin-bottom: 1.5rem;
}

.topic-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #95a5a6;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.topic-text {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0.5rem 0;
  color: #2c3e50;
  line-height: 1.4;
}

.topic-meta {
  font-size: 0.85rem;
  color: #7f8c8d;
}

.panelist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.panelist-card {
  border: 1px solid #e0e4e8;
  border-top: 3px solid;
  border-radius: 10px;
  padding: 1rem;
  background: #fafbfc;
  transition: box-shadow 0.15s;
}

.panelist-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.panelist-card.is-moderator {
  background: #fefdf8;
  border-color: #e8e4d0;
}

.p-role-badge {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  color: #95a5a6;
  margin-bottom: 0.5rem;
}

.p-name {
  font-weight: 600;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.3rem;
}

.p-color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.p-title {
  font-size: 0.8rem;
  color: #7f8c8d;
  margin-bottom: 0.4rem;
}

.p-stance {
  font-size: 0.8rem;
  color: #95a5a6;
  font-style: italic;
  line-height: 1.4;
}

.confirm-error {
  background: #fdedec;
  color: #c0392b;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  text-align: center;
}

.confirm-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.btn-cancel {
  padding: 0.75rem 1.5rem;
  border: 1px solid #bdc3c7;
  border-radius: 8px;
  background: #fff;
  color: #7f8c8d;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-cancel:hover:not(:disabled) {
  background: #ecf0f1;
}

.btn-cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-enter {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 8px;
  background: #27ae60;
  color: #fff;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-enter:hover:not(:disabled) {
  background: #219a52;
}

.btn-enter:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
