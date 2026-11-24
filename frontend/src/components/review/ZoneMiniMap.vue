<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import L from 'leaflet'
import type { ZoneId } from '../../types'
import { SENSORS, ZONES } from '../../data/mock'

/* Small, non-interactive map showing which area the alert covers. */
const props = defineProps<{ zones: ZoneId[]; sensorId: string; color: string }>()

const el = ref<HTMLDivElement>()
let map: L.Map | undefined
let layer: L.LayerGroup | undefined

function draw() {
  if (!map || !layer) return
  layer.clearLayers()
  const shapes = ZONES.filter((z) => props.zones.includes(z.id))
  for (const z of shapes) {
    L.polygon(z.outline, { color: props.color, weight: 2, fillColor: props.color, fillOpacity: 0.15 }).addTo(layer)
  }
  const s = SENSORS.find((x) => x.id === props.sensorId)
  if (s) {
    L.circleMarker([s.lat, s.lng], { radius: 6, color: '#fff', weight: 2, fillColor: '#111', fillOpacity: 1 }).addTo(layer)
  }
  map.fitBounds(L.latLngBounds(shapes.flatMap((z) => z.outline)), { padding: [16, 16] })
}

onMounted(() => {
  if (!el.value) return
  map = L.map(el.value, {
    zoomControl: false,
    attributionControl: false,
    dragging: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    keyboard: false,
    touchZoom: false,
  })
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, className: 'tiles-muted' }).addTo(map)
  layer = L.layerGroup().addTo(map)
  draw()
})
onBeforeUnmount(() => map?.remove())
watch(() => [props.zones.join(), props.color], draw)

</script>

<template>
  <div ref="el" class="mini" role="img" :aria-label="`Map of the alert area: ${zones.join(', ')}`" />
</template>

<style scoped>
.mini {
  height: 170px;
  border-radius: var(--r-card);
  overflow: hidden;
  background: var(--canvas);
}
</style>
