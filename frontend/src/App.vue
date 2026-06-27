<template>
  <HomeView
    v-if="currentView === 'home'"
    @discussion-selected="enterStudio"
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
import StudioView from '@/views/StudioView.vue'

const currentView = ref<'home' | 'studio'>('home')
const selectedDiscussionId = ref<string | null>(null)

function enterStudio(id: string) {
  selectedDiscussionId.value = id
  currentView.value = 'studio'
}

function goHome() {
  currentView.value = 'home'
  selectedDiscussionId.value = null
}
</script>
