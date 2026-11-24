<script setup lang="ts">
/*
 * Earthly-style timeline. Drag the cursor to replay the simulated day.
 * "Live" jumps back to the current hour.
 * Week and Month views need stored history from the backend, so they come later.
 */
const hour = defineModel<number>({ required: true })
const props = defineProps<{ nowHour: number }>()

const hours = Array.from({ length: 24 }, (_, h) => h)
const pad = (h: number) => String(h).padStart(2, '0')
</script>

<template>
  <div class="timeline">
    <div class="segmented" role="group" aria-label="Time mode">
      <button :aria-pressed="hour === props.nowHour" @click="hour = props.nowHour">Live</button>
      <button :aria-pressed="hour !== props.nowHour" @click="hour = hour === props.nowHour ? 15 : hour">Replay</button>
    </div>

    <div class="scale panel">
      <div class="ticks" aria-hidden="true">
        <div v-for="h in hours" :key="h" class="tick" :class="{ major: h % 3 === 0, now: h === props.nowHour }">
          <span class="bar" />
          <span v-if="h % 3 === 0" class="lbl">{{ pad(h) }}</span>
        </div>
      </div>
      <div class="cursor" :style="{ left: `calc(24px + (100% - 48px) * ${hour / 23})` }">
        <span class="cursor-label">{{ pad(hour) }}:00</span>
      </div>
      <input
        v-model.number="hour"
        type="range"
        min="0"
        max="23"
        step="1"
        aria-label="Hour of the simulated day"
      />
    </div>
  </div>
</template>

<style scoped>
.timeline {
  display: flex;
  align-items: stretch;
  gap: var(--s3);
}
.segmented {
  align-self: center;
}
.scale {
  position: relative;
  flex: 1;
  padding: 10px 24px 8px;
  min-width: 0;
}
.ticks {
  display: flex;
  justify-content: space-between;
}
.tick {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 0;
}
.bar {
  width: 1px;
  height: 8px;
  background: var(--line);
}
.major .bar {
  height: 12px;
  background: var(--ink-muted);
}
.now .bar {
  background: var(--water);
  width: 2px;
}
.lbl {
  margin-top: 6px;
  font-size: 12px;
  color: var(--ink-muted);
}
.cursor {
  position: absolute;
  top: 4px;
  bottom: 4px;
  width: 2px;
  background: var(--ink);
  transform: translateX(-1px);
  pointer-events: none;
}
.cursor-label {
  position: absolute;
  top: -2px;
  left: 6px;
  font-size: 11px;
  font-family: var(--font-mono);
  background: var(--ink);
  color: var(--surface);
  padding: 1px 6px;
  border-radius: var(--r-pill);
  white-space: nowrap;
}
input[type='range'] {
  position: absolute;
  inset: 0 24px;
  width: calc(100% - 48px);
  height: 100%;
  margin: 0;
  opacity: 0;
  cursor: ew-resize;
}
</style>
