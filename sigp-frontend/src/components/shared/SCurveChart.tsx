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

const C = {
  pv: 'hsl(var(--primary))',
  ev: 'hsl(var(--success))',
  ac: 'hsl(var(--warning))',
  grid: 'hsl(var(--border))',
  tick: 'hsl(var(--muted-foreground))',
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-lg p-3 text-xs shadow-sm">
      <p className="text-muted-foreground mb-2 font-medium">{label}</p>
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
      <div className="flex items-center justify-center text-muted-foreground text-sm" style={{ height }}>
        Pas de données disponibles
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
        <XAxis
          dataKey="mois"
          tick={{ fill: C.tick, fontSize: 11 }}
          axisLine={{ stroke: C.grid }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: C.tick, fontSize: 11 }}
          axisLine={{ stroke: C.grid }}
          tickLine={false}
          tickFormatter={(v) => formatNumber(v, 0)}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 11, color: C.tick, paddingTop: 12 }}
        />
        <Line
          type="monotone"
          dataKey="pv"
          name="PV (Valeur Planifiée)"
          stroke={C.pv}
          strokeWidth={2}
          dot={false}
          strokeDasharray="5 3"
        />
        <Line
          type="monotone"
          dataKey="ev"
          name="EV (Valeur Acquise)"
          stroke={C.ev}
          strokeWidth={2.5}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="ac"
          name="AC (Coût Réel)"
          stroke={C.ac}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
