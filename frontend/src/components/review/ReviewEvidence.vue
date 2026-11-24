<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { TriangleAlert } from 'lucide'
import '../../lib/charts'
import { CHART_FONT } from '../../lib/charts'
import type { Suggestion } from '../../types'
import { SENSORS, hourly, isLowBattery, isOffline, rainAt, readingAt, readingsAt } from '../../data/mock'
import { STATUS_HEX, statusFor } from '../../lib/status'
import { iconSvg } from '../../lib/icon'
import StatusChip from '../StatusChip.vue'

/* Brief §8.2, left column: can the officer answer "is this real?" in under a minute. */
const props = defineProps<{ s: Suggestion; hour: number }>()

const sensor = computed(() => SENSORS.find((x) => x.id === props.s.triggerSensorId)!)
const type = computed(() => sensor.value.type)

// Other sensors of the same type in the same zone: do they agree?
const peers = computed(() =>
  readingsAt(props.hour).filter((r) => r.sensor.zoneId === props.s.zoneId && r.sensor.type === type.value),
)
const peersOnline = computed(() => peers.value.filter((r) => r.value !== null))
const peersAgree = computed(() => peersOnline.value.filter((r) => r.status === 'watch' || r.status === 'danger'))
const peerProblems = computed(() => peers.value.filter((r) => isOffline(r.sensor) || isLowBattery(r.sensor)))

/*
 * SIMULATED confidence: higher when the reading is far above the limit and
 * nearby sensors agree. The real number will come from Clifford's model.
 */
const confidence = computed(() => {
  const over = Math.max(0, (props.s.value - props.s.limit) / props.s.limit)
  const agree = peersOnline.value.length ? peersAgree.value.length / peersOnline.value.length : 0
  return Math.min(0.97, 0.45 + 0.35 * agree + 0.8 * over)
})
const confidenceWord = computed(() => (confidence.value >= 0.8 ? 'High' : confidence.value >= 0.6 ? 'Medium' : 'Low'))

const pad = (h: number) => String(h).padStart(2, '0')

const chartOption = computed(() => {
  const id = sensor.value.id
  const series = hourly((h) => readingAt(sensor.value, h).value)
  const showRain = props.s.kind === 'flood'
  return {
    animation: false,
    grid: { left: 30, right: showRain ? 30 : 10, top: 14, bottom: 22 },
    tooltip: { trigger: 'axis', textStyle: { fontFamily: CHART_FONT.fontFamily, fontSize: 12 } },
    xAxis: {
      type: 'category',
      data: hourly(pad),
      axisTick: { show: false },
      axisLine: { lineStyle: { color: '#e5e5e1' } },
      axisLabel: { ...CHART_FONT, interval: 3 },
    },
    yAxis: [
      { type: 'value', max: props.s.unit === '%' ? 100 : undefined, splitLine: { lineStyle: { color: '#f0f0ed' } }, axisLabel: CHART_FONT },
      ...(showRain ? [{ type: 'value', splitLine: { show: false }, axisLabel: { ...CHART_FONT, formatter: '{value}' } }] : []),
    ],
    series: [
      ...(showRain
        ? [
            {
              name: 'Rain (mm/h)',
              type: 'bar',
              yAxisIndex: 1,
              barWidth: 5,
              data: hourly((h) => ({ value: rainAt(props.s.zoneId, h), itemStyle: { color: '#dcdcd8', borderRadius: 3 } })),
            },
          ]
        : []),
      {
        name: `${id} (${props.s.unit})`,
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: { color: '#111111', width: 1.5 },
        data: series,
        markLine: {
          symbol: 'none',
          silent: true,
          label: { ...CHART_FONT, formatter: 'limit {c}', position: 'insideStartTop' },
          lineStyle: { color: STATUS_HEX.danger, type: 'dashed', width: 1 },
          data: [{ yAxis: props.s.limit }],
        },
        markPoint: undefined,
      },
    ],
  }
})
</script>

<template>
  <section class="col panel">
    <h2 class="title">Evidence</h2>

    <div v-if="peerProblems.length" class="banner" role="alert">
      <span v-html="iconSvg(TriangleAlert, 16)" />
      <div>
        <b>Check before approving:</b>
        <span v-for="(r, i) in peerProblems" :key="r.sensor.id">
          {{ i ? '; ' : ' ' }}<span class="mono">{{ r.sensor.id }}</span>
          {{ isOffline(r.sensor) ? `is offline (${r.sensor.lastSeenMin} min)` : `has a low battery (${r.sensor.battery}%)` }}
        </span>.
      </div>
    </div>

    <div class="trigger">
      <p class="label">Triggered by <span class="mono">{{ sensor.id }}</span> · {{ sensor.place }}</p>
      <div class="vs">
        <span class="big">{{ s.value }}<small>{{ s.unit }}</small></span>
        <span class="limit">limit {{ s.limit }}{{ s.unit === '%' ? '%' : ` ${s.unit}` }}</span>
        <StatusChip :status="statusFor(type, s.value)" />
      </div>
    </div>

    <div>
      <p class="label">Last 24 hours<template v-if="s.kind === 'flood'"> · bars = rain (mm/h)</template></p>
      <VChart class="chart" :option="chartOption" autoresize />
    </div>

    <dl class="facts">
      <template v-if="s.kind === 'flood'">
        <dt>Rain</dt>
        <dd>{{ rainAt(s.zoneId, hour) }} mm/h now · {{ rainAt(s.zoneId, hour + 1) }} mm/h expected next hour</dd>
      </template>
      <dt>Nearby sensors</dt>
      <dd>
        {{ peersAgree.length }} of {{ peersOnline.length }} working {{ type }} sensors in this zone are above normal
        <span class="label">{{ peersAgree.length <= 1 ? '· only one sensor: could be a fault' : '· they agree' }}</span>
      </dd>
      <dt>Confidence</dt>
      <dd>
        <b>{{ confidenceWord }}</b> ({{ confidence.toFixed(2) }})
        <span class="label">· simulated until the ML model is ready</span>
      </dd>
      <dt>Sensor health</dt>
      <dd>
        Battery {{ sensor.battery }}% · updated {{ sensor.lastSeenMin }} min ago
      </dd>
      <dt>Source</dt>
      <dd>{{ s.source }} · {{ s.createdMinAgo }} min ago</dd>
    </dl>
  </section>
</template>

<style scoped>
.col {
  padding: var(--s5);
  display: flex;
  flex-direction: column;
  gap: var(--s4);
  min-width: 0;
}
.banner {
  display: flex;
  gap: var(--s2);
  align-items: flex-start;
  padding: var(--s3);
  border-radius: var(--r-card);
  background: var(--watch-tint);
  font-size: 13px;
}
.banner :deep(svg) {
  display: block;
  color: var(--watch);
  margin-top: 1px;
}
.vs {
  display: flex;
  align-items: baseline;
  gap: var(--s3);
  flex-wrap: wrap;
  margin-top: 4px;
}
.big {
  font-size: 56px;
  font-weight: 300;
  line-height: 1;
  letter-spacing: -0.02em;
}
.big small {
  font-size: 18px;
  color: var(--ink-muted);
  margin-left: 2px;
}
.limit {
  color: var(--ink-muted);
}
.vs :deep(.chip) {
  align-self: center;
}
.chart {
  height: 160px;
}
.facts {
  display: grid;
  grid-template-columns: 110px 1fr;
  gap: var(--s2) var(--s3);
  margin: 0;
  font-size: 13px;
}
dt {
  color: var(--ink-muted);
}
dd {
  margin: 0;
}
</style>
