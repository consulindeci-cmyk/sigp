import React, { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface BurnRateData {
  mois: string;
  depense: number;
}

interface BurnRateChartProps {
  data: BurnRateData[];
}

export const BurnRateChart = React.memo(({ data }: BurnRateChartProps) => {
  const chartData = useMemo(() => data, [data]);

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '300px' }} role="figure" aria-label="Graphique du Burn Rate Mensuel">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
            tickFormatter={(value) => `${value} K`}
          />
          <Tooltip 
            cursor={{ fill: 'var(--canvas)' }}
            contentStyle={{ borderRadius: '8px', border: '1px solid var(--line-soft)', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', fontSize: '12px' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
          <Bar dataKey="depense" name="Dépenses (M)" fill="var(--amber-500)" radius={[4, 4, 0, 0]} barSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

BurnRateChart.displayName = 'BurnRateChart';
