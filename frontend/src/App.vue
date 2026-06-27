<template>
  <HomeView
    v-if="currentView === 'home'"
    @discussion-selected="enterStudio"
    @create-discussion="goCreate"
  />
  <CreateDiscussionView
    v-else-if="currentView === 'create'"
    @back="goHome"
    @panelists-generated="goConfirm"
  />
  <PanelistConfirmView
    v-else-if="currentView === 'confirm'"
    :topic="pendingTopic"
    :expert-count="pendingExpertCount"
    :panelists="pendingPanelists"
    @back="goCreate"
    @entered-studio="enterStudio"
  />
  <StudioView
    v-else
    :discussion-id="selectedDiscussionId!"
    @back="goHome"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import HomeView from '@/views/HomeView.vue'
import CreateDiscussionView from '@/views/CreateDiscussionView.vue'
import PanelistConfirmView from '@/views/PanelistConfirmView.vue'
import StudioView from '@/views/StudioView.vue'
import type { GeneratedPanelist } from '@/types'

const currentView = ref<'home' | 'create' | 'confirm' | 'studio'>('home')
const selectedDiscussionId = ref<string | null>(null)
const pendingTopic = ref('')
const pendingExpertCount = ref(4)
const pendingPanelists = ref<GeneratedPanelist[]>([])

function goHome() {
  currentView.value = 'home'
  selectedDiscussionId.value = null
}

function goCreate() {
  currentView.value = 'create'
}

function goConfirm(topic: string, expertCount: number, panelists: GeneratedPanelist[]) {
  pendingTopic.value = topic
  pendingExpertCount.value = expertCount
  pendingPanelists.value = panelists
  currentView.value = 'confirm'
}

function enterStudio(id: string) {
  selectedDiscussionId.value = id
  currentView.value = 'studio'
}
</script>
