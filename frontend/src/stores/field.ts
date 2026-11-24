/*
 * State for the phone apps: bins a collector has emptied, and citizen reports.
 * MOCK: browser only, resets on reload. The backend will store these later.
 * Citizen reports hold no name or phone number (Act 843).
 */
import { reactive } from 'vue'
import type { ZoneId } from '../types'

const clock = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

/* ---------- Collector ---------- */

/** Sensor id → time it was marked as emptied. */
export const emptied = reactive<Record<string, string>>({})

export function markEmptied(sensorId: string) {
  emptied[sensorId] = clock()
}

/* ---------- Citizen reports ---------- */

export type ReportKind = 'drain' | 'bin' | 'burning'
export type ReportStatus = 'received' | 'assigned' | 'fixed'

export interface CitizenReport {
  ref: string
  kind: ReportKind
  zoneId: ZoneId
  place: string
  note: string
  hasPhoto: boolean
  status: ReportStatus
  created: string
  /** Who the report was passed to, e.g. "Drain crew". */
  assignedTo?: string
}

export const REPORT_KINDS: { id: ReportKind; label: string; team: string }[] = [
  { id: 'drain', label: 'Blocked drain', team: 'Drain crew' },
  { id: 'bin', label: 'Overflowing bin', team: 'Waste collectors' },
  { id: 'burning', label: 'Burning waste', team: 'Environmental health officer' },
]

// Two earlier reports so the list is not empty in the demo (fake data).
export const reports = reactive<CitizenReport[]>([
  {
    ref: 'R-1038',
    kind: 'bin',
    zoneId: 'makola',
    place: 'Kinbu Rd stalls',
    note: 'Bin full since morning',
    hasPhoto: false,
    status: 'fixed',
    created: 'Yesterday',
    assignedTo: 'Waste collectors',
  },
  {
    ref: 'R-1041',
    kind: 'drain',
    zoneId: 'makola',
    place: 'Okaishie main drain',
    note: 'Plastic bottles blocking the grate',
    hasPhoto: true,
    status: 'assigned',
    created: '09:15',
    assignedTo: 'Drain crew',
  },
])

let nextRef = 1042

/** Adds a report. SIMULATED: it is assigned to a team a few seconds later. */
export function submitReport(r: Omit<CitizenReport, 'ref' | 'status' | 'created'>): string {
  const ref = `R-${nextRef++}`
  reports.unshift({ ...r, ref, status: 'received', created: clock() })
  window.setTimeout(() => {
    const item = reports.find((x) => x.ref === ref)
    if (item && item.status === 'received') {
      item.status = 'assigned'
      item.assignedTo = REPORT_KINDS.find((k) => k.id === item.kind)?.team
    }
  }, 6000)
  return ref
}
