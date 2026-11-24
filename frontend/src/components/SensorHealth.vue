<script setup lang="ts">
import { computed } from 'vue'
import { SENSORS, isLowBattery, isOffline } from '../data/mock'
import { STATUS_HEX } from '../lib/status'

/* Ring split into Online / Low battery / Offline (idea from the aquaculture dashboard). */
const offline = SENSORS.filter(isOffline)
const lowBattery = SENSORS.filter(isLowBattery)
const ok = SENSORS.length - offline.length - lowBattery.length
const online = SENSORS.length - offline.length

const R = 44
const CIRC = 2 * Math.PI * R
const segments = computed(() => {
  const parts = [
    { n: ok, color: STATUS_HEX.safe },
    { n: lowBattery.length, color: STATUS_HEX.watch },
    { n: offline.length, color: STATUS_HEX.offline },
  ]
  let offset = 0
  return parts.map((p) => {
    const len = (p.n / SENSORS.length) * CIRC
    const seg = { ...p, dash: `${Math.max(len - 3, 0)} ${CIRC}`, offset: -offset }
    offset += len
    return seg
  })
})

const problems = [...offline, ...lowBattery]
</script>

<template>
  <section class="card panel">
    <h2 class="title">Sensor health</h2>
    <div class="content">
      <div class="ring">
        <svg viewBox="0 0 110 110" role="img" :aria-label="`${online} of ${SENSORS.length} sensors online`">
          <circle
            v-for="(s, i) in segments"
            :key="i"
            cx="55"
            cy="55"
            :r="R"
            fill="none"
            :stroke="s.color"
            stroke-width="7"
            stroke-linecap="round"
            :stroke-dasharray="s.dash"
            :stroke-dashoffset="s.offset"
            transform="rotate(-90 55 55)"
          />
        </svg>
        <div class="center">
          <span class="big">{{ online }}<span class="of">/{{ SENSORS.length }}</span></span>
          <span class="label">online</span>
        </div>
      </div>
      <ul class="counts">
        <li><i :style="{ background: STATUS_HEX.safe }" /> Working <b>{{ ok }}</b></li>
        <li><i :style="{ background: STATUS_HEX.watch }" /> Low battery <b>{{ lowBattery.length }}</b></li>
        <li><i :style="{ background: STATUS_HEX.offline }" /> Offline <b>{{ offline.length }}</b></li>
      </ul>
    </div>
    <ul class="problems">
      <li v-for="s in problems" :key="s.id">
        <span class="mono">{{ s.id }}</span>
        <span class="label">
          {{ isOffline(s) ? `No data for ${s.lastSeenMin} min` : `Battery ${s.battery}%` }}
        </span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.card {
  padding: var(--s5);
  display: flex;
  flex-direction: column;
  gap: var(--s3);
}
.content {
  display: flex;
  align-items: center;
  gap: var(--s5);
}
.ring {
  position: relative;
  width: 110px;
  height: 110px;
  flex: none;
}
.center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.big {
  font-size: 26px;
  line-height: 1;
}
.of {
  font-size: 14px;
  color: var(--ink-muted);
}
ul {
  list-style: none;
  margin: 0;
  padding: 0;
}
.counts {
  display: grid;
  gap: 6px;
  font-size: 13px;
}
.counts li {
  display: flex;
  align-items: center;
  gap: 8px;
}
.counts i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.counts b {
  font-weight: 500;
  margin-left: auto;
  padding-left: var(--s4);
}
.problems {
  border-top: 1px solid var(--line);
  padding-top: var(--s3);
  display: grid;
  gap: 4px;
}
.problems li {
  display: flex;
  justify-content: space-between;
  gap: var(--s3);
}
</style>
