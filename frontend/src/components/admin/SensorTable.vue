<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Sensor, SensorType, Status, ZoneId } from '../../types'
import { SENSORS, ZONES, isLowBattery, isOffline, readingAt } from '../../data/mock'
import { STATUS_HEX } from '../../lib/status'
import { maintenance, toggleMaintenance } from '../../stores/admin'
import StatusChip from '../StatusChip.vue'

/* Sensors table (brief §7.6): offline and low-battery sensors float to the top. */
const props = defineProps<{ hour: number }>()

type Health = 'offline' | 'low' | 'maint' | 'ok'
const health = (s: Sensor): Health =>
  isOffline(s) ? 'offline' : isLowBattery(s) ? 'low' : maintenance[s.id] ? 'maint' : 'ok'
const RANK: Record<Health, number> = { offline: 0, low: 1, maint: 2, ok: 3 }
const HEALTH_CHIP: Record<Health, { status: Status; label: string }> = {
  offline: { status: 'offline', label: 'Offline' },
  low: { status: 'watch', label: 'Low battery' },
  maint: { status: 'watch', label: 'In maintenance' },
  ok: { status: 'safe', label: 'Working' },
}
const TYPE_LABEL: Record<SensorType, string> = { drain: 'Drain level', bin: 'Bin fill', air: 'Air (PM2.5)' }

const type = ref<SensorType | 'all'>('all')
const zone = ref<ZoneId | 'all'>('all')

const rows = computed(() =>
  SENSORS.filter((s) => (type.value === 'all' || s.type === type.value) && (zone.value === 'all' || s.zoneId === zone.value))
    .map((s) => ({ s, h: health(s), r: readingAt(s, props.hour) }))
    .sort((a, b) => RANK[a.h] - RANK[b.h] || a.s.id.localeCompare(b.s.id)),
)

const kpis = computed(() => {
  const all = SENSORS.map(health)
  return [
    { label: 'Sensors', value: SENSORS.length, color: undefined },
    { label: 'Working', value: all.filter((h) => h === 'ok').length, color: STATUS_HEX.safe },
    { label: 'Low battery', value: all.filter((h) => h === 'low').length, color: STATUS_HEX.watch },
    { label: 'In maintenance', value: all.filter((h) => h === 'maint').length, color: STATUS_HEX.watch },
    { label: 'Offline', value: all.filter((h) => h === 'offline').length, color: STATUS_HEX.offline },
  ]
})
const zoneName = (id: ZoneId) => ZONES.find((z) => z.id === id)?.name
const batteryColor = (b: number) => (b < 20 ? STATUS_HEX.danger : b < 40 ? STATUS_HEX.watch : STATUS_HEX.safe)
</script>

<template>
  <div class="wrap">
    <div class="kpis">
      <div v-for="k in kpis" :key="k.label" class="kpi panel">
        <span class="label"><i v-if="k.color" :style="{ background: k.color }" />{{ k.label }}</span>
        <span class="num">{{ k.value }}</span>
      </div>
    </div>

    <section class="panel table-card">
      <div class="filters">
        <div class="segmented" role="group" aria-label="Sensor type">
          <button :aria-pressed="type === 'all'" @click="type = 'all'">All types</button>
          <button :aria-pressed="type === 'drain'" @click="type = 'drain'">Drain</button>
          <button :aria-pressed="type === 'bin'" @click="type = 'bin'">Bin</button>
          <button :aria-pressed="type === 'air'" @click="type = 'air'">Air</button>
        </div>
        <div class="segmented" role="group" aria-label="Zone">
          <button :aria-pressed="zone === 'all'" @click="zone = 'all'">All zones</button>
          <button v-for="z in ZONES" :key="z.id" :aria-pressed="zone === z.id" @click="zone = z.id">{{ z.name }}</button>
        </div>
        <span class="label count">{{ rows.length }} sensors · problems first</span>
      </div>

      <div class="scroll">
        <table>
          <thead>
            <tr>
              <th>Health</th>
              <th>Sensor</th>
              <th>Zone · place</th>
              <th>Reading now</th>
              <th>Battery</th>
              <th>Last seen</th>
              <th><span class="sr">Action</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="{ s, h, r } in rows" :key="s.id" :data-health="h">
              <td><StatusChip :status="HEALTH_CHIP[h].status" :label="HEALTH_CHIP[h].label" /></td>
              <td>
                <span class="mono">{{ s.id }}</span>
                <div class="label">{{ TYPE_LABEL[s.type] }}</div>
              </td>
              <td>
                {{ zoneName(s.zoneId) }}
                <div class="label">{{ s.place }}</div>
              </td>
              <td>
                <template v-if="r.value !== null">
                  <span class="dot" :style="{ background: STATUS_HEX[r.status] }" />
                  {{ r.value }}{{ r.unit === '%' ? '%' : ` ${r.unit}` }}
                </template>
                <span v-else class="label">No data</span>
              </td>
              <td>
                <div class="battery">
                  <div class="bar"><span :style="{ width: `${s.battery}%`, background: batteryColor(s.battery) }" /></div>
                  <span>{{ s.battery }}%</span>
                </div>
              </td>
              <td :class="{ late: isOffline(s) }">{{ s.lastSeenMin }} min ago</td>
              <td class="act">
                <button class="small" @click="toggleMaintenance(s.id)">
                  {{ maintenance[s.id] ? 'Return to service' : 'Send for maintenance' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="label foot">
        New real sensors are registered in AWS IoT Core, each with its own certificate. In this prototype the
        simulator stands in for them.
      </p>
    </section>
  </div>
</template>

<style scoped>
.wrap {
  display: grid;
  gap: var(--s4);
}
.kpis {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--s4);
}
.kpi {
  padding: var(--s4) var(--s5);
  display: grid;
  gap: 4px;
}
.kpi .label {
  display: flex;
  align-items: center;
  gap: 6px;
}
.kpi i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.num {
  font-size: 36px;
  font-weight: 300;
  line-height: 1;
}
.table-card {
  padding: var(--s5);
  display: grid;
  gap: var(--s4);
  min-width: 0;
}
.filters {
  display: flex;
  gap: var(--s3);
  align-items: center;
  flex-wrap: wrap;
}
.filters .segmented {
  background: var(--canvas);
}
.count {
  margin-left: auto;
}
.scroll {
  overflow-x: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
th {
  text-align: left;
  font-weight: 400;
  color: var(--ink-muted);
  font-size: 12px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--line);
  white-space: nowrap;
}
td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--line);
  vertical-align: middle;
}
tr[data-health='offline'] td,
tr[data-health='low'] td {
  background: var(--canvas);
}
.dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  margin-right: 4px;
}
.battery {
  display: flex;
  align-items: center;
  gap: 8px;
}
.battery .bar {
  width: 60px;
  height: 6px;
  border-radius: 3px;
  background: var(--line);
  overflow: hidden;
}
.battery .bar span {
  display: block;
  height: 100%;
}
.late {
  color: var(--danger);
}
.act {
  text-align: right;
}
.small {
  border: 1px solid var(--line);
  background: var(--surface);
  border-radius: var(--r-pill);
  padding: 6px 12px;
  font-size: 12px;
  white-space: nowrap;
}
.sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
@media (max-width: 1100px) {
  .kpis {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
