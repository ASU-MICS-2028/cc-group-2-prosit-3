<script setup lang="ts">
import type { Status } from '../types'
import { STATUS_COLOR, STATUS_LABEL } from '../lib/status'

/* A pill with a coloured dot AND a word, so colour is never the only signal. */
const props = defineProps<{ status: Status; label?: string }>()
</script>

<template>
  <span class="chip" :data-status="props.status">
    <span class="dot" :style="{ background: STATUS_COLOR[props.status] }" />
    {{ props.label ?? STATUS_LABEL[props.status] }}
  </span>
</template>

<style scoped>
.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: var(--r-pill);
  background: var(--canvas);
  font-size: 12px;
  white-space: nowrap;
}
.chip[data-status='danger'] {
  background: var(--danger-tint);
}
.chip[data-status='watch'] {
  background: var(--watch-tint);
}
.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}
</style>
