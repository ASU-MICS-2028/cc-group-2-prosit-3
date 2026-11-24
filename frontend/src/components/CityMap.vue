<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import L from 'leaflet'
import { Trash2, Waves, Wind } from 'lucide'
import type { Reading, SensorType, ZoneId } from '../types'
import { ZONES, isLowBattery, readingsAt } from '../data/mock'
import { STATUS_HEX, STATUS_LABEL, THRESHOLDS } from '../lib/status'
import { iconSvg } from '../lib/icon'

export type Layer = 'all' | SensorType

/* lockedLayer: show only one sensor type and hide the layer switch (NADMO sees drains only). */
const props = defineProps<{ hour: number; zone: ZoneId; lockedLayer?: SensorType }>()
const layer = ref<Layer>(props.lockedLayer ?? 'all')

const LAYERS: { id: Layer; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'drain', label: 'Flood' },
  { id: 'bin', label: 'Waste' },
  { id: 'air', label: 'Air' },
]

const ICONS = { drain: Waves, bin: Trash2, air: Wind }
const TYPE_LABEL = { drain: 'Drain level', bin: 'Bin fill', air: 'PM2.5' }

const el = ref<HTMLDivElement>()
let map: L.Map | undefined
let sensorLayer: L.LayerGroup | undefined
let resizeObserver: ResizeObserver | undefined

function tooltipHtml(r: Reading): string {
  const s = r.sensor
  const value = r.value === null ? 'No data' : `${r.value} ${r.unit}`
  const lastSeen = s.lastSeenMin > 30 ? `<b style="color:${STATUS_HEX.offline}">Last seen ${s.lastSeenMin} min ago</b>` : `Updated ${s.lastSeenMin} min ago`
  const battery = isLowBattery(s) ? `<b style="color:${STATUS_HEX.watch}">Battery ${s.battery}% (low)</b>` : `Battery ${s.battery}%`
  return `
    <div class="tip">
      <div class="tip-id">${s.id}</div>
      <div class="tip-place">${s.place}</div>
      <div class="tip-value">
        <span class="tip-dot" style="background:${STATUS_HEX[r.status]}"></span>
        ${TYPE_LABEL[s.type]}: <b>${value}</b> · ${STATUS_LABEL[r.status]}
      </div>
      <div class="tip-meta">Limit ${THRESHOLDS[s.type].danger} ${r.unit} · ${battery}</div>
      <div class="tip-meta">${lastSeen}</div>
    </div>`
}

function drawSensors() {
  if (!map || !sensorLayer) return
  sensorLayer.clearLayers()

  for (const r of readingsAt(props.hour)) {
    const s = r.sensor
    if (layer.value !== 'all' && layer.value !== s.type) continue

    // Risk circle around drains that are rising (idea from Earthly).
    if (s.type === 'drain' && (r.status === 'watch' || r.status === 'danger')) {
      L.circle([s.lat, s.lng], {
        radius: r.status === 'danger' ? 320 : 180,
        stroke: true,
        color: STATUS_HEX[r.status],
        weight: 1,
        fillColor: STATUS_HEX[r.status],
        fillOpacity: 0.12,
        interactive: false,
      }).addTo(sensorLayer)
    }

    const warn = isLowBattery(s) ? '<span class="pin-warn" aria-hidden="true"></span>' : ''
    const icon = L.divIcon({
      className: 'pin-wrap',
      html: `<div class="pin" style="--ring:${STATUS_HEX[r.status]}">${iconSvg(ICONS[s.type], 14, 2)}${warn}</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    })
    L.marker([s.lat, s.lng], { icon, keyboard: true, title: `${s.id} ${s.place}` })
      .bindTooltip(tooltipHtml(r), { className: 'sensor-tip', direction: 'top', offset: [0, -14] })
      .addTo(sensorLayer)
  }
}

function focusZone(id: ZoneId, animate = true) {
  const z = ZONES.find((x) => x.id === id)
  if (!map || !z) return
  map.flyToBounds(L.latLngBounds(z.outline), { padding: [60, 60], maxZoom: 16, animate, duration: 0.8 })
}

onMounted(() => {
  if (!el.value) return
  map = L.map(el.value, { zoomControl: false, attributionControl: true })
  L.control.zoom({ position: 'topright' }).addTo(map)

  // OpenStreetMap tiles, turned grey with CSS (.tiles-muted) so status colours stand out.
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
    className: 'tiles-muted',
  }).addTo(map)

  // Dim everything except the pilot zones: a world-sized polygon with the zones cut out as holes.
  const world: [number, number][] = [
    [85, -180],
    [85, 180],
    [-85, 180],
    [-85, -180],
  ]
  L.polygon([world, ...ZONES.map((z) => z.outline)], {
    stroke: false,
    fillColor: '#f2f2f0',
    fillOpacity: 0.62,
    interactive: false,
  }).addTo(map)

  for (const z of ZONES) {
    L.polygon(z.outline, { color: '#111111', weight: 1.5, fill: false, interactive: false }).addTo(map)
    const top = z.outline.reduce((a, b) => (b[0] > a[0] ? b : a))
    L.marker(top, {
      interactive: false,
      icon: L.divIcon({ className: 'zone-label', html: `<span>${z.name}</span>`, iconSize: [0, 0] }),
    }).addTo(map)
  }

  sensorLayer = L.layerGroup().addTo(map)
  drawSensors()
  focusZone(props.zone, false)

  resizeObserver = new ResizeObserver(() => map?.invalidateSize())
  resizeObserver.observe(el.value)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  map?.remove()
})

watch(() => [props.hour, layer.value], drawSensors)
watch(() => props.zone, (z) => focusZone(z))

function showAll() {
  if (!map) return
  map.flyToBounds(L.latLngBounds(ZONES.flatMap((z) => z.outline)), { padding: [60, 60], duration: 0.8 })
}
</script>

<template>
  <div class="map-wrap panel">
    <div ref="el" class="map" role="region" aria-label="Map of Accra pilot zones with sensors" />

    <!-- Legend (bottom-left) -->
    <div class="overlay legend">
      <p class="label">Status</p>
      <ul>
        <li><i class="ring" :style="{ '--ring': STATUS_HEX.safe }" /> Normal</li>
        <li><i class="ring" :style="{ '--ring': STATUS_HEX.watch }" /> Watch</li>
        <li><i class="ring" :style="{ '--ring': STATUS_HEX.danger }" /> Act now</li>
        <li><i class="ring" :style="{ '--ring': STATUS_HEX.offline }" /> Offline</li>
      </ul>
      <p class="label">Sensors</p>
      <ul>
        <li><span class="ic" v-html="iconSvg(Waves, 14)" /> Drain level</li>
        <li v-if="!lockedLayer"><span class="ic" v-html="iconSvg(Trash2, 14)" /> Bin fill</li>
        <li v-if="!lockedLayer"><span class="ic" v-html="iconSvg(Wind, 14)" /> Air (PM2.5)</li>
      </ul>
    </div>

    <!-- Layer switch (bottom-right) -->
    <div class="overlay layers">
      <button class="link" @click="showAll">Both zones</button>
      <div v-if="!lockedLayer" class="segmented" role="group" aria-label="Map layer">
        <button v-for="l in LAYERS" :key="l.id" :aria-pressed="layer === l.id" @click="layer = l.id">
          {{ l.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.map-wrap {
  position: relative;
  overflow: hidden;
  min-height: 560px;
  flex: 1;
}
.map {
  position: absolute;
  inset: 0;
}
.overlay {
  position: absolute;
  z-index: 500;
}
.legend {
  left: var(--s4);
  bottom: var(--s4);
  background: var(--surface);
  border-radius: var(--r-card);
  box-shadow: 0 0 0 1px var(--line);
  padding: var(--s3) var(--s4);
  font-size: 12px;
}
.legend ul {
  list-style: none;
  margin: 4px 0 8px;
  padding: 0;
  display: grid;
  gap: 4px;
}
.legend ul:last-child {
  margin-bottom: 0;
}
.legend li {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ring {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #111;
  box-shadow: 0 0 0 2.5px var(--ring);
}
.ic :deep(svg) {
  display: block;
}
.layers {
  right: var(--s4);
  bottom: var(--s4);
  display: flex;
  align-items: center;
  gap: var(--s2);
}
.layers .segmented {
  box-shadow: 0 0 0 1px var(--line);
}
.link {
  border: 0;
  background: var(--surface);
  box-shadow: 0 0 0 1px var(--line);
  border-radius: var(--r-pill);
  padding: 10px 14px;
}
</style>

<!-- Not scoped: Leaflet inserts these elements outside Vue's control. -->
<style>
.tiles-muted {
  filter: grayscale(1) contrast(0.85) brightness(1.08);
}
.pin-wrap {
  background: none;
  border: 0;
}
.pin {
  position: relative;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #111;
  color: #fff;
  display: grid;
  place-items: center;
  box-shadow: 0 0 0 3px var(--ring), 0 0 0 5px #fff;
}
.pin svg {
  display: block;
}
.pin-warn {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--watch);
  border: 2px solid #fff;
}
.zone-label span {
  position: absolute;
  transform: translate(-50%, -150%);
  white-space: nowrap;
  background: var(--ink);
  color: var(--surface);
  font-size: 12px;
  padding: 3px 10px;
  border-radius: var(--r-pill);
}
.sensor-tip .tip {
  display: grid;
  gap: 2px;
  min-width: 200px;
}
.tip-id {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink-muted);
}
.tip-place {
  font-weight: 500;
}
.tip-value {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
}
.tip-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}
.tip-meta {
  font-size: 12px;
  color: var(--ink-muted);
}
</style>
