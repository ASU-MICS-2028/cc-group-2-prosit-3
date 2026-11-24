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

export interface Suggestion {
  id: string
  kind: SuggestionKind
  zoneId: ZoneId
  title: string
  evidence: string
  severity: Exclude<Status, 'safe' | 'offline'>
}
