<script setup lang="ts">
import { computed, ref } from 'vue'
import { Route, Map as MapIcon, History, User, Megaphone } from 'lucide'
import type { ZoneId } from '../../types'
import { ZONES, readingsAt } from '../../data/mock'
import { THRESHOLDS } from '../../lib/status'
import { STATUS_HEX } from '../../lib/status'
import { iconSvg } from '../../lib/icon'
import { allReviews, reaches } from '../../stores/approvals'
import { emptied, markEmptied } from '../../stores/field'
import StatusChip from '../StatusChip.vue'
import BottomNav from './BottomNav.vue'
import BinMap from './BinMap.vue'

/* Waste collector app (brief §7.4). Least privilege: own zone, bins only. */
const props = defineProps<{ hour: number }>()

const ZONE: ZoneId = 'makola'
const zone = ZONES.find((z) => z.id === ZONE)!
const tab = ref('route')

// Route order: fullest bins first, done bins at the end, bins with no data last.
const stops = computed(() =>
  readingsAt(props.hour)
    .filter((r) => r.sensor.zoneId === ZONE && r.sensor.type === 'bin')
    .map((reading) => ({ reading, done: !!emptied[reading.sensor.id] }))
    .sort((a, b) => Number(a.done) - Number(b.done) || (b.reading.value ?? -1) - (a.reading.value ?? -1)),
)
const doneCount = computed(() => stops.value.filter((s) => s.done).length)
const history = computed(() =>
  stops.value.filter((s) => s.done).map((s) => ({ place: s.reading.sensor.place, id: s.reading.sensor.id, time: emptied[s.reading.sensor.id] })),
)

// Tasks AMA approved and sent to collectors in this zone.
const tasks = computed(() => allReviews().filter((r) => r.kind === 'waste' && r.state === 'sent' && reaches(r, ZONE)))

const tabs = computed(() => [
  { id: 'route', label: 'Route', icon: Route, badge: stops.value.length - doneCount.value },
  { id: 'map', label: 'Map', icon: MapIcon },
  { id: 'history', label: 'History', icon: History },
  { id: 'profile', label: 'Profile', icon: User },
])
const pad = (h: number) => String(h).padStart(2, '0')
</script>

<template>
  <header class="app-head">
    <p class="label">{{ zone.name }} · {{ pad(hour) }}:00</p>
    <h1>{{ { route: "Today's route", map: 'Route map', history: 'Emptied today', profile: 'Profile' }[tab] }}</h1>
  </header>

  <main class="content">
    <!-- Route -->
    <template v-if="tab === 'route'">
      <div v-for="t in tasks" :key="t.id" class="task">
        <span v-html="iconSvg(Megaphone, 18)" />
        <div>
          <b>Task from AMA · {{ t.sentAt }}</b>
          <p>{{ t.messages.en }}</p>
        </div>
      </div>

      <div class="progress">
        <div class="bar"><span :style="{ width: `${(doneCount / stops.length) * 100}%` }" /></div>
        <span>{{ doneCount }} of {{ stops.length }} bins done</span>
      </div>

      <ol class="stops">
        <li v-for="(st, i) in stops" :key="st.reading.sensor.id" :data-done="st.done">
          <div class="stop-head">
            <span class="num">{{ i + 1 }}</span>
            <div class="place">
              <b>{{ st.reading.sensor.place }}</b>
              <span class="mono">{{ st.reading.sensor.id }}</span>
            </div>
            <span class="fill">{{ st.done ? 0 : (st.reading.value ?? '—') }}<small v-if="st.reading.value !== null || st.done">%</small></span>
          </div>

          <template v-if="!st.done">
            <div class="meter">
              <span
                :style="{ width: `${st.reading.value ?? 0}%`, background: STATUS_HEX[st.reading.status] }"
              />
              <i :style="{ left: `${THRESHOLDS.bin.danger}%` }" />
            </div>
            <div class="stop-foot">
              <StatusChip :status="st.reading.status" :label="st.reading.value === null ? 'No data: check by eye' : undefined" />
              <button class="big-btn" @click="markEmptied(st.reading.sensor.id)">Mark as emptied</button>
            </div>
          </template>
          <p v-else class="done-line">Emptied at {{ emptied[st.reading.sensor.id] }}</p>
        </li>
      </ol>
    </template>

    <!-- Map -->
    <BinMap v-else-if="tab === 'map'" :zone-id="ZONE" :stops="stops" />

    <!-- History -->
    <template v-else-if="tab === 'history'">
      <p v-if="!history.length" class="empty">No bins emptied yet today.</p>
      <ul v-else class="history">
        <li v-for="h in history" :key="h.id">
          <div>
            <b>{{ h.place }}</b>
            <span class="mono">{{ h.id }}</span>
          </div>
          <span>{{ h.time }}</span>
        </li>
      </ul>
    </template>

    <!-- Profile -->
    <template v-else>
      <div class="profile">
        <span class="avatar">T1</span>
        <div>
          <b>Waste collector</b>
          <p class="label">Team Makola 1 (fake demo account)</p>
        </div>
      </div>
      <div class="access">
        <h2>What you can see</h2>
        <ul>
          <li>Bins in <b>{{ zone.name }}</b> only</li>
          <li>Tasks sent to you by AMA</li>
        </ul>
        <h2>What you cannot see</h2>
        <ul>
          <li>Other zones, drains or air quality</li>
          <li>Citizen names, phone numbers or reports</li>
        </ul>
        <p class="label">This is least privilege: each role gets only what the job needs.</p>
      </div>
    </template>
  </main>

  <BottomNav v-model="tab" :tabs="tabs" />
</template>

<style scoped>
.app-head {
  padding: 40px 20px 12px;
  background: var(--surface);
}
h1 {
  font-size: 26px;
  font-weight: 500;
}
.content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.task {
  display: flex;
  gap: 10px;
  padding: 14px;
  border-radius: var(--r-card);
  background: var(--ink);
  color: var(--surface);
  font-size: 15px;
}
.task :deep(svg) {
  display: block;
  margin-top: 2px;
}
.task p {
  margin-top: 4px;
}
.progress {
  display: grid;
  gap: 6px;
  font-size: 14px;
  color: var(--ink-muted);
}
.bar {
  height: 8px;
  border-radius: 4px;
  background: var(--line);
  overflow: hidden;
}
.bar span {
  display: block;
  height: 100%;
  background: var(--safe);
  transition: width 0.3s;
}
.stops {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 10px;
}
.stops li {
  background: var(--surface);
  border-radius: 16px;
  padding: 16px;
  display: grid;
  gap: 12px;
}
.stops li[data-done='true'] {
  opacity: 0.6;
}
.stop-head {
  display: flex;
  align-items: center;
  gap: 12px;
}
.num {
  width: 28px;
  height: 28px;
  flex: none;
  border-radius: 50%;
  background: var(--canvas);
  display: grid;
  place-items: center;
  font-size: 14px;
}
.place {
  flex: 1;
  display: grid;
  min-width: 0;
}
.place b {
  font-weight: 500;
}
.fill {
  font-size: 30px;
  font-weight: 300;
  line-height: 1;
}
.fill small {
  font-size: 14px;
  color: var(--ink-muted);
}
.meter {
  position: relative;
  height: 6px;
  border-radius: 3px;
  background: var(--line);
}
.meter span {
  display: block;
  height: 100%;
  border-radius: 3px;
}
.meter i {
  position: absolute;
  top: -3px;
  width: 2px;
  height: 12px;
  background: var(--ink);
}
.stop-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.big-btn {
  border: 0;
  background: var(--ink);
  color: var(--surface);
  border-radius: var(--r-pill);
  padding: 14px 20px;
  font-size: 16px;
  font-weight: 500;
}
.done-line {
  color: var(--safe);
  font-size: 15px;
}
.empty {
  color: var(--ink-muted);
  text-align: center;
  padding: 40px 0;
}
.history {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}
.history li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--surface);
  border-radius: var(--r-card);
  padding: 14px 16px;
}
.history li div {
  display: grid;
}
.profile {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--surface);
  border-radius: 16px;
  padding: 16px;
}
.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--ink);
  color: var(--surface);
  display: grid;
  place-items: center;
}
.access {
  background: var(--surface);
  border-radius: 16px;
  padding: 16px;
  display: grid;
  gap: 8px;
}
.access h2 {
  font-size: 15px;
  font-weight: 500;
}
.access ul {
  margin: 0;
  padding-left: 20px;
  display: grid;
  gap: 4px;
  font-size: 15px;
}
</style>
