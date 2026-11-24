<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Status } from '../../types'
import {
  ROLE_LABEL,
  ZONE_LABEL,
  inviteUser,
  setStatus,
  users,
  type AccountStatus,
  type StaffRole,
  type ZoneScope,
} from '../../stores/admin'
import StatusChip from '../StatusChip.vue'

/* Staff accounts (brief §7.6). Citizens are not listed: they stay anonymous. */
const STATUS_CHIP: Record<AccountStatus, { status: Status; label: string }> = {
  active: { status: 'safe', label: 'Active' },
  invited: { status: 'watch', label: 'Invited' },
  suspended: { status: 'offline', label: 'Suspended' },
}
// Roles that can approve alerts or manage the system must use MFA.
const needsMfa = (r: StaffRole) => r !== 'collector'

const RANK: Record<AccountStatus, number> = { invited: 0, suspended: 1, active: 2 }
const rows = computed(() => [...users].sort((a, b) => RANK[a.status] - RANK[b.status] || a.id.localeCompare(b.id)))

/* Invite form */
const name = ref('')
const role = ref<StaffRole>('collector')
const zone = ref<ZoneScope>('makola')
// Field workers are tied to one zone. Officers and admins cover all zones.
watch(role, (r) => (zone.value = r === 'collector' ? 'makola' : 'all'))
const zoneChoices = computed<ZoneScope[]>(() => (role.value === 'collector' ? ['makola', 'east-legon'] : ['all']))
const canInvite = computed(() => name.value.trim().length >= 3)
function invite() {
  if (!canInvite.value) return
  inviteUser(name.value.trim(), role.value, zone.value)
  name.value = ''
}
</script>

<template>
  <div class="grid">
    <section class="panel card">
      <h2 class="title">Staff accounts</h2>
      <div class="scroll">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Zone</th>
              <th>Status</th>
              <th>MFA</th>
              <th>Last active</th>
              <th><span class="sr">Action</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in rows" :key="u.id">
              <td>
                {{ u.name }}
                <div class="mono label">{{ u.id }}</div>
              </td>
              <td>{{ ROLE_LABEL[u.role] }}</td>
              <td>{{ ZONE_LABEL[u.zone] }}</td>
              <td><StatusChip :status="STATUS_CHIP[u.status].status" :label="STATUS_CHIP[u.status].label" /></td>
              <td>
                <span v-if="u.mfa">On</span>
                <span v-else-if="needsMfa(u.role)" class="warn">Off: required for this role</span>
                <span v-else class="label">Off</span>
              </td>
              <td>{{ u.lastActive }}</td>
              <td class="act">
                <button v-if="u.status === 'active' && u.role !== 'admin'" class="small" @click="setStatus(u, 'suspended')">
                  Suspend
                </button>
                <button v-else-if="u.status === 'suspended'" class="small" @click="setStatus(u, 'active')">Reactivate</button>
                <span v-else-if="u.status === 'invited'" class="label">Waiting for sign-up</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="label">
        Citizens are not listed. They use the app anonymously or subscribe to SMS. Their phone numbers are stored
        encrypted in the backend and are never shown here (Act 843).
      </p>
    </section>

    <form class="panel card invite" @submit.prevent="invite">
      <h2 class="title">Invite a staff member</h2>
      <label>
        <span class="label">Name or team label</span>
        <input v-model="name" placeholder="e.g. Team Makola 3" />
      </label>
      <label>
        <span class="label">Role</span>
        <select v-model="role">
          <option v-for="(label, id) in ROLE_LABEL" :key="id" :value="id">{{ label }}</option>
        </select>
      </label>
      <label>
        <span class="label">Zone</span>
        <select v-model="zone">
          <option v-for="z in zoneChoices" :key="z" :value="z">{{ ZONE_LABEL[z] }}</option>
        </select>
      </label>
      <p class="label">
        {{ role === 'collector' ? 'Field workers are tied to one zone.' : 'Officers and admins must turn on MFA at first sign-in.' }}
      </p>
      <button class="primary" type="submit" :disabled="!canInvite">Send invite</button>
      <p class="label">In the real system this creates a Cognito account and sends a sign-up link.</p>
    </form>
  </div>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: var(--s4);
  align-items: start;
}
.card {
  padding: var(--s5);
  display: grid;
  gap: var(--s3);
  min-width: 0;
}
.scroll {
  overflow-x: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
th {
  text-align: left;
  font-weight: 400;
  color: var(--ink-muted);
  font-size: 12px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--line);
  white-space: nowrap;
}
td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--line);
}
.warn {
  color: var(--danger);
}
.act {
  text-align: right;
  white-space: nowrap;
}
.small {
  border: 1px solid var(--line);
  background: var(--surface);
  border-radius: var(--r-pill);
  padding: 6px 12px;
  font-size: 12px;
}
.invite label {
  display: grid;
  gap: 4px;
}
input,
select {
  font: inherit;
  padding: 10px 12px;
  border-radius: var(--r-card);
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--ink);
}
.primary {
  border: 0;
  background: var(--ink);
  color: var(--surface);
  border-radius: var(--r-pill);
  padding: 10px 16px;
}
.primary:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
@media (max-width: 1100px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
