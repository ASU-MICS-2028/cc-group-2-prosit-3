<script setup lang="ts">
import { computed } from 'vue'
import type { Status } from '../types'
import { STATUS_HEX } from '../lib/status'
import StatusChip from './StatusChip.vue'

/*
 * Earthly-style gauge: a 270° ring of tick marks.
 * Ticks up to the value take the status colour; a longer tick marks the limit.
 */
const props = defineProps<{
  value: number | null
  max?: number
  limit: number
  unit: string
  status: Status
}>()

const TICKS = 54
const SWEEP = 270
const START = 135 // degrees, bottom-left
const SIZE = 150
const C = SIZE / 2

const max = computed(() => props.max ?? 100)
const filled = computed(() => (props.value === null ? 0 : Math.round((props.value / max.value) * TICKS)))
const limitIndex = computed(() => Math.round((props.limit / max.value) * TICKS))

const ticks = computed(() =>
  Array.from({ length: TICKS + 1 }, (_, i) => {
    const angle = ((START + (SWEEP * i) / TICKS) * Math.PI) / 180
    const isLimit = i === limitIndex.value
    const outer = C - 4
    const inner = outer - (isLimit ? 16 : 9)
    return {
      x1: C + inner * Math.cos(angle),
      y1: C + inner * Math.sin(angle),
      x2: C + outer * Math.cos(angle),
      y2: C + outer * Math.sin(angle),
      color: isLimit ? '#111111' : i <= filled.value && props.value !== null ? STATUS_HEX[props.status] : '#e5e5e1',
      width: isLimit ? 2 : 1.5,
    }
  }),
)
</script>

<template>
  <div class="gauge">
    <svg :viewBox="`0 0 ${SIZE} ${SIZE}`" role="img" :aria-label="`${value ?? 'No data'} ${unit}, limit ${limit}`">
      <line
        v-for="(t, i) in ticks"
        :key="i"
        :x1="t.x1"
        :y1="t.y1"
        :x2="t.x2"
        :y2="t.y2"
        :stroke="t.color"
        :stroke-width="t.width"
        stroke-linecap="round"
      />
    </svg>
    <div class="center">
      <div class="value">
        {{ value ?? '—' }}<span class="unit">{{ unit }}</span>
      </div>
      <StatusChip :status="status" />
    </div>
  </div>
</template>

<style scoped>
.gauge {
  position: relative;
  width: 100%;
  max-width: 150px;
  aspect-ratio: 1;
}
svg {
  width: 100%;
  height: 100%;
}
.center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.value {
  font-size: 30px;
  font-weight: 400;
  line-height: 1;
}
.unit {
  font-size: 13px;
  color: var(--ink-muted);
  margin-left: 2px;
}
</style>
