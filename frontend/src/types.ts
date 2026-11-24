export type Status = 'safe' | 'watch' | 'danger' | 'offline'

export type SensorType = 'drain' | 'bin' | 'air'

export type ZoneId = 'east-legon' | 'makola'

export interface Zone {
  id: ZoneId
  name: string
  kind: string
  /** Outline of the pilot zone as [lat, lng] points. */
  outline: [number, number][]
}

export interface Sensor {
  id: string
  type: SensorType
  zoneId: ZoneId
  /** Place name, e.g. "Lagos Ave culvert". */
  place: string
  lat: number
  lng: number
  /** Battery in percent. */
  battery: number
  /** Minutes since the sensor last reported. Large = offline. */
  lastSeenMin: number
  /** Per-sensor tuning used by the fake data generator. */
  base: number
  factor: number
}

export interface Reading {
  sensor: Sensor
  /** null when the sensor is offline. */
  value: number | null
  unit: string
  threshold: number
  status: Status
}

export type SuggestionKind = 'flood' | 'waste' | 'air'

export type Severity = Exclude<Status, 'safe' | 'offline'>

export interface Suggestion {
  id: string
  kind: SuggestionKind
  zoneId: ZoneId
  title: string
  evidence: string
  severity: Severity
  /** The sensor whose reading triggered this suggestion. */
  triggerSensorId: string
  value: number
  limit: number
  unit: string
  /** Which model or rule produced it. */
  source: string
  /** Minutes since the suggestion was created. */
  createdMinAgo: number
}

/* ---------- Approval workflow (design brief §8) ---------- */

export type ReviewState = 'suggested' | 'in-review' | 'edited' | 'waiting-second' | 'sent' | 'rejected' | 'expired'

export type Language = 'en' | 'tw' | 'ga'

export interface AuditEntry {
  time: string
  who: string
  action: string
  detail?: string
}

export interface Delivery {
  total: number
  delivered: number
  failed: number
}

export interface Review {
  id: string
  state: ReviewState
  severity: Severity
  messages: Record<Language, string>
  originalMessage: string
  scope: 'zone' | 'all'
  channels: { sms: boolean; app: boolean }
  copyNadmo: boolean
  rejectReason?: string
  /** Time (ms) when an unreviewed "act now" suggestion escalates. */
  expiresAt?: number
  log: AuditEntry[]
  delivery?: Delivery
}
