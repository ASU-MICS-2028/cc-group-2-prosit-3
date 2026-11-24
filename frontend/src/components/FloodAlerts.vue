<script setup lang="ts">
import { computed } from 'vue'
import { CloudRain, Check } from 'lucide'
import { ZONES } from '../data/mock'
import { acknowledge, nadmoAlerts } from '../stores/approvals'
import { iconSvg } from '../lib/icon'
import StatusChip from './StatusChip.vue'

/*
 * NADMO's alert list (brief §7.3). NADMO sees flood alerts that AMA copied to
 * them, plus any that escalated because nobody reviewed them in time.
 * NADMO can acknowledge, but cannot approve, edit or send.
 */
const alerts = computed(() => nadmoAlerts())
const zoneName = (id: string) => ZONES.find((z) => z.id === id)?.name
</script>

<template>
  <section class="card panel">
    <header>
      <h2 class="title">Flood alerts for NADMO</h2>
      <span class="count">{{ alerts.filter((a) => !a.acknowledgedAt).length }} new</span>
    </header>

    <div v-if="!alerts.length" class="empty">
      <p>No flood alerts have been sent to NADMO yet.</p>
      <p class="label">
        Alerts appear here when an AMA officer sends a flood alert with “Copy to NADMO”, or when an
        “act now” suggestion is not reviewed within 10 minutes.
      </p>
    </div>

    <ul v-else>
      <li v-for="a in alerts" :key="a.id" :data-ack="!!a.acknowledgedAt">
        <span class="ic" :data-sev="a.severity" v-html="iconSvg(CloudRain, 16)" />
        <div class="body">
          <div class="row">
            <span class="t">{{ a.title }}</span>
            <StatusChip :status="a.severity" />
            <span class="state">{{ a.state === 'expired' ? 'Escalated: not yet approved by AMA' : `Sent by AMA at ${a.sentAt}` }}</span>
          </div>
          <p class="msg">“{{ a.messages.en }}”</p>
          <p class="label">
            {{ a.scope === 'all' ? 'All pilot zones' : zoneName(a.zoneId) }}
            <template v-if="a.delivery"> · reached {{ a.delivery.delivered.toLocaleString() }} people</template>
          </p>
        </div>
        <button v-if="!a.acknowledgedAt" class="ack" @click="acknowledge(a)">Acknowledge</button>
        <span v-else class="done"><span v-html="iconSvg(Check, 14, 2.5)" /> Acknowledged {{ a.acknowledgedAt }}</span>
      </li>
    </ul>

    <p class="label foot">Read-only. Only AMA officers can approve, edit or send alerts.</p>
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
.empty {
  display: grid;
  gap: 4px;
  padding: var(--s3);
  border-radius: var(--r-card);
  background: var(--canvas);
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
li[data-ack='true'] {
  opacity: 0.65;
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
.ic :deep(svg),
.done :deep(svg) {
  display: block;
}
.body {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 2px;
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
  color: var(--ink-muted);
}
.msg {
  font-size: 13px;
}
.ack {
  border: 0;
  background: var(--ink);
  color: var(--surface);
  border-radius: var(--r-pill);
  padding: 8px 16px;
  white-space: nowrap;
}
.done {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--safe);
  white-space: nowrap;
}
.foot {
  margin-top: auto;
}
</style>
