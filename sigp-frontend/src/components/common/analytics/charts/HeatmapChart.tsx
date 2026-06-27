import React, { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface HeatmapData {
  name: string;
  [key: string]: string | number;
}

interface HeatmapChartProps {
  data: HeatmapData[];
}

export const HeatmapChart = React.memo(({ data }: HeatmapChartProps) => {
  const chartData = useMemo(() => data, [data]);

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '300px' }} role="figure" aria-label="Graphique de répartition Heatmap (Stacked Bar)">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="var(--line-soft)" horizontal={false} />
          <XAxis 
            type="number"
            tick={{ fontSize: 12, fill: 'var(--slate)' }} 
            axisLine={{ stroke: 'var(--line-strong)' }}
            tickLine={false}
            tickFormatter={(value) => `${value} %`}
          />
          <YAxis 
            dataKey="name" 
            type="category"
            tick={{ fontSize: 12, fill: 'var(--slate)', width: 150 }} 
            axisLine={false}
            tickLine={false}
            width={120}
          />
          <Tooltip 
            cursor={{ fill: 'var(--canvas)' }}
            contentStyle={{ borderRadius: '8px', border: '1px solid var(--line-soft)', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', fontSize: '12px' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
          <Bar dataKey="Banque Mondiale" stackId="a" fill="var(--blue-600)" radius={[0, 0, 0, 0]} />
          <Bar dataKey="AFD" stackId="a" fill="var(--sky-500)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

HeatmapChart.displayName = 'HeatmapChart';
