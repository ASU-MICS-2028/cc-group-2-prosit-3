<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import L from 'leaflet'
import type { Reading, ZoneId } from '../../types'
import { ZONES } from '../../data/mock'
import { STATUS_HEX } from '../../lib/status'

/* Collector's map: bins numbered in route order. Own zone only. */
const props = defineProps<{ zoneId: ZoneId; stops: { reading: Reading; done: boolean }[] }>()

const el = ref<HTMLDivElement>()
let map: L.Map | undefined

onMounted(() => {
  if (!el.value) return
  const zone = ZONES.find((z) => z.id === props.zoneId)!
  map = L.map(el.value, { zoomControl: false, attributionControl: true })
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    className: 'tiles-muted',
    attribution: '&copy; OpenStreetMap',
  }).addTo(map)
  L.polygon(zone.outline, { color: '#111', weight: 1.5, fill: false }).addTo(map)
  props.stops.forEach((st, i) => {
    const s = st.reading.sensor
    const color = st.done ? STATUS_HEX.safe : STATUS_HEX[st.reading.status]
    L.marker([s.lat, s.lng], {
      icon: L.divIcon({
        className: 'pin-wrap',
        html: `<div class="pin" style="--ring:${color}"><b style="font-size:13px">${st.done ? '✓' : i + 1}</b></div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      }),
      title: `${i + 1}. ${s.place}`,
    })
      .bindTooltip(`${i + 1}. ${s.place}`, { direction: 'top', offset: [0, -14] })
      .addTo(map!)
  })
  map.fitBounds(L.latLngBounds(zone.outline), { padding: [20, 20] })
})
onBeforeUnmount(() => map?.remove())
</script>

<template>
  <div ref="el" class="bin-map" role="region" aria-label="Map of bins on today's route" />
</template>

<style scoped>
.bin-map {
  flex: 1;
  min-height: 300px;
}
</style>
