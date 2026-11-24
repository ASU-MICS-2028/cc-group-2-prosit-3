<script setup lang="ts">
import { ref } from 'vue'
import { Check, Minus } from 'lucide'
import { iconSvg } from '../../lib/icon'
import { PERMISSIONS, activity } from '../../stores/admin'
import SensorTable from './SensorTable.vue'
import UserTable from './UserTable.vue'

/* System admin (brief §7.6): sensors, staff accounts, and who can do what. */
defineProps<{ hour: number }>()
const tab = ref<'sensors' | 'users' | 'access'>('sensors')

const ROLE_COLS = [
  { id: 'ama', label: 'AMA officer' },
  { id: 'nadmo', label: 'NADMO' },
  { id: 'collector', label: 'Waste collector' },
  { id: 'citizen', label: 'Citizen' },
  { id: 'admin', label: 'Admin' },
] as const
</script>

<template>
  <div class="admin">
    <div class="tabs panel" role="tablist" aria-label="Admin sections">
      <button role="tab" :aria-selected="tab === 'sensors'" @click="tab = 'sensors'">Sensors</button>
      <button role="tab" :aria-selected="tab === 'users'" @click="tab = 'users'">Users</button>
      <button role="tab" :aria-selected="tab === 'access'" @click="tab = 'access'">Roles and access</button>
    </div>

    <div class="body">
      <div class="main">
        <SensorTable v-if="tab === 'sensors'" :hour="hour" />
        <UserTable v-else-if="tab === 'users'" />

        <section v-else class="panel card">
          <h2 class="title">Who can do what</h2>
          <p class="label">
            Least privilege: each role gets only the access its job needs. The backend enforces this; the apps only
            reflect it.
          </p>
          <div class="scroll">
            <table class="matrix">
              <thead>
                <tr>
                  <th />
                  <th v-for="c in ROLE_COLS" :key="c.id">{{ c.label }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in PERMISSIONS" :key="p.label">
                  <th scope="row">{{ p.label }}</th>
                  <td v-for="c in ROLE_COLS" :key="c.id">
                    <span v-if="p.roles[c.id] === true" class="yes" aria-label="Yes" v-html="iconSvg(Check, 16, 2.5)" />
                    <span v-else-if="p.roles[c.id] === false" class="no" aria-label="No" v-html="iconSvg(Minus, 16)" />
                    <span v-else class="partial">{{ p.roles[c.id] }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="label">
            Every user is tied to a zone. No role can see citizen phone numbers; only the SMS service uses them.
          </p>
        </section>
      </div>

      <aside class="panel activity">
        <h2 class="title">Admin activity</h2>
        <p class="label">Recorded for accountability.</p>
        <ol>
          <li v-for="(a, i) in activity" :key="i">
            <span class="mono label">{{ a.time }}</span>
            <span>{{ a.action }}</span>
          </li>
        </ol>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.admin {
  display: grid;
  gap: var(--s4);
}
.tabs {
  display: flex;
  gap: var(--s5);
  padding: 0 var(--s5);
}
.tabs button {
  border: 0;
  background: none;
  padding: var(--s4) 0;
  color: var(--ink-muted);
  border-bottom: 2px solid transparent;
  font-size: 15px;
}
.tabs button[aria-selected='true'] {
  color: var(--ink);
  border-bottom-color: var(--ink);
}
.body {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: var(--s4);
  align-items: start;
}
.main {
  min-width: 0;
}
.card {
  padding: var(--s5);
  display: grid;
  gap: var(--s3);
}
.scroll {
  overflow-x: auto;
}
.matrix {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.matrix th,
.matrix td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--line);
  text-align: center;
}
.matrix thead th {
  font-weight: 500;
}
.matrix th[scope='row'] {
  text-align: left;
  font-weight: 400;
}
.yes,
.no {
  display: inline-grid;
}
.yes :deep(svg),
.no :deep(svg) {
  display: block;
}
.yes {
  color: var(--safe);
}
.no {
  color: var(--line);
}
.partial {
  font-size: 12px;
  color: var(--ink-muted);
}
.activity {
  padding: var(--s5);
  display: grid;
  gap: var(--s2);
}
.activity ol {
  list-style: none;
  margin: var(--s2) 0 0;
  padding: 0;
  display: grid;
  gap: var(--s2);
  font-size: 13px;
}
.activity li {
  display: grid;
  gap: 2px;
  padding-top: var(--s2);
  border-top: 1px solid var(--line);
}
@media (max-width: 1100px) {
  .body {
    grid-template-columns: 1fr;
  }
}
</style>
