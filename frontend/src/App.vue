<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { Role, ZoneId } from './types'
import { SENSORS, isLowBattery, isOffline, suggestionsAt } from './data/mock'
import AppHeader from './components/AppHeader.vue'
import ZonePanel from './components/ZonePanel.vue'
import TimelineBar from './components/TimelineBar.vue'
import CityMap from './components/CityMap.vue'
import PendingApprovals from './components/PendingApprovals.vue'
import FloodAlerts from './components/FloodAlerts.vue'
import SensorHealth from './components/SensorHealth.vue'
import TopDrains from './components/TopDrains.vue'
import ReviewScreen from './components/review/ReviewScreen.vue'
import PhoneShell from './components/phone/PhoneShell.vue'
import CollectorApp from './components/phone/CollectorApp.vue'
import CitizenApp from './components/phone/CitizenApp.vue'
import AdminView from './components/admin/AdminView.vue'
import { isDecided, nadmoAlerts } from './stores/approvals'

/* ---------- Time (shared by every role) ---------- */
const nowHour = ref(new Date().getHours())
// Optional ?hour=15 in the URL opens the app at that hour (handy for the demo).
const urlHour = Number(new URLSearchParams(location.search).get('hour'))
const hour = ref(Number.isInteger(urlHour) && urlHour >= 0 && urlHour <= 23 && location.search.includes('hour') ? urlHour : nowHour.value)
const live = computed(() => hour.value === nowHour.value)

// "Synced x min ago": the mock data refreshes once a minute while live.
const lastSync = ref(Date.now())
const now = ref(Date.now())
let timer: number | undefined
onMounted(() => {
  timer = window.setInterval(() => {
    const wasLive = live.value
    now.value = Date.now()
    nowHour.value = new Date().getHours()
    if (wasLive) hour.value = nowHour.value // stay live when the hour changes
    lastSync.value = now.value
  }, 60_000)
})
onBeforeUnmount(() => window.clearInterval(timer))
const minutesSinceSync = computed(() => Math.floor((now.value - lastSync.value) / 60_000))

/* ---------- Page switch from the address (#/nadmo, #/review/<id>, ...) ---------- */
const hash = ref(location.hash)
const onHash = () => {
  hash.value = location.hash
  window.scrollTo(0, 0)
}
onMounted(() => window.addEventListener('hashchange', onHash))
onBeforeUnmount(() => window.removeEventListener('hashchange', onHash))

const role = computed<Role>(() => {
  if (hash.value.startsWith('#/nadmo')) return 'nadmo'
  if (hash.value.startsWith('#/collector')) return 'collector'
  if (hash.value.startsWith('#/citizen')) return 'citizen'
  if (hash.value.startsWith('#/admin')) return 'admin'
  return 'ama'
})
const reviewId = computed(() => hash.value.match(/^#\/review\/(.+)$/)?.[1])

/* ---------- AMA and NADMO data ---------- */
const zone = ref<ZoneId>('makola')
const suggestions = computed(() => suggestionsAt(hour.value))
const reviewing = computed(() => suggestions.value.find((s) => s.id === reviewId.value))
const openReview = (id: string) => (location.hash = `#/review/${id}`)
const backToDashboard = () => (location.hash = '#/')

const bellCount = computed(() => {
  if (role.value === 'nadmo') return nadmoAlerts().filter((a) => !a.acknowledgedAt).length
  if (role.value === 'admin') return SENSORS.filter((s) => isOffline(s) || isLowBattery(s)).length
  return suggestions.value.filter((s) => !isDecided(s.id)).length
})
</script>

<template>
  <!-- Phone apps: collector and citizen -->
  <PhoneShell
    v-if="role === 'collector'"
    role="collector"
    caption="Waste collector app (phone). Shows bins in their own zone only."
  >
    <CollectorApp :hour="hour" />
  </PhoneShell>
  <PhoneShell
    v-else-if="role === 'citizen'"
    role="citizen"
    caption="Citizen app (phone). Alerts here also go out by SMS for basic phones."
  >
    <CitizenApp :hour="hour" />
  </PhoneShell>

  <!-- Desktop: AMA dashboard, review screen, NADMO view -->
  <div v-else class="app" :class="{ 'is-review': reviewId || role === 'admin' }">
    <AppHeader
      class="area-header"
      :role="role"
      :live="live"
      :hour="hour"
      :minutes-since-sync="minutesSinceSync"
      :pending-count="bellCount"
    />

    <AdminView v-if="role === 'admin'" class="area-review" :hour="hour" />

    <template v-else-if="reviewId">
      <ReviewScreen
        v-if="reviewing"
        :key="reviewing.id"
        class="area-review"
        :s="reviewing"
        :hour="hour"
        @back="backToDashboard"
      />
      <div v-else class="area-review panel missing">
        <p>This suggestion does not exist at {{ String(hour).padStart(2, '0') }}:00. The readings may have returned to normal.</p>
        <button @click="backToDashboard">Back to dashboard</button>
      </div>
    </template>

    <template v-else>
      <ZonePanel :key="`panel-${role}`" v-model:zone="zone" class="area-left" :hour="hour" :flood-only="role === 'nadmo'" />
      <main class="area-main">
        <TimelineBar v-model="hour" :now-hour="nowHour" />
        <CityMap
          :key="`map-${role}`"
          :hour="hour"
          :zone="zone"
          :locked-layer="role === 'nadmo' ? 'drain' : undefined"
        />
      </main>
      <div class="area-bottom" :class="{ nadmo: role === 'nadmo' }">
        <template v-if="role === 'nadmo'">
          <FloodAlerts />
          <TopDrains :hour="hour" />
        </template>
        <template v-else>
          <PendingApprovals :items="suggestions" @review="openReview" />
          <SensorHealth />
          <TopDrains :hour="hour" />
        </template>
      </div>
    </template>
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
.is-review {
  grid-template-columns: 1fr;
  grid-template-areas:
    'header'
    'review';
}
.area-review {
  grid-area: review;
  min-width: 0;
}
.missing {
  padding: var(--s6);
  display: grid;
  gap: var(--s3);
  justify-items: start;
}
.missing button {
  border: 0;
  background: var(--ink);
  color: var(--surface);
  border-radius: var(--r-pill);
  padding: 8px 16px;
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
.area-bottom.nadmo {
  grid-template-columns: 2fr 1fr;
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
  .area-bottom,
  .area-bottom.nadmo {
    grid-template-columns: 1fr;
  }
}
</style>
