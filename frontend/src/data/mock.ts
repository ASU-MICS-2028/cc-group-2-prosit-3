/*
 * MOCK DATA: a stand-in for the backend API.
 *
 * The real sensor simulator will live in /simulator and send data through
 * the cloud pipeline. Until then, this file makes up believable readings
 * for one simulated "storm day" so the dashboard can be built and tested.
 *
 * Cause and effect built in:
 *   - a storm peaks around 15:00 → drain levels rise about 1 hour later
 *   - Makola (market) bins fill about twice as fast as East Legon bins
 *   - PM2.5 peaks in morning and evening traffic, is higher at Makola
 *     (waste burning), and drops when rain washes the air
 *   - one sensor is offline, one has a low battery
 *
 * All values are deterministic: the same hour always gives the same numbers.
 */
import type { Reading, Sensor, Suggestion, Zone, ZoneId } from '../types'
import { statusFor, THRESHOLDS } from '../lib/status'

export const ZONES: Zone[] = [
  {
    id: 'east-legon',
    name: 'East Legon',
    kind: 'Residential',
    outline: [
      [5.652, -0.178],
      [5.651, -0.15],
      [5.64, -0.143],
      [5.626, -0.148],
      [5.624, -0.17],
      [5.632, -0.181],
    ],
  },
  {
    id: 'makola',
    name: 'Makola Market',
    kind: 'Market / commerce',
    outline: [
      [5.5565, -0.2135],
      [5.5568, -0.204],
      [5.5505, -0.201],
      [5.545, -0.2045],
      [5.5452, -0.2125],
    ],
  },
]

const S = (
  id: string,
  type: Sensor['type'],
  zoneId: ZoneId,
  place: string,
  lat: number,
  lng: number,
  base: number,
  factor: number,
  battery = 80,
  lastSeenMin = 1,
): Sensor => ({ id, type, zoneId, place, lat, lng, base, factor, battery, lastSeenMin })

export const SENSORS: Sensor[] = [
  // East Legon: drains
  S('DL-EL-01', 'drain', 'east-legon', 'Lagos Ave culvert', 5.6395, -0.1652, 18, 0.5, 91),
  S('DL-EL-02', 'drain', 'east-legon', 'Boundary Rd drain', 5.6448, -0.1561, 22, 0.39, 77),
  S('DL-EL-03', 'drain', 'east-legon', 'American House junction', 5.6331, -0.1702, 20, 0.62, 64, 2),
  S('DL-EL-04', 'drain', 'east-legon', 'Okpoi Gonno stream', 5.6302, -0.1528, 15, 0.32, 88),
  // East Legon: bins
  S('BF-EL-01', 'bin', 'east-legon', 'A&C Mall bin bay', 5.6362, -0.1611, 12, 3.4, 70),
  S('BF-EL-02', 'bin', 'east-legon', 'Lagos Ave shops', 5.6412, -0.1667, 8, 2.6, 82),
  S('BF-EL-03', 'bin', 'east-legon', 'Mensah Wood St', 5.6467, -0.1702, 10, 2.9, 59),
  S('BF-EL-04', 'bin', 'east-legon', 'Boundary Rd market', 5.6284, -0.1625, 30, 3.0, 4, 52),
  // East Legon: air
  S('AQ-EL-01', 'air', 'east-legon', 'Lagos Ave', 5.6383, -0.1631, 17, 1, 95),
  S('AQ-EL-02', 'air', 'east-legon', 'Boundary Rd', 5.6431, -0.1532, 20, 1, 72),

  // Makola: drains (close to the Odaw basin, so more sensitive)
  S('DL-MK-01', 'drain', 'makola', 'Kojo Thompson Rd drain', 5.5528, -0.2098, 26, 0.66, 81),
  S('DL-MK-02', 'drain', 'makola', 'Okaishie main drain', 5.5541, -0.2068, 24, 0.71, 69, 3),
  S('DL-MK-03', 'drain', 'makola', 'Kinbu Rd culvert', 5.5487, -0.2041, 20, 0.46, 90),
  S('DL-MK-04', 'drain', 'makola', 'Odaw side channel', 5.5498, -0.2118, 30, 0.58, 76),
  // Makola: bins (fill faster on market days)
  S('BF-MK-01', 'bin', 'makola', 'Market square north', 5.5533, -0.2081, 12, 7.2, 85),
  S('BF-MK-02', 'bin', 'makola', 'Market square south', 5.5509, -0.2077, 10, 6.8, 78),
  S('BF-MK-03', 'bin', 'makola', 'Okaishie lorry stop', 5.5552, -0.2056, 15, 7.5, 66),
  S('BF-MK-04', 'bin', 'makola', 'Kinbu Rd stalls', 5.5476, -0.2058, 8, 5.4, 91),
  S('BF-MK-05', 'bin', 'makola', 'Kojo Thompson Rd stalls', 5.5517, -0.2109, 9, 6.1, 73),
  S('BF-MK-06', 'bin', 'makola', 'Fish and meat section', 5.5494, -0.2093, 14, 7.8, 62),
  // Makola: air (waste burning raises the base level)
  S('AQ-MK-01', 'air', 'makola', 'Market square', 5.5521, -0.2087, 38, 1, 87),
  S('AQ-MK-02', 'air', 'makola', 'Kinbu Rd', 5.5481, -0.2049, 33, 1, 15, 4),
]

/** Minutes after which a sensor counts as offline. */
const OFFLINE_AFTER_MIN = 30
const LOW_BATTERY = 20

export const isOffline = (s: Sensor) => s.lastSeenMin > OFFLINE_AFTER_MIN
export const isLowBattery = (s: Sensor) => !isOffline(s) && s.battery < LOW_BATTERY

/* ---------- Generators ---------- */

const gauss = (x: number, mu: number, sd: number) => Math.exp(-((x - mu) ** 2) / (2 * sd ** 2))
const wrap = (h: number) => ((h % 24) + 24) % 24

/** Small, repeatable noise in the range [-1, 1] for a sensor and hour. */
function noise(id: string, h: number): number {
  let seed = 0
  for (const c of id) seed = (seed * 31 + c.charCodeAt(0)) % 9973
  const x = Math.sin(seed * 12.9898 + h * 78.233) * 43758.5453
  return (x - Math.floor(x)) * 2 - 1
}

/** Rainfall in mm/h for a zone at an hour. Storm peak around 15:00. */
export function rainAt(zoneId: ZoneId, hour: number): number {
  const h = wrap(hour)
  const scale = zoneId === 'makola' ? 1.1 : 1
  const mm = 38 * gauss(h, 15, 1.3) + 2 * gauss(h, 4, 1)
  return Math.max(0, Math.round(mm * scale * 10) / 10)
}

/** Drains respond to rain with a delay: the last 5 hours count, the previous hour most. */
const LAG_WEIGHTS = [0.5, 1, 0.8, 0.5, 0.25]

function drainLevel(s: Sensor, hour: number): number {
  const recentRain = LAG_WEIGHTS.reduce((sum, w, k) => sum + w * rainAt(s.zoneId, hour - k), 0)
  return clamp(s.base + s.factor * recentRain + 2 * noise(s.id, hour), 0, 100)
}

/** Bins are emptied at 06:00, then fill at a steady rate. */
function binFill(s: Sensor, hour: number): number {
  const hoursSinceCollection = wrap(hour - 6)
  return clamp(s.base + s.factor * hoursSinceCollection + 1.5 * noise(s.id, hour), 0, 100)
}

/** PM2.5: traffic peaks at 08:00 and 19:00; heavy rain washes out up to half of it. */
function pm25(s: Sensor, hour: number): number {
  const h = wrap(hour)
  const traffic = 16 * gauss(h, 8, 1.4) + 22 * gauss(h, 19, 1.6)
  const washout = Math.min(0.5, rainAt(s.zoneId, hour) / 60)
  return clamp((s.base + traffic) * (1 - washout) + 3 * noise(s.id, hour), 8, 500)
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/* ---------- Public API (the backend will replace these) ---------- */

export function readingAt(s: Sensor, hour: number): Reading {
  const t = THRESHOLDS[s.type]
  if (isOffline(s)) {
    return { sensor: s, value: null, unit: t.unit, threshold: t.danger, status: 'offline' }
  }
  const raw = s.type === 'drain' ? drainLevel(s, hour) : s.type === 'bin' ? binFill(s, hour) : pm25(s, hour)
  const value = Math.round(raw)
  return { sensor: s, value, unit: t.unit, threshold: t.danger, status: statusFor(s.type, value) }
}

export function readingsAt(hour: number): Reading[] {
  return SENSORS.map((s) => readingAt(s, hour))
}

/** Flood risk 0-100: mostly the highest drain level, plus rain expected next hour. */
export function floodRiskAt(zoneId: ZoneId, hour: number): number {
  const drains = readingsAt(hour).filter((r) => r.sensor.zoneId === zoneId && r.sensor.type === 'drain' && r.value !== null)
  const maxDrain = Math.max(0, ...drains.map((r) => r.value as number))
  return Math.round(clamp(0.75 * maxDrain + 0.6 * rainAt(zoneId, hour + 1), 0, 100))
}

export function hourly<T>(fn: (hour: number) => T): T[] {
  return Array.from({ length: 24 }, (_, h) => fn(h))
}

export function average(values: (number | null)[]): number | null {
  const v = values.filter((x): x is number => x !== null)
  return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null
}

/**
 * AI suggestions waiting for an officer. In the real system these come from
 * the ML models and rules in the backend; here they are derived from the
 * mock readings so they always match what the map shows.
 */
export function suggestionsAt(hour: number): Suggestion[] {
  const out: Suggestion[] = []
  const readings = readingsAt(hour)

  for (const zone of ZONES) {
    const inZone = readings.filter((r) => r.sensor.zoneId === zone.id && r.value !== null)

    const drains = inZone.filter((r) => r.sensor.type === 'drain').sort((a, b) => b.value! - a.value!)
    const worstDrain = drains[0]
    if (worstDrain && worstDrain.status !== 'safe') {
      out.push({
        id: `flood-${zone.id}`,
        kind: 'flood',
        zoneId: zone.id,
        title: worstDrain.status === 'danger' ? `Flood warning: ${zone.name}` : `Flood watch: ${zone.name}`,
        evidence: `${worstDrain.sensor.id} at ${worstDrain.value}% (limit ${THRESHOLDS.drain.danger}%) · rain ${rainAt(zone.id, hour)} mm/h`,
        severity: worstDrain.status as Suggestion['severity'],
        triggerSensorId: worstDrain.sensor.id,
        value: worstDrain.value!,
        limit: THRESHOLDS.drain.danger,
        unit: '%',
        source: 'Flood risk model (placeholder rule)',
        createdMinAgo: 2,
      })
    }

    const fullBins = inZone
      .filter((r) => r.sensor.type === 'bin' && r.status === 'danger')
      .sort((a, b) => b.value! - a.value!)
    if (fullBins.length >= 2) {
      out.push({
        id: `waste-${zone.id}`,
        kind: 'waste',
        zoneId: zone.id,
        title: `Send collection truck early: ${zone.name}`,
        evidence: `${fullBins.length} bins at or above ${THRESHOLDS.bin.danger}% full`,
        severity: fullBins.length >= 4 ? 'danger' : 'watch',
        triggerSensorId: fullBins[0].sensor.id,
        value: fullBins[0].value!,
        limit: THRESHOLDS.bin.danger,
        unit: '%',
        source: 'Bin fill rule',
        createdMinAgo: 6,
      })
    }

    const worstAir = inZone.filter((r) => r.sensor.type === 'air').sort((a, b) => b.value! - a.value!)[0]
    if (worstAir && worstAir.status === 'danger') {
      out.push({
        id: `air-${zone.id}`,
        kind: 'air',
        zoneId: zone.id,
        title: `Air quality advisory: ${zone.name}`,
        evidence: `PM2.5 ${worstAir.value} µg/m³ at ${worstAir.sensor.place} (limit ${THRESHOLDS.air.danger})`,
        severity: 'watch',
        triggerSensorId: worstAir.sensor.id,
        value: worstAir.value!,
        limit: THRESHOLDS.air.danger,
        unit: 'µg/m³',
        source: 'Air quality rule',
        createdMinAgo: 4,
      })
    }
  }

  const rank = { danger: 0, watch: 1 }
  return out.sort((a, b) => rank[a.severity] - rank[b.severity])
}
