<script setup lang="ts">
import { computed } from 'vue'
import { ShieldCheck } from 'lucide'
import type { Review, Suggestion } from '../../types'
import { ZONES } from '../../data/mock'
import { audienceFor } from '../../data/messages'
import { setScope } from '../../stores/approvals'
import { STATUS_HEX } from '../../lib/status'
import { iconSvg } from '../../lib/icon'
import ZoneMiniMap from './ZoneMiniMap.vue'

/* Brief §8.2, right column: who receives the alert. Counts only, never names or numbers. */
const props = defineProps<{ s: Suggestion; r: Review; locked: boolean }>()

const audience = computed(() => audienceFor(props.s, props.r.scope))
const zoneIds = computed(() => (props.r.scope === 'all' ? ZONES.map((z) => z.id) : [props.s.zoneId]))
const zoneNames = computed(() => ZONES.filter((z) => zoneIds.value.includes(z.id)).map((z) => z.name).join(' + '))
</script>

<template>
  <section class="col panel">
    <h2 class="title">Who gets it</h2>

    <ZoneMiniMap :zones="zoneIds" :sensor-id="s.triggerSensorId" :color="STATUS_HEX[r.severity]" />

    <div class="row">
      <span class="label">Area</span>
      <div class="segmented" role="group" aria-label="Alert area">
        <button :aria-pressed="r.scope === 'zone'" :disabled="locked" @click="setScope(r, 'zone')">This zone</button>
        <button :aria-pressed="r.scope === 'all'" :disabled="locked" @click="setScope(r, 'all')">All pilot zones</button>
      </div>
    </div>
    <p v-if="r.scope === 'all'" class="note">
      Covers more than one zone, so a <b>second officer</b> must also approve.
    </p>

    <div class="count">
      <span class="big">{{ audience.count.toLocaleString() }}</span>
      <div>
        <div>{{ audience.label }}</div>
        <div class="label">{{ zoneNames }}</div>
      </div>
    </div>

    <fieldset :disabled="locked">
      <legend class="label">Channels</legend>
      <label><input v-model="r.channels.sms" type="checkbox" /> SMS (works on basic phones)</label>
      <label><input v-model="r.channels.app" type="checkbox" /> App notification</label>
      <label v-if="audience.isPublic"><input v-model="r.copyNadmo" type="checkbox" /> Copy to NADMO</label>
    </fieldset>
    <p v-if="!r.channels.sms && !r.channels.app" class="note warn">Choose at least one channel.</p>
    <p v-else-if="!r.channels.sms && audience.isPublic" class="note warn">
      Without SMS, residents with basic phones will not get this alert.
    </p>

    <p class="privacy label">
      <span v-html="iconSvg(ShieldCheck, 14)" />
      Recipients are shown as counts only. Phone numbers stay in the backend (Act 843).
    </p>
  </section>
</template>

<style scoped>
.col {
  padding: var(--s5);
  display: flex;
  flex-direction: column;
  gap: var(--s4);
  min-width: 0;
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s2);
  flex-wrap: wrap;
}
.segmented {
  background: var(--canvas);
}
.segmented button:disabled {
  cursor: default;
}
.count {
  display: flex;
  align-items: center;
  gap: var(--s3);
}
.big {
  font-size: 40px;
  font-weight: 300;
  line-height: 1;
}
fieldset {
  border: 0;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--s2);
}
legend {
  padding: 0;
  margin-bottom: var(--s2);
}
label {
  display: flex;
  align-items: center;
  gap: var(--s2);
}
input[type='checkbox'] {
  accent-color: var(--ink);
  width: 16px;
  height: 16px;
}
.note {
  font-size: 13px;
  padding: var(--s2) var(--s3);
  border-radius: var(--r-card);
  background: var(--canvas);
}
.note.warn {
  background: var(--watch-tint);
}
.privacy {
  display: flex;
  gap: 6px;
  align-items: flex-start;
  margin-top: auto;
}
.privacy :deep(svg) {
  display: block;
  margin-top: 1px;
}
</style>
