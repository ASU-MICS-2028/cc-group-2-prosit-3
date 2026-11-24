<script setup lang="ts">
import type { Role } from '../types'

/*
 * DEMO ONLY: switch between the prototype's roles without logging in.
 * In the real system each person logs in (Cognito) and the backend
 * decides what they may see. Hiding things in the browser is not security.
 */
defineProps<{ role: Role }>()

const ROLES: { id: Role; label: string; hash: string }[] = [
  { id: 'ama', label: 'AMA', hash: '#/' },
  { id: 'nadmo', label: 'NADMO', hash: '#/nadmo' },
  { id: 'collector', label: 'Collector', hash: '#/collector' },
  { id: 'citizen', label: 'Citizen', hash: '#/citizen' },
]
</script>

<template>
  <div class="switcher" title="Demo only: real users log in and only see their own role">
    <span class="label">View as</span>
    <div class="segmented" role="group" aria-label="Demo: view as role">
      <a v-for="r in ROLES" :key="r.id" :href="r.hash" :aria-current="r.id === role ? 'page' : undefined">{{ r.label }}</a>
    </div>
  </div>
</template>

<style scoped>
.switcher {
  display: inline-flex;
  align-items: center;
  gap: var(--s2);
}
.segmented {
  background: var(--canvas);
}
a {
  padding: 6px 12px;
  border-radius: var(--r-pill);
  color: var(--ink);
  text-decoration: none;
  font-size: 13px;
}
a[aria-current='page'] {
  background: var(--ink);
  color: var(--surface);
}
a:focus-visible {
  outline: 2px solid var(--water);
  outline-offset: 2px;
}
</style>
