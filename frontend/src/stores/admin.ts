/*
 * Admin state: staff accounts, sensors sent for maintenance, and an activity log.
 * MOCK: browser only, resets on reload. In the real system accounts live in
 * Cognito (AWS login service) and sensors are registered in AWS IoT Core.
 *
 * All accounts are FAKE and use role labels, not real names (the repo is public).
 * Citizens are not listed: they use the app anonymously or subscribe to SMS.
 */
import { reactive } from 'vue'
import type { ZoneId } from '../types'

export type StaffRole = 'ama' | 'nadmo' | 'collector' | 'admin'
export type AccountStatus = 'active' | 'suspended' | 'invited'
export type ZoneScope = ZoneId | 'all'

export interface StaffUser {
  id: string
  name: string
  role: StaffRole
  zone: ZoneScope
  status: AccountStatus
  mfa: boolean
  lastActive: string
}

export const ROLE_LABEL: Record<StaffRole, string> = {
  ama: 'AMA officer',
  nadmo: 'NADMO officer',
  collector: 'Waste collector',
  admin: 'System admin',
}

export const ZONE_LABEL: Record<ZoneScope, string> = {
  all: 'All zones',
  'east-legon': 'East Legon',
  makola: 'Makola Market',
}

export const users = reactive<StaffUser[]>([
  { id: 'U-01', name: 'AMA Officer 1', role: 'ama', zone: 'all', status: 'active', mfa: true, lastActive: 'Now' },
  { id: 'U-02', name: 'AMA Officer 2', role: 'ama', zone: 'all', status: 'active', mfa: true, lastActive: '12 min ago' },
  { id: 'U-03', name: 'NADMO Officer 1', role: 'nadmo', zone: 'all', status: 'active', mfa: true, lastActive: '1 h ago' },
  { id: 'U-04', name: 'NADMO Officer 2', role: 'nadmo', zone: 'all', status: 'invited', mfa: false, lastActive: 'Never' },
  { id: 'U-05', name: 'Team Makola 1', role: 'collector', zone: 'makola', status: 'active', mfa: false, lastActive: '5 min ago' },
  { id: 'U-06', name: 'Team Makola 2', role: 'collector', zone: 'makola', status: 'active', mfa: false, lastActive: '40 min ago' },
  { id: 'U-07', name: 'Team East Legon 1', role: 'collector', zone: 'east-legon', status: 'active', mfa: false, lastActive: '2 h ago' },
  { id: 'U-08', name: 'Team East Legon 2', role: 'collector', zone: 'east-legon', status: 'suspended', mfa: false, lastActive: '3 days ago' },
  { id: 'U-09', name: 'System Admin', role: 'admin', zone: 'all', status: 'active', mfa: true, lastActive: 'Now' },
])

/* ---------- Activity log ---------- */
export interface Activity {
  time: string
  action: string
}
export const activity = reactive<Activity[]>([
  { time: 'Yesterday', action: 'Suspended Team East Legon 2 (phone reported lost)' },
])
const clock = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
const record = (action: string) => activity.unshift({ time: clock(), action })

/* ---------- Users ---------- */
let nextId = 10

export function setStatus(u: StaffUser, status: AccountStatus) {
  u.status = status
  record(`${status === 'suspended' ? 'Suspended' : 'Reactivated'} ${u.name}`)
}

export function inviteUser(name: string, role: StaffRole, zone: ZoneScope) {
  // Field workers must be tied to one zone; others may cover all zones.
  const id = `U-${String(nextId++).padStart(2, '0')}`
  users.push({ id, name, role, zone, status: 'invited', mfa: false, lastActive: 'Never' })
  record(`Invited ${name} as ${ROLE_LABEL[role]} (${ZONE_LABEL[zone]})`)
}

/* ---------- Sensors ---------- */

/** Sensor id → time it was sent for maintenance. */
export const maintenance = reactive<Record<string, string>>({})

export function toggleMaintenance(sensorId: string) {
  if (maintenance[sensorId]) {
    delete maintenance[sensorId]
    record(`Returned ${sensorId} to service`)
  } else {
    maintenance[sensorId] = clock()
    record(`Sent ${sensorId} for maintenance (drain crew notified)`)
  }
}

/* ---------- Roles and access (least privilege) ---------- */
export const PERMISSIONS: { label: string; roles: Record<StaffRole | 'citizen', boolean | string> }[] = [
  { label: 'See flood data', roles: { ama: true, nadmo: true, collector: false, citizen: 'Own zone, simple view', admin: 'Sensor health only' } },
  { label: 'See waste data', roles: { ama: true, nadmo: false, collector: 'Own zone', citizen: false, admin: 'Sensor health only' } },
  { label: 'See air quality', roles: { ama: true, nadmo: false, collector: false, citizen: 'Own zone, simple view', admin: 'Sensor health only' } },
  { label: 'Approve and send alerts', roles: { ama: true, nadmo: false, collector: false, citizen: false, admin: false } },
  { label: 'Acknowledge flood alerts', roles: { ama: false, nadmo: true, collector: false, citizen: false, admin: false } },
  { label: 'Mark bins as emptied', roles: { ama: false, nadmo: false, collector: true, citizen: false, admin: false } },
  { label: 'Report a problem', roles: { ama: false, nadmo: false, collector: false, citizen: true, admin: false } },
  { label: 'Manage users and sensors', roles: { ama: false, nadmo: false, collector: false, citizen: false, admin: true } },
  { label: 'See citizen phone numbers', roles: { ama: false, nadmo: false, collector: false, citizen: false, admin: false } },
]
