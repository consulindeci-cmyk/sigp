import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { formatNumber } from '@/lib/utils'

interface SCurveData {
  mois: string
  pv: number
  ev: number
  ac: number
}

interface SCurveChartProps {
  data: SCurveData[]
  height?: number
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-navy-800 border border-navy-500 rounded-lg p-3 text-xs shadow-xl">
      <p className="text-sigp-muted mb-2 font-medium">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="flex justify-between gap-4">
          <span>{p.name}</span>
          <span className="font-mono font-semibold">{formatNumber(p.value, 0)}</span>
        </p>
      ))}
    </div>
  )
}

export function SCurveChart({ data, height = 280 }: SCurveChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center text-sigp-muted text-sm" style={{ height }}>
        Pas de données disponibles
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2D3A52" />
        <XAxis
          dataKey="mois"
          tick={{ fill: '#94A3B8', fontSize: 11 }}
          axisLine={{ stroke: '#2D3A52' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#94A3B8', fontSize: 11 }}
          axisLine={{ stroke: '#2D3A52' }}
          tickLine={false}
          tickFormatter={(v) => formatNumber(v, 0)}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 11, color: '#94A3B8', paddingTop: 12 }}
        />
        <Line
          type="monotone"
          dataKey="pv"
          name="PV (Valeur Planifiée)"
          stroke="#2563EB"
          strokeWidth={2}
          dot={false}
          strokeDasharray="5 3"
        />
        <Line
          type="monotone"
          dataKey="ev"
          name="EV (Valeur Acquise)"
          stroke="#10B981"
          strokeWidth={2.5}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="ac"
          name="AC (Coût Réel)"
          stroke="#F59E0B"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
