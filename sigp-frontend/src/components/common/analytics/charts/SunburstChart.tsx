import { useMemo, memo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface SunburstData {
  name: string;
  value: number;
}

interface SunburstChartProps {
  data: SunburstData[];
}

const COLORS = ['var(--navy-600)', 'var(--sky-500)', 'var(--amber-500)'];

export const SunburstChart = memo(({ data }: SunburstChartProps) => {
  const chartData = useMemo(() => data, [data]);

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '300px' }} role="figure" aria-label="Graphique de répartition Sunburst/Donut">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {chartData.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: '1px solid var(--line-soft)', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', fontSize: '12px' }}
            formatter={(value: any) => `${value} M`}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
});

SunburstChart.displayName = 'SunburstChart';
