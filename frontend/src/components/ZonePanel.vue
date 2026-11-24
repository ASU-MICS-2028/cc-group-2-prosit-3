<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import '../lib/charts'
import { CHART_FONT } from '../lib/charts'
import type { ZoneId } from '../types'
import { ZONES, average, floodRiskAt, hourly, rainAt, readingsAt } from '../data/mock'
import { statusFor, THRESHOLDS } from '../lib/status'
import StatusChip from './StatusChip.vue'
import Gauge from './Gauge.vue'

const zoneId = defineModel<ZoneId>('zone', { required: true })
const props = defineProps<{ hour: number }>()

const zone = computed(() => ZONES.find((z) => z.id === zoneId.value)!)
const inZone = computed(() => readingsAt(props.hour).filter((r) => r.sensor.zoneId === zoneId.value))

/* Hero: flood risk */
const risk = computed(() => floodRiskAt(zoneId.value, props.hour))
const riskBefore = computed(() => floodRiskAt(zoneId.value, props.hour - 1))
const riskDelta = computed(() => risk.value - riskBefore.value)
const riskStatus = computed(() => statusFor('flood', risk.value))

/* Gauges */
const worstDrain = computed(() =>
  inZone.value.filter((r) => r.sensor.type === 'drain' && r.value !== null).sort((a, b) => b.value! - a.value!)[0],
)
const binReadings = computed(() => inZone.value.filter((r) => r.sensor.type === 'bin'))
const avgBin = computed(() => average(binReadings.value.map((r) => r.value)))
const binsOffline = computed(() => binReadings.value.filter((r) => r.value === null).length)

/* Rain */
const rainNow = computed(() => rainAt(zoneId.value, props.hour))
const rain24 = computed(() => Math.round(hourly((h) => rainAt(zoneId.value, props.hour - h)).reduce((a, b) => a + b, 0)))

/* Air */
const airReadings = computed(() => inZone.value.filter((r) => r.sensor.type === 'air' && r.value !== null))
const worstAir = computed(() => [...airReadings.value].sort((a, b) => b.value! - a.value!)[0])

const pad = (h: number) => String(h).padStart(2, '0')
const hoursAxis = hourly((h) => pad(h))

const rainOption = computed(() => {
  const z = zoneId.value
  const drainAvg = hourly((h) =>
    average(readingsAt(h).filter((r) => r.sensor.zoneId === z && r.sensor.type === 'drain').map((r) => r.value)),
  )
  return {
    animation: false,
    grid: { left: 28, right: 30, top: 14, bottom: 22 },
    tooltip: { trigger: 'axis', textStyle: { fontFamily: CHART_FONT.fontFamily, fontSize: 12 } },
    xAxis: {
      type: 'category',
      data: hoursAxis,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: '#e5e5e1' } },
      axisLabel: { ...CHART_FONT, interval: 2 },
    },
    yAxis: [
      { type: 'value', name: '', splitLine: { lineStyle: { color: '#f0f0ed' } }, axisLabel: CHART_FONT },
      { type: 'value', max: 100, splitLine: { show: false }, axisLabel: { ...CHART_FONT, formatter: '{value}%' } },
    ],
    series: [
      {
        name: 'Rain (mm/h)',
        type: 'bar',
        barWidth: 5,
        data: hourly((h) => ({
          value: rainAt(z, h),
          itemStyle: { color: h === props.hour ? '#111111' : '#dcdcd8', borderRadius: 3 },
        })),
      },
      {
        name: 'Avg drain level (%)',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        symbol: 'none',
        lineStyle: { color: '#6e97bf', width: 1.5 },
        data: drainAvg,
        markLine: {
          symbol: 'none',
          silent: true,
          label: { show: false },
          lineStyle: { color: '#c9482d', type: 'dashed', width: 1 },
          data: [{ yAxis: THRESHOLDS.drain.danger }],
        },
      },
    ],
  }
})

const airOption = computed(() => {
  const id = worstAir.value?.sensor.id
  const series = id ? hourly((h) => readingsAt(h).find((r) => r.sensor.id === id)?.value ?? null) : []
  return {
    animation: false,
    grid: { left: 28, right: 8, top: 10, bottom: 22 },
    tooltip: { trigger: 'axis', textStyle: { fontFamily: CHART_FONT.fontFamily, fontSize: 12 } },
    xAxis: {
      type: 'category',
      data: hoursAxis,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: '#e5e5e1' } },
      axisLabel: { ...CHART_FONT, interval: 5 },
    },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#f0f0ed' } }, axisLabel: CHART_FONT },
    series: [
      {
        name: 'PM2.5 (µg/m³)',
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: { color: '#111111', width: 1.5 },
        data: series,
        markLine: {
          symbol: 'none',
          silent: true,
          label: { ...CHART_FONT, formatter: 'limit {c}', position: 'insideEndTop' },
          lineStyle: { color: '#c9482d', type: 'dashed', width: 1 },
          data: [{ yAxis: THRESHOLDS.air.danger }],
        },
      },
    ],
  }
})
</script>

<template>
  <aside class="zone panel">
    <!-- Zone picker -->
    <div class="zone-head">
      <div class="segmented" role="group" aria-label="Pilot zone">
        <button v-for="z in ZONES" :key="z.id" :aria-pressed="z.id === zoneId" @click="zoneId = z.id">
          {{ z.name }}
        </button>
      </div>
      <span class="label">{{ zone.kind }}</span>
    </div>

    <!-- Hero metric -->
    <section class="hero">
      <div class="hero-row">
        <span class="hero-number">{{ risk }}</span>
        <StatusChip :status="riskStatus" />
      </div>
      <p class="title">Flood risk score</p>
      <p class="label">
        0–100, placeholder formula until the ML model is ready ·
        <template v-if="riskDelta !== 0">{{ riskDelta > 0 ? '↑' : '↓' }} {{ Math.abs(riskDelta) }} since {{ pad((hour + 23) % 24) }}:00</template>
        <template v-else>no change in the last hour</template>
      </p>
    </section>

    <hr class="divider" />

    <!-- Gauges -->
    <section class="gauges">
      <div class="gauge-cell">
        <p class="label">Highest drain level</p>
        <Gauge
          :value="worstDrain?.value ?? null"
          :limit="THRESHOLDS.drain.danger"
          unit="%"
          :status="worstDrain?.status ?? 'offline'"
        />
        <p class="label sub">{{ worstDrain?.sensor.place ?? 'No data' }}</p>
      </div>
      <div class="gauge-cell">
        <p class="label">Average bin fill</p>
        <Gauge :value="avgBin" :limit="THRESHOLDS.bin.danger" unit="%" :status="statusFor('bin', avgBin)" />
        <p class="label sub">
          {{ binReadings.length }} bins<template v-if="binsOffline"> · {{ binsOffline }} offline</template>
        </p>
      </div>
    </section>

    <hr class="divider" />

    <!-- Rain -->
    <section class="block">
      <div class="stats">
        <div>
          <p class="label">Rain now</p>
          <p class="stat">{{ rainNow }} <span class="label">mm/h</span></p>
        </div>
        <div>
          <p class="label">Last 24 h</p>
          <p class="stat">{{ rain24 }} <span class="label">mm</span></p>
        </div>
        <div class="legend">
          <span><i class="sw bar" /> Rain</span>
          <span><i class="sw line" /> Drain level</span>
        </div>
      </div>
      <VChart class="chart" :option="rainOption" autoresize />
    </section>

    <hr class="divider" />

    <!-- Air -->
    <section class="block">
      <div class="stats">
        <div>
          <p class="label">PM2.5 now (worst sensor)</p>
          <p class="stat">
            {{ worstAir?.value ?? '—' }} <span class="label">µg/m³</span>
            <StatusChip v-if="worstAir" :status="worstAir.status" />
          </p>
          <p class="label">
            WHO 24 h guideline is {{ THRESHOLDS.air.watch }} · {{ worstAir?.sensor.place }}
          </p>
        </div>
      </div>
      <VChart class="chart small" :option="airOption" autoresize />
      <p class="label note">24–48 h forecast will come from the ML model (week 3).</p>
    </section>
  </aside>
</template>

<style scoped>
.zone {
  display: flex;
  flex-direction: column;
  gap: var(--s5);
  padding: var(--s5);
  min-width: 0;
}
.zone-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s2);
  flex-wrap: wrap;
}
.zone-head .segmented {
  background: var(--canvas);
}
.hero-row {
  display: flex;
  align-items: flex-start;
  gap: var(--s4);
}
.hero-number {
  font-size: 96px;
  font-weight: 300;
  line-height: 0.95;
  letter-spacing: -0.03em;
}
.hero-row :deep(.chip) {
  margin-top: 14px;
}
.hero .title {
  margin-top: var(--s3);
}
.gauges {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--s4);
}
.gauge-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--s2);
  text-align: center;
}
.gauge-cell > .label:first-child {
  align-self: flex-start;
}
.sub {
  max-width: 150px;
}
.block {
  display: flex;
  flex-direction: column;
  gap: var(--s2);
}
.stats {
  display: flex;
  gap: var(--s5);
  align-items: flex-end;
}
.stat {
  font-size: 24px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.legend {
  margin-left: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
  color: var(--ink-muted);
}
.sw {
  display: inline-block;
  width: 10px;
  margin-right: 4px;
  vertical-align: middle;
}
.sw.bar {
  height: 8px;
  background: #dcdcd8;
  border-radius: 2px;
}
.sw.line {
  height: 2px;
  background: var(--water);
}
.chart {
  height: 150px;
}
.chart.small {
  height: 120px;
}
.note {
  font-style: italic;
}
</style>
