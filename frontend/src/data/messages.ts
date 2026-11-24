/*
 * Draft alert messages and audiences for each kind of suggestion.
 * MOCK: in the real system the backend drafts these and knows the
 * subscriber counts. Counts only, never names or phone numbers (Act 843).
 */
import type { Language, Suggestion, ZoneId } from '../types'
import { ZONES } from './mock'

/** Residents and traders subscribed to alerts in each zone (fake numbers). */
const SUBSCRIBERS: Record<ZoneId, number> = { 'east-legon': 860, makola: 1240 }
/** Waste collectors assigned to each zone (fake numbers). */
const COLLECTORS: Record<ZoneId, number> = { 'east-legon': 4, makola: 6 }

const zoneName = (id: ZoneId) => ZONES.find((z) => z.id === id)?.name ?? id

export interface Audience {
  label: string
  count: number
  /** Public alerts go to residents; tasks go to field workers. */
  isPublic: boolean
}

export function audienceFor(s: Suggestion, scope: 'zone' | 'all'): Audience {
  const zones = scope === 'all' ? ZONES.map((z) => z.id) : [s.zoneId]
  if (s.kind === 'waste') {
    return { label: 'Waste collectors', count: zones.reduce((n, z) => n + COLLECTORS[z], 0), isPublic: false }
  }
  return { label: 'Residents and traders', count: zones.reduce((n, z) => n + SUBSCRIBERS[z], 0), isPublic: true }
}

export function draftMessage(s: Suggestion): string {
  const zone = zoneName(s.zoneId)
  switch (s.kind) {
    case 'flood':
      return s.severity === 'danger'
        ? `AMA FLOOD ALERT: High flood risk in ${zone} now. Drains are nearly full. Avoid low roads and drains. Move goods off the ground.`
        : `AMA FLOOD WATCH: Drains in ${zone} are rising after heavy rain. Avoid walking near drains. We will update you.`
    case 'waste':
      return `AMA TASK: ${s.evidence} in ${zone}. Please collect before 18:00. Route is in the app.`
    case 'air':
      return `AMA AIR ADVISORY: Air in ${zone} is unhealthy (PM2.5 ${s.value}). Limit time outdoors, do not burn waste, wear a mask if you can.`
  }
}

export const LANGUAGES: { id: Language; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'tw', label: 'Twi' },
  { id: 'ga', label: 'Ga' },
]

/** One SMS holds 160 plain characters; longer messages are split into 153-character parts. */
export function smsParts(text: string): number {
  if (text.length === 0) return 0
  return text.length <= 160 ? 1 : Math.ceil(text.length / 153)
}
