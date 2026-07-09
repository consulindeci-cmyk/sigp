import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import WidgetWrapper from '../../common/WidgetWrapper';
import { useProjectEvmHistory } from '../../../hooks/useEvm';

interface Props {
  projectId: string;
}

export default function EvmChart({ projectId }: Props) {
  const { data, isLoading, isError } = useProjectEvmHistory(projectId);

  const state = isLoading
    ? 'loading'
    : isError
    ? 'error'
    : !data || data.length === 0
    ? 'empty'
    : 'success';

  // Formatter pour afficher les K (milliers) ou M (millions)
  const formatYAxis = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toString();
  };

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.map((d) => ({
      name: d.periode,
      PV: d.pv,
      EV: d.ev,
      AC: d.ac,
    }));
  }, [data]);

  return (
    <WidgetWrapper title="Courbe en S (PV vs EV vs AC)" state={state}>
      <div className="h-[220px] w-full pt-4">
        {state === 'success' && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                dy={10}
              />
              <YAxis
                tickFormatter={formatYAxis}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                dx={-10}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: any) => new Intl.NumberFormat('fr-FR').format(value)}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Line
                type="monotone"
                dataKey="PV"
                name="Valeur Planifiée (PV)"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="EV"
                name="Valeur Acquise (EV)"
                stroke="hsl(var(--success))"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="AC"
                name="Coût Réel (AC)"
                stroke="hsl(var(--destructive))"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </WidgetWrapper>
  );
}
