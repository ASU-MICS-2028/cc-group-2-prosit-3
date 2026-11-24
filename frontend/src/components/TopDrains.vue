<script setup lang="ts">
import { computed } from 'vue'
import { ZONES, readingsAt } from '../data/mock'
import { STATUS_HEX, THRESHOLDS } from '../lib/status'
import StatusChip from './StatusChip.vue'

/* Ranked list of the fullest drains across both zones (idea from the highway platform). */
const props = defineProps<{ hour: number }>()

const top = computed(() =>
  readingsAt(props.hour)
    .filter((r) => r.sensor.type === 'drain' && r.value !== null)
    .sort((a, b) => b.value! - a.value!)
    .slice(0, 5),
)
const zoneName = (id: string) => ZONES.find((z) => z.id === id)?.name
const limit = THRESHOLDS.drain.danger
</script>

<template>
  <section class="card panel">
    <h2 class="title">Top 5 drains at risk</h2>
    <ol>
      <li v-for="(r, i) in top" :key="r.sensor.id">
        <span class="rank">{{ i + 1 }}</span>
        <div class="body">
          <div class="row">
            <span class="name">{{ r.sensor.place }}</span>
            <span class="val">{{ r.value }}%</span>
          </div>
          <div class="track" :aria-label="`${r.value}% full, limit ${limit}%`">
            <div class="fill" :style="{ width: `${r.value}%`, background: STATUS_HEX[r.status] }" />
            <div class="limit" :style="{ left: `${limit}%` }" />
          </div>
          <div class="row">
            <span class="label">{{ zoneName(r.sensor.zoneId) }} · <span class="mono">{{ r.sensor.id }}</span></span>
            <StatusChip :status="r.status" />
          </div>
        </div>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.card {
  padding: var(--s5);
  display: flex;
  flex-direction: column;
  gap: var(--s3);
}
ol {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--s3);
}
li {
  display: flex;
  gap: var(--s3);
}
.rank {
  font-size: 12px;
  color: var(--ink-muted);
  width: 14px;
  padding-top: 2px;
}
.body {
  flex: 1;
  display: grid;
  gap: 4px;
  min-width: 0;
}
.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--s2);
}
.name {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.track {
  position: relative;
  height: 4px;
  border-radius: 2px;
  background: var(--line);
}
.fill {
  height: 100%;
  border-radius: 2px;
}
.limit {
  position: absolute;
  top: -3px;
  width: 1.5px;
  height: 10px;
  background: var(--ink);
}
</style>
