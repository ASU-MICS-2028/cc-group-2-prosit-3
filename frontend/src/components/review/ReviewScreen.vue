<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ArrowLeft, Check, Timer } from 'lucide'
import type { Suggestion } from '../../types'
import { ZONES } from '../../data/mock'
import { audienceFor, LANGUAGES } from '../../data/messages'
import {
  approve,
  markExpired,
  openReview,
  reject,
  reviewFor,
  secondApprove,
  startEdit,
} from '../../stores/approvals'
import { iconSvg } from '../../lib/icon'
import StatusChip from '../StatusChip.vue'
import ReviewEvidence from './ReviewEvidence.vue'
import ReviewMessage from './ReviewMessage.vue'
import ReviewRecipients from './ReviewRecipients.vue'

/* Alert approval screen: design brief §8. */
const props = defineProps<{ s: Suggestion; hour: number }>()
const emit = defineEmits<{ back: [] }>()

const r = reviewFor(props.s)
onMounted(() => openReview(props.s))

const zone = computed(() => ZONES.find((z) => z.id === props.s.zoneId)!)
const audience = computed(() => audienceFor(props.s, r.scope))

/* ---------- State ---------- */
const editing = computed(() => r.state === 'edited' || (r.state === 'expired' && editRequested.value))
const editRequested = ref(false)
const decided = computed(() => r.state === 'sent' || r.state === 'rejected')
const locked = computed(() => decided.value || r.state === 'waiting-second')

const STEPS = ['Suggested', 'In review', 'Approved', 'Sent'] as const
const stepIndex = computed(() => {
  switch (r.state) {
    case 'suggested':
      return 0
    case 'in-review':
    case 'edited':
    case 'expired':
      return 1
    case 'waiting-second':
      return 2
    case 'sent':
      return 3
    case 'rejected':
      return 1
  }
})

/* ---------- Escalation countdown (act-now alerts only) ---------- */
const now = ref(Date.now())
let tick: number | undefined
onMounted(() => {
  tick = window.setInterval(() => {
    now.value = Date.now()
    if (r.expiresAt && now.value >= r.expiresAt) markExpired(r)
  }, 1000)
})
onBeforeUnmount(() => window.clearInterval(tick))
const remaining = computed(() => {
  if (!r.expiresAt || locked.value || r.state === 'expired') return null
  const ms = Math.max(0, r.expiresAt - now.value)
  const m = Math.floor(ms / 60_000)
  const sec = Math.floor((ms % 60_000) / 1000)
  return `${m}:${String(sec).padStart(2, '0')}`
})

/* ---------- Actions ---------- */
function onEdit() {
  editRequested.value = true
  startEdit(r)
}

const canApprove = computed(
  () => !locked.value && r.messages.en.trim().length > 0 && (r.channels.sms || r.channels.app),
)

const confirmOpen = ref(false)
const missingLanguages = computed(() => LANGUAGES.filter((l) => l.id !== 'en' && !r.messages[l.id].trim()))
const channelText = computed(() => [r.channels.sms && 'SMS', r.channels.app && 'app'].filter(Boolean).join(' and '))

function confirmSend() {
  confirmOpen.value = false
  approve(r, props.s)
}

const rejectOpen = ref(false)
const REASONS = [
  'False reading or faulty sensor',
  'Already handled',
  'Wrong zone',
  'Not serious enough to alert',
  'Other',
]
const reason = ref('')
const reasonNote = ref('')
const canReject = computed(() => reason.value && (reason.value !== 'Other' || reasonNote.value.trim()))
function confirmReject() {
  const text = reason.value === 'Other' ? reasonNote.value.trim() : reason.value + (reasonNote.value.trim() ? ` (${reasonNote.value.trim()})` : '')
  rejectOpen.value = false
  reject(r, text)
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    confirmOpen.value = false
    rejectOpen.value = false
  }
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

const deliveredPct = computed(() => (r.delivery ? (r.delivery.delivered / r.delivery.total) * 100 : 0))
const failedPct = computed(() => (r.delivery ? (r.delivery.failed / r.delivery.total) * 100 : 0))
</script>

<template>
  <div class="review">
    <!-- Top bar -->
    <div class="top panel">
      <button class="back" @click="emit('back')">
        <span v-html="iconSvg(ArrowLeft, 16)" /> Dashboard
      </button>
      <div class="heading">
        <div class="title-row">
          <h2>{{ s.title }}</h2>
          <StatusChip :status="r.severity" />
        </div>
        <p class="label">{{ zone.name }} · {{ s.source }} · suggested {{ s.createdMinAgo }} min ago</p>
      </div>

      <ol class="steps" aria-label="Approval progress">
        <li
          v-for="(step, i) in STEPS"
          :key="step"
          :class="{ done: i < stepIndex || r.state === 'sent', current: i === stepIndex && r.state !== 'sent' }"
        >
          <span class="dot"><span v-if="i < stepIndex || r.state === 'sent'" v-html="iconSvg(Check, 12, 2.5)" /></span>
          {{ step === 'Approved' && r.state === 'waiting-second' ? 'Approved 1 of 2' : step }}
        </li>
        <li v-if="r.state === 'rejected'" class="rejected"><span class="dot" />Rejected</li>
      </ol>

      <div v-if="remaining" class="countdown" role="timer">
        <span v-html="iconSvg(Timer, 16)" />
        Escalates in <b>{{ remaining }}</b>
      </div>
      <div v-else-if="r.state === 'expired'" class="countdown late">
        <span v-html="iconSvg(Timer, 16)" /> Escalated to a second officer and NADMO
      </div>
    </div>

    <p v-if="!decided" class="lock label">You are reviewing this. Other officers see “Being reviewed by AMA Officer”.</p>

    <!-- Three columns -->
    <div class="cols">
      <ReviewEvidence :s="s" :hour="hour" />
      <ReviewMessage :r="r" :editing="editing" :locked="locked" />
      <ReviewRecipients :s="s" :r="r" :locked="locked" />
    </div>

    <!-- Outcome -->
    <section v-if="r.state === 'sent' && r.delivery" class="outcome panel">
      <div>
        <h3 class="title">Sent to {{ r.delivery.total.toLocaleString() }} {{ audience.label.toLowerCase() }}</h3>
        <p class="label">Delivery is simulated. Real SMS sending is added in week 3.</p>
      </div>
      <div class="delivery">
        <div class="bar">
          <span class="ok" :style="{ width: `${deliveredPct}%` }" />
          <span class="fail" :style="{ width: `${failedPct}%` }" />
        </div>
        <div class="legend">
          <span><i class="ok" /> Delivered {{ r.delivery.delivered.toLocaleString() }}</span>
          <span><i class="fail" /> Failed {{ r.delivery.failed }}</span>
          <span><i /> Pending {{ (r.delivery.total - r.delivery.delivered - r.delivery.failed).toLocaleString() }}</span>
        </div>
      </div>
    </section>
    <section v-else-if="r.state === 'rejected'" class="outcome panel">
      <div>
        <h3 class="title">Rejected: nothing was sent</h3>
        <p class="label">Reason: {{ r.rejectReason }}. This feedback goes to the ML team.</p>
      </div>
    </section>
    <section v-else-if="r.state === 'waiting-second'" class="outcome panel">
      <div>
        <h3 class="title">Waiting for a second officer</h3>
        <p class="label">This alert covers more than one zone, so two officers must approve it.</p>
      </div>
      <button class="btn outline" @click="secondApprove(r, s)">Simulate second officer's approval</button>
    </section>

    <!-- Actions -->
    <div v-if="!locked" class="actions panel">
      <p class="label">
        Nothing is sent until you approve. Every action is recorded in the audit log below.
      </p>
      <div class="buttons">
        <button class="btn outline" @click="rejectOpen = true">Reject</button>
        <button class="btn outline" :disabled="editing" @click="onEdit">{{ editing ? 'Editing' : 'Edit' }}</button>
        <button class="btn primary" :disabled="!canApprove" @click="confirmOpen = true">
          {{ r.scope === 'all' ? 'Approve (1 of 2)' : 'Approve and send' }}
        </button>
      </div>
    </div>

    <!-- Audit log -->
    <section class="audit panel">
      <h3 class="title">Audit log</h3>
      <p class="label">Who did what and when. In the real system this cannot be edited or deleted.</p>
      <ol>
        <li v-for="(e, i) in r.log" :key="i">
          <span class="mono time">{{ e.time }}</span>
          <span class="who">{{ e.who }}</span>
          <span><b>{{ e.action }}</b><template v-if="e.detail"> · {{ e.detail }}</template></span>
        </li>
      </ol>
    </section>

    <!-- Confirm send -->
    <div v-if="confirmOpen" class="scrim" @click.self="confirmOpen = false">
      <div class="dialog panel" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <h3 id="confirm-title" class="title">
          {{ r.scope === 'all' ? 'Approve this alert?' : 'Send this alert now?' }}
        </h3>
        <p>
          To <b>{{ audience.count.toLocaleString() }} {{ audience.label.toLowerCase() }}</b> in
          {{ r.scope === 'all' ? 'all pilot zones' : zone.name }} by <b>{{ channelText }}</b>.
        </p>
        <ul class="checks">
          <li>Severity: <StatusChip :status="r.severity" /></li>
          <li v-if="r.copyNadmo && audience.isPublic">NADMO will get a copy.</li>
          <li v-if="missingLanguages.length">
            No {{ missingLanguages.map((l) => l.label).join(' or ') }} text, so English only is sent.
          </li>
          <li v-if="r.scope === 'all'">A second officer must also approve before it is sent.</li>
        </ul>
        <div class="buttons">
          <button class="btn outline" @click="confirmOpen = false">Cancel</button>
          <button class="btn primary" @click="confirmSend">{{ r.scope === 'all' ? 'Approve' : 'Send now' }}</button>
        </div>
      </div>
    </div>

    <!-- Reject -->
    <div v-if="rejectOpen" class="scrim" @click.self="rejectOpen = false">
      <div class="dialog panel" role="dialog" aria-modal="true" aria-labelledby="reject-title">
        <h3 id="reject-title" class="title">Why are you rejecting this?</h3>
        <p class="label">A reason is required. It helps the ML team improve the model.</p>
        <fieldset>
          <label v-for="x in REASONS" :key="x"><input v-model="reason" type="radio" name="reason" :value="x" /> {{ x }}</label>
        </fieldset>
        <textarea
          v-model="reasonNote"
          rows="2"
          :placeholder="reason === 'Other' ? 'Describe the reason (required)' : 'Add a note (optional)'"
          aria-label="Note"
        />
        <div class="buttons">
          <button class="btn outline" @click="rejectOpen = false">Cancel</button>
          <button class="btn danger" :disabled="!canReject" @click="confirmReject">Reject suggestion</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.review {
  display: flex;
  flex-direction: column;
  gap: var(--s4);
}
.top {
  display: flex;
  align-items: center;
  gap: var(--s5);
  padding: var(--s4) var(--s5);
  flex-wrap: wrap;
}
.back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 0;
  background: var(--canvas);
  border-radius: var(--r-pill);
  padding: 8px 14px;
}
.back :deep(svg) {
  display: block;
}
.heading {
  flex: 1;
  min-width: 240px;
}
.title-row {
  display: flex;
  align-items: center;
  gap: var(--s3);
  flex-wrap: wrap;
}
h2 {
  font-size: 22px;
  font-weight: 500;
}
.steps {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  gap: var(--s4);
  font-size: 13px;
  color: var(--ink-muted);
}
.steps li {
  display: flex;
  align-items: center;
  gap: 6px;
}
.steps .dot {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1.5px solid var(--line);
  display: grid;
  place-items: center;
}
.steps .done {
  color: var(--ink);
}
.steps .done .dot {
  background: var(--ink);
  border-color: var(--ink);
  color: var(--surface);
}
.steps .current {
  color: var(--ink);
  font-weight: 500;
}
.steps .current .dot {
  border-color: var(--ink);
  box-shadow: inset 0 0 0 4px var(--surface), inset 0 0 0 9px var(--ink);
}
.steps .rejected {
  color: var(--danger);
  font-weight: 500;
}
.steps .rejected .dot {
  background: var(--danger);
  border-color: var(--danger);
}
.steps :deep(svg) {
  display: block;
}
.countdown {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: var(--r-pill);
  background: var(--danger-tint);
  color: var(--danger);
  font-size: 13px;
}
.countdown b {
  font-family: var(--font-mono);
}
.countdown :deep(svg) {
  display: block;
}
.lock {
  margin: -4px 0 0 var(--s2);
}
.cols {
  display: grid;
  grid-template-columns: 1.15fr 1fr 0.9fr;
  gap: var(--s4);
  align-items: stretch;
}
.actions,
.outcome {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s4);
  padding: var(--s4) var(--s5);
  flex-wrap: wrap;
}
.actions {
  position: sticky;
  bottom: var(--s4);
  box-shadow: 0 0 0 1px var(--line);
  z-index: 600;
}
.buttons {
  display: flex;
  gap: var(--s2);
  justify-content: flex-end;
}
.btn {
  border-radius: var(--r-pill);
  padding: 10px 20px;
  border: 1px solid var(--ink);
  background: var(--surface);
}
.btn.primary {
  background: var(--ink);
  color: var(--surface);
}
.btn.danger {
  background: var(--danger);
  border-color: var(--danger);
  color: #fff;
}
.btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.delivery {
  flex: 1;
  max-width: 560px;
  display: grid;
  gap: 6px;
}
.bar {
  display: flex;
  height: 8px;
  border-radius: 4px;
  background: var(--line);
  overflow: hidden;
}
.bar .ok {
  background: var(--safe);
  transition: width 0.3s;
}
.bar .fail {
  background: var(--danger);
  transition: width 0.3s;
}
.legend {
  display: flex;
  gap: var(--s4);
  font-size: 12px;
  color: var(--ink-muted);
}
.legend i {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--line);
  margin-right: 4px;
}
.legend i.ok {
  background: var(--safe);
}
.legend i.fail {
  background: var(--danger);
}
.audit {
  padding: var(--s5);
  display: grid;
  gap: var(--s2);
}
.audit ol {
  list-style: none;
  margin: var(--s2) 0 0;
  padding: 0;
  display: grid;
  gap: var(--s2);
  font-size: 13px;
}
.audit li {
  display: grid;
  grid-template-columns: 56px 190px 1fr;
  gap: var(--s3);
  padding-top: var(--s2);
  border-top: 1px solid var(--line);
}
.time,
.who {
  color: var(--ink-muted);
}
.scrim {
  position: fixed;
  inset: 0;
  background: rgb(17 17 17 / 0.35);
  display: grid;
  place-items: center;
  z-index: 1000;
  padding: var(--s4);
}
.dialog {
  width: min(480px, 100%);
  padding: var(--s5);
  display: grid;
  gap: var(--s3);
}
.checks {
  margin: 0;
  padding-left: 18px;
  display: grid;
  gap: 6px;
  font-size: 13px;
}
fieldset {
  border: 0;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--s2);
}
fieldset label {
  display: flex;
  gap: var(--s2);
  align-items: center;
}
input[type='radio'] {
  accent-color: var(--ink);
}
.dialog textarea {
  font: inherit;
  padding: var(--s2) var(--s3);
  border-radius: var(--r-card);
  border: 1px solid var(--line);
  resize: vertical;
}

@media (max-width: 1100px) {
  .cols {
    grid-template-columns: 1fr;
  }
  .audit li {
    grid-template-columns: 56px 1fr;
  }
  .audit li > :last-child {
    grid-column: 1 / -1;
  }
}
</style>
