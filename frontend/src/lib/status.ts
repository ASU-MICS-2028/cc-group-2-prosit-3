import type { SensorType, Status } from '../types'

/*
 * DRAFT thresholds. To be confirmed with Clifford (data and ML).
 * watch = "keep an eye on it", danger = "act now".
 */
export const THRESHOLDS: Record<SensorType | 'flood', { watch: number; danger: number; unit: string }> = {
  // Drain water level, as % of drain depth
  drain: { watch: 60, danger: 80, unit: '%' },
  // Bin fill level, %
  bin: { watch: 70, danger: 90, unit: '%' },
  // PM2.5, µg/m³. WHO 24-hour guideline is 15.
  air: { watch: 15, danger: 35, unit: 'µg/m³' },
  // Flood risk score, 0-100
  flood: { watch: 40, danger: 70, unit: '' },
}

export function statusFor(kind: SensorType | 'flood', value: number | null): Status {
  if (value === null) return 'offline'
  const t = THRESHOLDS[kind]
  if (value >= t.danger) return 'danger'
  if (value >= t.watch) return 'watch'
  return 'safe'
}

export const STATUS_LABEL: Record<Status, string> = {
  safe: 'Normal',
  watch: 'Watch',
  danger: 'Act now',
  offline: 'Offline',
}

export const STATUS_COLOR: Record<Status, string> = {
  safe: 'var(--safe)',
  watch: 'var(--watch)',
  danger: 'var(--danger)',
  offline: 'var(--offline)',
}

/** Raw hex values, for places that cannot read CSS variables (charts, map). */
export const STATUS_HEX: Record<Status, string> = {
  safe: '#2f9e55',
  watch: '#d9901a',
  danger: '#c9482d',
  offline: '#a3a3a0',
}
