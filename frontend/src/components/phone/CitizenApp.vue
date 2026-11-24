<script setup lang="ts">
import { computed, ref } from 'vue'
import { House, Bell, Camera, ClipboardList, ShieldCheck, CircleCheck } from 'lucide'
import type { Status, ZoneId } from '../../types'
import { SENSORS, ZONES, floodRiskAt, readingsAt } from '../../data/mock'
import { statusFor } from '../../lib/status'
import { iconSvg } from '../../lib/icon'
import { allReviews, reaches } from '../../stores/approvals'
import { REPORT_KINDS, reports, submitReport, type ReportKind } from '../../stores/field'
import StatusChip from '../StatusChip.vue'
import BottomNav from './BottomNav.vue'

/* Citizen app (brief §7.5). A market trader in Makola. No login name or phone number shown. */
const props = defineProps<{ hour: number }>()

const ZONE: ZoneId = 'makola'
const zone = ZONES.find((z) => z.id === ZONE)!
const tab = ref('home')

/* ---------- Home: plain-language status ---------- */
const risk = computed(() => floodRiskAt(ZONE, props.hour))
const riskStatus = computed(() => statusFor('flood', risk.value))
const pm = computed(() => {
  const v = readingsAt(props.hour)
    .filter((r) => r.sensor.zoneId === ZONE && r.sensor.type === 'air' && r.value !== null)
    .map((r) => r.value as number)
  return v.length ? Math.max(...v) : null
})
const pmStatus = computed(() => statusFor('air', pm.value))

const FLOOD_ADVICE: Record<Status, string> = {
  danger: 'Flooding is likely. Avoid low roads and drains. Move goods off the ground.',
  watch: 'Drains are rising. Stay alert and keep away from open drains.',
  safe: 'No flood risk right now.',
  offline: 'No data right now.',
}
const AIR_ADVICE: Record<Status, string> = {
  danger: 'Air is unhealthy. Limit time outdoors and do not burn waste.',
  watch: 'Air is not clean. Children, older people and people with asthma should limit time outdoors.',
  safe: 'Air is clean.',
  offline: 'No data right now.',
}

/* ---------- Alerts: only public alerts AMA has approved and sent ---------- */
const alerts = computed(() =>
  allReviews()
    .filter((r) => r.kind !== 'waste' && r.state === 'sent' && reaches(r, ZONE))
    .reverse(),
)

/* ---------- Report a problem ---------- */
const places = SENSORS.filter((s) => s.zoneId === ZONE).map((s) => s.place)
const kind = ref<ReportKind | ''>('')
const place = ref('')
const note = ref('')
const photoName = ref('')
const lastRef = ref('')
const canSubmit = computed(() => kind.value && place.value)

function onPhoto(e: Event) {
  photoName.value = (e.target as HTMLInputElement).files?.[0]?.name ?? ''
}
function submit() {
  if (!kind.value || !place.value) return
  lastRef.value = submitReport({
    kind: kind.value,
    zoneId: ZONE,
    place: place.value,
    note: note.value.trim(),
    hasPhoto: !!photoName.value,
  })
  kind.value = ''
  place.value = ''
  note.value = ''
  photoName.value = ''
  tab.value = 'reports'
}

const STEPS = ['received', 'assigned', 'fixed'] as const
const STEP_LABEL = { received: 'Received', assigned: 'Assigned', fixed: 'Fixed' }
const kindLabel = (k: ReportKind) => REPORT_KINDS.find((x) => x.id === k)?.label

const tabs = computed(() => [
  { id: 'home', label: 'Home', icon: House },
  { id: 'alerts', label: 'Alerts', icon: Bell, badge: alerts.value.length },
  { id: 'report', label: 'Report', icon: Camera },
  { id: 'reports', label: 'My reports', icon: ClipboardList },
])
const TITLES: Record<string, string> = { home: zone.name, alerts: 'Alerts', report: 'Report a problem', reports: 'My reports' }
</script>

<template>
  <header class="app-head">
    <p class="label">{{ tab === 'home' ? 'Market trader · your zone' : zone.name }}</p>
    <h1>{{ TITLES[tab] }}</h1>
  </header>

  <main class="content">
    <!-- Home -->
    <template v-if="tab === 'home'">
      <button v-if="alerts.length" class="latest" @click="tab = 'alerts'">
        <span v-html="iconSvg(Bell, 18)" />
        <div>
          <b>New alert · {{ alerts[0].sentAt }}</b>
          <p>{{ alerts[0].messages.en }}</p>
        </div>
      </button>

      <section class="card">
        <p class="label">Flood risk</p>
        <div class="hero">
          <span class="num">{{ risk }}</span>
          <StatusChip :status="riskStatus" />
        </div>
        <p class="advice">{{ FLOOD_ADVICE[riskStatus] }}</p>
      </section>

      <section class="card">
        <p class="label">Air quality (PM2.5)</p>
        <div class="hero">
          <span class="num">{{ pm ?? '—' }}</span><span class="unit">µg/m³</span>
          <StatusChip :status="pmStatus" />
        </div>
        <p class="advice">{{ AIR_ADVICE[pmStatus] }}</p>
      </section>

      <button class="cta" @click="tab = 'report'">
        <span v-html="iconSvg(Camera, 20)" /> Report a blocked drain or full bin
      </button>
      <p class="label center">Readings are simulated for this prototype.</p>
    </template>

    <!-- Alerts -->
    <template v-else-if="tab === 'alerts'">
      <p v-if="!alerts.length" class="empty">
        No alerts right now.<br />Alerts also come by SMS, so basic phones get them too.
      </p>
      <ul v-else class="list">
        <li v-for="a in alerts" :key="a.id" class="alert">
          <div class="row">
            <StatusChip :status="a.severity" />
            <span class="label">{{ a.sentAt }} · from AMA</span>
          </div>
          <p>{{ a.messages.en }}</p>
        </li>
      </ul>
    </template>

    <!-- Report a problem -->
    <form v-else-if="tab === 'report'" class="form" @submit.prevent="submit">
      <fieldset>
        <legend>What is the problem?</legend>
        <div class="kinds">
          <label v-for="k in REPORT_KINDS" :key="k.id" :data-on="kind === k.id">
            <input v-model="kind" type="radio" name="kind" :value="k.id" />
            {{ k.label }}
          </label>
        </div>
      </fieldset>

      <label class="field">
        <span>Where?</span>
        <select v-model="place" required>
          <option value="" disabled>Choose a nearby place</option>
          <option v-for="p in places" :key="p" :value="p">{{ p }}</option>
        </select>
      </label>

      <label class="field">
        <span>Details <span class="label">(optional)</span></span>
        <textarea v-model="note" rows="3" placeholder="e.g. Plastic is blocking the drain" />
      </label>

      <label class="field photo">
        <span>Photo <span class="label">(optional)</span></span>
        <input type="file" accept="image/*" capture="environment" @change="onPhoto" />
        <span class="label">{{ photoName || 'In this prototype, photos stay on your phone and are not uploaded.' }}</span>
      </label>

      <p class="privacy">
        <span v-html="iconSvg(ShieldCheck, 16)" />
        No name or phone number needed. Reports are anonymous.
      </p>

      <button class="cta" type="submit" :disabled="!canSubmit">Send report</button>
    </form>

    <!-- My reports -->
    <template v-else>
      <p v-if="lastRef" class="sent">
        <span v-html="iconSvg(CircleCheck, 18)" /> Report {{ lastRef }} sent. Thank you.
      </p>
      <ul class="list">
        <li v-for="r in reports" :key="r.ref" class="report">
          <div class="row">
            <b>{{ kindLabel(r.kind) }}</b>
            <span class="mono">{{ r.ref }}</span>
          </div>
          <p class="label">{{ r.place }} · {{ r.created }}</p>
          <p v-if="r.note">{{ r.note }}</p>
          <ol class="track" :aria-label="`Status: ${STEP_LABEL[r.status]}`">
            <li v-for="st in STEPS" :key="st" :data-on="STEPS.indexOf(st) <= STEPS.indexOf(r.status)">
              <span class="dot" />{{ STEP_LABEL[st] }}
            </li>
          </ol>
          <p v-if="r.assignedTo && r.status !== 'received'" class="label">Passed to: {{ r.assignedTo }}</p>
        </li>
      </ul>
    </template>
  </main>

  <BottomNav v-model="tab" :tabs="tabs" />
</template>

<style scoped>
.app-head {
  padding: 40px 20px 12px;
  background: var(--surface);
}
h1 {
  font-size: 26px;
  font-weight: 500;
}
.content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.card {
  background: var(--surface);
  border-radius: 16px;
  padding: 16px;
  display: grid;
  gap: 6px;
}
.hero {
  display: flex;
  align-items: center;
  gap: 8px;
}
.num {
  font-size: 52px;
  font-weight: 300;
  line-height: 1;
}
.unit {
  color: var(--ink-muted);
  font-size: 14px;
  margin-right: 4px;
}
.advice {
  font-size: 16px;
}
.latest {
  display: flex;
  gap: 10px;
  text-align: left;
  border: 0;
  padding: 14px;
  border-radius: 16px;
  background: var(--danger);
  color: #fff;
  font-size: 15px;
}
.latest :deep(svg),
.cta :deep(svg),
.privacy :deep(svg),
.sent :deep(svg) {
  display: block;
  flex: none;
}
.latest p {
  margin-top: 4px;
}
.cta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 0;
  background: var(--ink);
  color: var(--surface);
  border-radius: var(--r-pill);
  padding: 16px;
  font-size: 16px;
  font-weight: 500;
}
.cta:disabled {
  opacity: 0.35;
}
.center {
  text-align: center;
}
.empty {
  color: var(--ink-muted);
  text-align: center;
  padding: 40px 0;
}
.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 10px;
}
.alert,
.report {
  background: var(--surface);
  border-radius: 16px;
  padding: 16px;
  display: grid;
  gap: 8px;
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.form {
  display: grid;
  gap: 16px;
}
fieldset {
  border: 0;
  padding: 0;
  margin: 0;
}
legend {
  font-weight: 500;
  margin-bottom: 8px;
}
.kinds {
  display: grid;
  gap: 8px;
}
.kinds label {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 14px;
  background: var(--surface);
  border: 1.5px solid transparent;
}
.kinds label[data-on='true'] {
  border-color: var(--ink);
}
.kinds input {
  accent-color: var(--ink);
  width: 18px;
  height: 18px;
}
.field {
  display: grid;
  gap: 6px;
}
.field > span:first-child {
  font-weight: 500;
}
select,
textarea {
  font: inherit;
  font-size: 16px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--ink);
}
.photo input {
  font-size: 14px;
}
.privacy {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 14px;
  color: var(--ink-muted);
}
.sent {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--safe-tint);
  color: var(--safe);
}
.track {
  list-style: none;
  margin: 4px 0 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  font-size: 13px;
  color: var(--ink-muted);
}
.track li {
  display: grid;
  gap: 6px;
}
.track .dot {
  height: 4px;
  border-radius: 2px;
  background: var(--line);
}
.track li[data-on='true'] {
  color: var(--ink);
}
.track li[data-on='true'] .dot {
  background: var(--safe);
}
</style>
