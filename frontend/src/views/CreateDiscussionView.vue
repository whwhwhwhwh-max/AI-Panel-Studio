<template>
  <div class="create-discussion">
    <header class="create-header">
      <button class="back-btn" @click="$emit('back')">← 返回</button>
      <h1>发起新讨论</h1>
    </header>

    <main class="create-main">
      <div class="form-group">
        <label class="form-label" for="topic">讨论话题</label>
        <input
          id="topic"
          v-model="topic"
          type="text"
          class="form-input"
          placeholder="输入你想讨论的话题，如：量子计算是否会取代经典计算机？"
          :disabled="submitting"
        />
      </div>

      <div class="form-group">
        <label class="form-label" for="expertCount">
          专家人数：<strong>{{ expertCount }}</strong>
        </label>
        <div class="range-row">
          <span>2</span>
          <input
            id="expertCount"
            v-model.number="expertCount"
            type="range"
            min="2"
            max="6"
            class="form-range"
            :disabled="submitting"
          />
          <span>6</span>
        </div>
      </div>

      <div v-if="error" class="create-error">
        <p>⚠️ {{ error }}</p>
      </div>

      <button
        class="btn-generate"
        :disabled="!canSubmit || submitting"
        @click="handleGenerate"
      >
        <template v-if="submitting">
          <span class="spinner"></span>
          正在生成嘉宾阵容……
        </template>
        <template v-else>
          🎯 生成嘉宾阵容
        </template>
      </button>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { generatePanelists } from '@/api/discussions'
import type { GeneratedPanelist } from '@/types'

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'panelists-generated', topic: string, expertCount: number, panelists: GeneratedPanelist[]): void
}>()

const topic = ref('')
const expertCount = ref(4)
const submitting = ref(false)
const error = ref<string | null>(null)

const canSubmit = computed(() => topic.value.trim().length > 0 && !submitting.value)

async function handleGenerate() {
  error.value = null
  submitting.value = true
  try {
    const result = await generatePanelists(topic.value.trim(), expertCount.value)
    emit('panelists-generated', result.topic, result.expert_count, result.panelists)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '生成失败，请重试'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.create-discussion {
  max-width: 640px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.create-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.create-header h1 {
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

.create-main {
  background: #fff;
  border: 1px solid #e0e4e8;
  border-radius: 12px;
  padding: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: #7f8c8d;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #dce1e6;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  color: #2c3e50;
  transition: border-color 0.15s;
  outline: none;
}

.form-input:focus {
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.15);
}

.form-input:disabled {
  background: #f5f7fa;
  color: #95a5a6;
}

.range-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #7f8c8d;
  font-size: 0.9rem;
}

.form-range {
  flex: 1;
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  border-radius: 3px;
  background: #dce1e6;
  outline: none;
  cursor: pointer;
}

.form-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #3498db;
  cursor: pointer;
  border: none;
}

.form-range:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.create-error {
  background: #fdedec;
  color: #c0392b;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.btn-generate {
  width: 100%;
  padding: 0.85rem 1.5rem;
  border: none;
  border-radius: 10px;
  background: #3498db;
  color: #fff;
  font-size: 1.05rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-generate:hover:not(:disabled) {
  background: #2980b9;
}

.btn-generate:disabled {
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
