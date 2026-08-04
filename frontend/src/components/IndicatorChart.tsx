import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { IndicatorObservation, IndicatorType } from '../api/client'
import { formatIndicatorValue, formatReferenceDate } from '../utils/formatIndicator'

interface IndicatorChartProps {
  observations: IndicatorObservation[]
  type: IndicatorType
}

function formatAxisDate(referenceDate: string): string {
  return new Date(referenceDate).toLocaleDateString('pt-BR', {
    timeZone: 'UTC',
    day: '2-digit',
    month: '2-digit',
  })
}

export function IndicatorChart({ observations, type }: IndicatorChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={observations} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="referenceDate" tickFormatter={formatAxisDate} tick={{ fontSize: 12 }} />
        <YAxis
          domain={['auto', 'auto']}
          tickFormatter={(value: number) => formatIndicatorValue(type, value)}
          tick={{ fontSize: 12 }}
          width={90}
        />
        <Tooltip
          labelFormatter={(referenceDate) => formatReferenceDate(referenceDate as string)}
          formatter={(value) => formatIndicatorValue(type, value as number)}
        />
        <Line type="monotone" dataKey="value" stroke="#EA6A12" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
