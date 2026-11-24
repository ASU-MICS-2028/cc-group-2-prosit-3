<script setup lang="ts">
import { CloudRain, Trash2, Wind } from 'lucide'
import type { Suggestion } from '../types'
import { iconSvg } from '../lib/icon'
import StatusChip from './StatusChip.vue'

/* AI suggestions waiting for a person. The full review screen (design brief §8) comes next. */
defineProps<{ items: Suggestion[] }>()
const ICONS = { flood: CloudRain, waste: Trash2, air: Wind }
</script>

<template>
  <section class="card panel">
    <header>
      <h2 class="title">Pending approvals</h2>
      <span class="count">{{ items.length }}</span>
    </header>
    <p v-if="!items.length" class="label empty">Nothing waiting. All readings are within limits.</p>
    <ul v-else>
      <li v-for="s in items" :key="s.id">
        <span class="ic" :data-sev="s.severity" v-html="iconSvg(ICONS[s.kind], 16)" />
        <div class="body">
          <div class="row">
            <span class="t">{{ s.title }}</span>
            <StatusChip :status="s.severity" />
          </div>
          <p class="label">{{ s.evidence }}</p>
        </div>
        <button class="review" disabled title="The review screen is the next thing to build">Review</button>
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
.review {
  border: 0;
  background: var(--ink);
  color: var(--surface);
  border-radius: var(--r-pill);
  padding: 6px 14px;
}
.review:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.empty {
  padding: var(--s3) 0;
}
</style>
