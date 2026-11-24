<script setup lang="ts">
import { computed } from 'vue'
import { Bell, RefreshCw, History } from 'lucide'
import { iconSvg } from '../lib/icon'
import type { Role } from '../types'
import RoleSwitcher from './RoleSwitcher.vue'

const props = defineProps<{
  live: boolean
  hour: number
  minutesSinceSync: number
  pendingCount: number
  role: Role
}>()

const USER: Record<'ama' | 'nadmo', { initials: string; name: string; scope: string; sub: string; bell: string }> = {
  ama: { initials: 'AO', name: 'AMA Officer', scope: 'All zones', sub: 'AMA operations', bell: 'alerts waiting for approval' },
  nadmo: { initials: 'NO', name: 'NADMO Officer', scope: 'Flood alerts only', sub: 'NADMO flood view', bell: 'flood alerts not yet acknowledged' },
}
const user = computed(() => USER[props.role === 'nadmo' ? 'nadmo' : 'ama'])

const freshness = computed(() => {
  if (!props.live) return { text: `Replaying ${String(props.hour).padStart(2, '0')}:00`, state: 'replay' }
  const m = props.minutesSinceSync
  const text = m < 1 ? 'Synced just now' : `Synced ${m} min ago`
  // Brief: amber after 10 min, grey after 30 min.
  const state = m >= 30 ? 'stale' : m >= 10 ? 'late' : 'fresh'
  return { text, state }
})
</script>

<template>
  <header class="header panel">
    <div class="brand">
      <svg class="mark" viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="16" cy="16" r="15" fill="#111" />
        <path d="M7 18c2 1.5 3.5 1.5 5.5 0s3.5-1.5 5.5 0 3.5 1.5 5.5 0" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" />
        <circle cx="16" cy="11" r="3" fill="#fff" />
      </svg>
      <div>
        <h1>SmartCity Accra</h1>
        <p class="label">{{ user.sub }}</p>
      </div>
    </div>

    <div class="right">
      <RoleSwitcher :role="role" />
      <span class="tag sim" title="All sensor data is simulated. See README.">Simulated data</span>
      <span class="tag fresh" :data-state="freshness.state">
        <span v-html="iconSvg(live ? RefreshCw : History, 14)" />
        {{ freshness.text }}
      </span>
      <button class="bell" :aria-label="`${pendingCount} ${user.bell}`">
        <span v-html="iconSvg(Bell, 18)" />
        <span v-if="pendingCount" class="badge">{{ pendingCount }}</span>
      </button>
      <div class="user">
        <span class="avatar" aria-hidden="true">{{ user.initials }}</span>
        <div>
          <div>{{ user.name }}</div>
          <div class="label">{{ user.scope }}</div>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s4);
  padding: var(--s3) var(--s5);
  flex-wrap: wrap;
}
.brand {
  display: flex;
  align-items: center;
  gap: var(--s3);
}
.mark {
  width: 34px;
  height: 34px;
}
h1 {
  font-size: 18px;
  font-weight: 500;
  line-height: 1.1;
}
.right {
  display: flex;
  align-items: center;
  gap: var(--s3);
  flex-wrap: wrap;
}
.tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: var(--r-pill);
  background: var(--canvas);
  font-size: 12px;
}
.tag :deep(svg) {
  display: block;
}
.sim {
  border: 1px dashed var(--ink-muted);
  background: transparent;
}
.fresh[data-state='late'] {
  color: var(--watch);
}
.fresh[data-state='stale'] {
  color: var(--offline);
}
.fresh[data-state='replay'] {
  background: var(--ink);
  color: var(--surface);
}
.bell {
  position: relative;
  border: 0;
  background: var(--canvas);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: grid;
  place-items: center;
}
.bell :deep(svg) {
  display: block;
}
.badge {
  position: absolute;
  top: -2px;
  right: -2px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: var(--r-pill);
  background: var(--danger);
  color: #fff;
  font-size: 11px;
  display: grid;
  place-items: center;
}
.user {
  display: flex;
  align-items: center;
  gap: var(--s2);
  font-size: 13px;
  line-height: 1.2;
}
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--ink);
  color: var(--surface);
  display: grid;
  place-items: center;
  font-size: 12px;
}
</style>
