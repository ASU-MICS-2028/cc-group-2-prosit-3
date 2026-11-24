/* Register only the ECharts parts we use, to keep the bundle small. */
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart } from 'echarts/charts'
import { GridComponent, MarkLineComponent, TooltipComponent } from 'echarts/components'

use([CanvasRenderer, BarChart, LineChart, GridComponent, MarkLineComponent, TooltipComponent])

export const CHART_FONT = { fontFamily: 'Geist Sans, system-ui, sans-serif', fontSize: 11, color: '#6b6b68' }
