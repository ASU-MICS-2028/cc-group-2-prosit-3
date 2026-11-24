/*
 * Approval workflow state (design brief §8), shared by the dashboard and the review screen.
 *
 * MOCK: this lives in the browser only and resets on reload. In the real system
 * every action is written to an audit table in the backend that cannot be edited.
 */
import { reactive } from 'vue'
import type { Review, Severity, Suggestion } from '../types'
import { audienceFor, draftMessage } from '../data/messages'

const OFFICER = 'AMA Officer'
const SECOND_OFFICER = 'AMA Officer 2 (simulated)'
export const ESCALATE_AFTER_MIN = 10

const reviews = reactive<Record<string, Review>>({})

const clock = (minutesAgo = 0) =>
  new Date(Date.now() - minutesAgo * 60_000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

function log(r: Review, who: string, action: string, detail?: string) {
  r.log.push({ time: clock(), who, action, detail })
}

/** Returns the review for a suggestion, creating it the first time. */
export function reviewFor(s: Suggestion): Review {
  if (!reviews[s.id]) {
    const text = draftMessage(s)
    reviews[s.id] = {
      id: s.id,
      title: s.title,
      kind: s.kind,
      zoneId: s.zoneId,
      state: 'suggested',
      severity: s.severity,
      messages: { en: text, tw: '', ga: '' },
      originalMessage: text,
      scope: 'zone',
      channels: { sms: true, app: true },
      // NADMO is copied on flood alerts by default.
      copyNadmo: s.kind === 'flood',
      // Brief §8.1: an "act now" suggestion not decided within 10 minutes escalates.
      expiresAt: s.severity === 'danger' ? Date.now() + (ESCALATE_AFTER_MIN - s.createdMinAgo) * 60_000 : undefined,
      log: [{ time: clock(s.createdMinAgo), who: 'System', action: 'Suggested', detail: `${s.source}: ${s.evidence}` }],
    }
  }
  return reviews[s.id]
}

/** Every review so far (used by the NADMO view and the phone apps). */
export const allReviews = () => Object.values(reviews)

/** Does a sent alert reach this zone? (Its own zone, or "all pilot zones".) */
export const reaches = (r: Review, zoneId: string) => r.scope === 'all' || r.zoneId === zoneId

/** Flood alerts NADMO may see: ones copied to NADMO when sent, and escalated ones. */
export const nadmoAlerts = () =>
  allReviews().filter((r) => r.kind === 'flood' && ((r.state === 'sent' && r.copyNadmo) || r.state === 'expired'))

export function acknowledge(r: Review) {
  if (r.acknowledgedAt) return
  r.acknowledgedAt = clock()
  log(r, 'NADMO Officer', 'Acknowledged', 'NADMO has seen this alert')
}

export function isDecided(id: string): boolean {
  const st = reviews[id]?.state
  return st === 'sent' || st === 'rejected'
}

export function stateOf(id: string) {
  return reviews[id]?.state ?? 'suggested'
}

export function openReview(s: Suggestion) {
  const r = reviewFor(s)
  if (r.state === 'suggested') {
    r.state = 'in-review'
    log(r, OFFICER, 'Opened for review')
  }
}

export function startEdit(r: Review) {
  if (r.state === 'in-review') {
    r.state = 'edited'
    log(r, OFFICER, 'Started editing')
  }
}

export function setSeverity(r: Review, sev: Severity) {
  if (r.severity !== sev) {
    log(r, OFFICER, 'Changed severity', `${r.severity} → ${sev}`)
    r.severity = sev
  }
}

export function setScope(r: Review, scope: 'zone' | 'all') {
  if (r.scope !== scope) {
    log(r, OFFICER, 'Changed area', scope === 'all' ? 'All pilot zones (needs a second officer)' : 'This zone only')
    r.scope = scope
  }
}

export function reject(r: Review, reason: string) {
  r.state = 'rejected'
  r.rejectReason = reason
  log(r, OFFICER, 'Rejected', `${reason}. Sent to the ML team as feedback.`)
}

/** Officer approves. Alerts for more than one zone need a second officer. */
export function approve(r: Review, s: Suggestion) {
  if (r.messages.en !== r.originalMessage) {
    log(r, OFFICER, 'Edited message', `Before: "${r.originalMessage}" · After: "${r.messages.en}"`)
  }
  if (r.scope === 'all') {
    r.state = 'waiting-second'
    log(r, OFFICER, 'Approved (1 of 2)', 'Alert covers more than one zone')
    return
  }
  log(r, OFFICER, 'Approved')
  send(r, s)
}

export function secondApprove(r: Review, s: Suggestion) {
  log(r, SECOND_OFFICER, 'Approved (2 of 2)')
  send(r, s)
}

export function markExpired(r: Review) {
  if (r.state === 'suggested' || r.state === 'in-review' || r.state === 'edited') {
    r.state = 'expired'
    log(r, 'System', 'Escalated', 'Not reviewed within 10 minutes. Sent to a second officer and to NADMO.')
  }
}

/** SIMULATED delivery: counts rise over a few seconds. Real SMS is wired up in week 3. */
function send(r: Review, s: Suggestion) {
  const total = audienceFor(s, r.scope).count
  const channels = [r.channels.sms && 'SMS', r.channels.app && 'app'].filter(Boolean).join(' + ')
  r.state = 'sent'
  r.sentAt = clock()
  r.delivery = { total, delivered: 0, failed: 0 }
  log(r, 'System', 'Sent', `${total.toLocaleString()} recipients by ${channels}${r.copyNadmo ? ' · NADMO copied' : ''}`)

  const failTarget = Math.round(total * 0.015)
  const timer = window.setInterval(() => {
    const d = r.delivery!
    const step = Math.ceil(total / 12)
    d.delivered = Math.min(total - failTarget, d.delivered + step)
    d.failed = Math.min(failTarget, d.failed + Math.ceil(failTarget / 8))
    if (d.delivered + d.failed >= total) {
      window.clearInterval(timer)
      log(r, 'System', 'Delivery report', `${d.delivered.toLocaleString()} delivered · ${d.failed} failed (simulated)`)
    }
  }, 350)
}
