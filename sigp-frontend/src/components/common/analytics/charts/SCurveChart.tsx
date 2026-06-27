import React, { useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface SCurveData {
  mois: string;
  prevu: number;
  engage: number;
  decaisse: number;
}

interface SCurveChartProps {
  data: SCurveData[];
}

export const SCurveChart = React.memo(({ data }: SCurveChartProps) => {
  const chartData = useMemo(() => data, [data]);

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '300px' }} role="figure" aria-label="Graphique Courbe en S des décaissements">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--line-soft)" vertical={false} />
          <XAxis 
            dataKey="mois" 
            tick={{ fontSize: 12, fill: 'var(--slate)' }} 
            axisLine={{ stroke: 'var(--line-strong)' }}
            tickLine={false}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: 'var(--slate)' }} 
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `${value} M`}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: '1px solid var(--line-soft)', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', fontSize: '12px' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
          <Line type="monotone" dataKey="prevu" name="Prévu" stroke="var(--slate)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} strokeDasharray="5 5" />
          <Line type="monotone" dataKey="engage" name="Engagé" stroke="var(--orange-600)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          <Line type="monotone" dataKey="decaisse" name="Décaissé" stroke="var(--green-600)" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});

SCurveChart.displayName = 'SCurveChart';
