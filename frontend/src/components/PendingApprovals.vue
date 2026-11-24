<script setup lang="ts">
import { computed } from 'vue'
import { CloudRain, Trash2, Wind } from 'lucide'
import type { Suggestion } from '../types'
import { iconSvg } from '../lib/icon'
import { stateOf } from '../stores/approvals'
import StatusChip from './StatusChip.vue'

/* AI suggestions waiting for a person. "Review" opens the approval screen (design brief §8). */
const props = defineProps<{ items: Suggestion[] }>()
const emit = defineEmits<{ review: [id: string] }>()
const ICONS = { flood: CloudRain, waste: Trash2, air: Wind }

const STATE_LABEL: Record<string, string> = {
  'in-review': 'In review',
  edited: 'Being edited',
  'waiting-second': 'Needs 2nd officer',
  expired: 'Escalated',
  sent: 'Sent',
  rejected: 'Rejected',
}
const waiting = computed(() => props.items.filter((s) => !['sent', 'rejected'].includes(stateOf(s.id))).length)
</script>

<template>
  <section class="card panel">
    <header>
      <h2 class="title">Pending approvals</h2>
      <span class="count">{{ waiting }}</span>
    </header>
    <p v-if="!items.length" class="label empty">Nothing waiting. All readings are within limits.</p>
    <ul v-else>
      <li v-for="s in items" :key="s.id" :data-state="stateOf(s.id)">
        <span class="ic" :data-sev="s.severity" v-html="iconSvg(ICONS[s.kind], 16)" />
        <div class="body">
          <div class="row">
            <span class="t">{{ s.title }}</span>
            <StatusChip :status="s.severity" />
            <span v-if="STATE_LABEL[stateOf(s.id)]" class="state">{{ STATE_LABEL[stateOf(s.id)] }}</span>
          </div>
          <p class="label">{{ s.evidence }}</p>
        </div>
        <button class="review" @click="emit('review', s.id)">
          {{ ['sent', 'rejected'].includes(stateOf(s.id)) ? 'View' : 'Review' }}
        </button>
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
  min-width: 0;
}
header {
  display: flex;
  align-items: center;
  gap: var(--s2);
}
.count {
  font-size: 12px;
  background: var(--ink);
  color: var(--surface);
  border-radius: var(--r-pill);
  padding: 1px 8px;
}
ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--s2);
}
li {
  display: flex;
  align-items: center;
  gap: var(--s3);
  padding: var(--s3);
  border-radius: var(--r-card);
  background: var(--canvas);
}
li[data-state='sent'],
li[data-state='rejected'] {
  opacity: 0.6;
}
.ic {
  width: 32px;
  height: 32px;
  flex: none;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--surface);
}
.ic[data-sev='danger'] {
  color: var(--danger);
}
.ic[data-sev='watch'] {
  color: var(--watch);
}
.ic :deep(svg) {
  display: block;
}
.body {
  flex: 1;
  min-width: 0;
}
.row {
  display: flex;
  align-items: center;
  gap: var(--s2);
  flex-wrap: wrap;
}
.t {
  font-weight: 500;
}
.state {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: var(--r-pill);
  border: 1px solid var(--ink-muted);
}
.review {
  border: 0;
  background: var(--ink);
  color: var(--surface);
  border-radius: var(--r-pill);
  padding: 6px 14px;
}
li[data-state='sent'] .review,
li[data-state='rejected'] .review {
  background: var(--surface);
  color: var(--ink);
  box-shadow: 0 0 0 1px var(--line);
}
.empty {
  padding: var(--s3) 0;
}
</style>
