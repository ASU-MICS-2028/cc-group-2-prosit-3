<script setup lang="ts">
import type { IconNode } from 'lucide'
import { iconSvg } from '../../lib/icon'

/* Bottom menu for the phone apps (structure from the recycling app reference). */
defineProps<{ tabs: { id: string; label: string; icon: IconNode; badge?: number }[] }>()
const active = defineModel<string>({ required: true })
</script>

<template>
  <nav class="nav" aria-label="App menu">
    <button
      v-for="t in tabs"
      :key="t.id"
      :aria-current="active === t.id ? 'page' : undefined"
      @click="active = t.id"
    >
      <span class="ic" v-html="iconSvg(t.icon, 22)" />
      <span v-if="t.badge" class="badge">{{ t.badge }}</span>
      {{ t.label }}
    </button>
  </nav>
</template>

<style scoped>
.nav {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  background: var(--surface);
  border-top: 1px solid var(--line);
  padding: 6px 4px 14px;
}
button {
  position: relative;
  border: 0;
  background: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  color: var(--ink-muted);
  padding: 6px 0;
}
button[aria-current='page'] {
  color: var(--ink);
  font-weight: 500;
}
button[aria-current='page'] .ic {
  background: var(--ink);
  color: var(--surface);
}
.ic {
  width: 44px;
  height: 30px;
  border-radius: var(--r-pill);
  display: grid;
  place-items: center;
}
.ic :deep(svg) {
  display: block;
}
.badge {
  position: absolute;
  top: 2px;
  left: calc(50% + 10px);
  min-width: 18px;
  height: 18px;
  border-radius: var(--r-pill);
  background: var(--danger);
  color: #fff;
  font-size: 11px;
  display: grid;
  place-items: center;
  padding: 0 4px;
}
</style>
