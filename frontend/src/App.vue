<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { ZoneId } from './types'
import { suggestionsAt } from './data/mock'
import AppHeader from './components/AppHeader.vue'
import ZonePanel from './components/ZonePanel.vue'
import TimelineBar from './components/TimelineBar.vue'
import CityMap from './components/CityMap.vue'
import PendingApprovals from './components/PendingApprovals.vue'
import SensorHealth from './components/SensorHealth.vue'
import TopDrains from './components/TopDrains.vue'

/* AMA dashboard: layout from docs/design-brief.md §7.1 */
const nowHour = ref(new Date().getHours())
// Optional ?hour=15 in the URL opens the dashboard at that hour (handy for the demo).
const urlHour = Number(new URLSearchParams(location.search).get('hour'))
const hour = ref(Number.isInteger(urlHour) && urlHour >= 0 && urlHour <= 23 && location.search.includes('hour') ? urlHour : nowHour.value)
const zone = ref<ZoneId>('makola')
const live = computed(() => hour.value === nowHour.value)

// "Synced x min ago": the mock data refreshes once a minute while live.
const lastSync = ref(Date.now())
const now = ref(Date.now())
let timer: number | undefined
onMounted(() => {
  timer = window.setInterval(() => {
    now.value = Date.now()
    nowHour.value = new Date().getHours()
    lastSync.value = now.value
  }, 60_000)
})
onBeforeUnmount(() => window.clearInterval(timer))
const minutesSinceSync = computed(() => Math.floor((now.value - lastSync.value) / 60_000))

const suggestions = computed(() => suggestionsAt(hour.value))
</script>

<template>
  <div class="app">
    <AppHeader
      class="area-header"
      :live="live"
      :hour="hour"
      :minutes-since-sync="minutesSinceSync"
      :pending-count="suggestions.length"
    />
    <ZonePanel v-model:zone="zone" class="area-left" :hour="hour" />
    <main class="area-main">
      <TimelineBar v-model="hour" :now-hour="nowHour" />
      <CityMap :hour="hour" :zone="zone" />
    </main>
    <div class="area-bottom">
      <PendingApprovals :items="suggestions" />
      <SensorHealth />
      <TopDrains :hour="hour" />
    </div>
  </div>
</template>

<style scoped>
.app {
  display: grid;
  grid-template-columns: minmax(360px, 420px) 1fr;
  grid-template-areas:
    'header header'
    'left main'
    'bottom bottom';
  gap: var(--s4);
  padding: var(--s4);
  max-width: 1680px;
  margin: 0 auto;
}
.area-header {
  grid-area: header;
}
.area-left {
  grid-area: left;
}
.area-main {
  grid-area: main;
  display: flex;
  flex-direction: column;
  gap: var(--s3);
  min-width: 0;
}
.area-bottom {
  grid-area: bottom;
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr;
  gap: var(--s4);
}

@media (max-width: 1100px) {
  .app {
    grid-template-columns: 1fr;
    grid-template-areas:
      'header'
      'main'
      'left'
      'bottom';
  }
  .area-bottom {
    grid-template-columns: 1fr;
  }
}
</style>
