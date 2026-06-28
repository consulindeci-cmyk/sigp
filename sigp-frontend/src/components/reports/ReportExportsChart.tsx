import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/Card';
import type { MonthlyExportsData } from '@/mocks/reportsMocks';

// ─────────────────────────────────────────────────────────────────────────────
// Monthly exports bar chart — reusable for any time-series export data
// ─────────────────────────────────────────────────────────────────────────────

interface ReportExportsChartProps {
  data: MonthlyExportsData[];
}

export function ReportExportsChart({ data }: ReportExportsChartProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-foreground">
          Exports par mois — 12 derniers mois
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="h-48"
          role="img"
          aria-label="Graphique d'historique des exports mensuels de rapports"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="mois"
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--popover)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: 'var(--foreground)',
                }}
                cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
                formatter={(value: any) => [String(value), 'Exports']}
              />
              <Bar
                dataKey="exports"
                fill="var(--primary, #2563eb)"
                radius={[3, 3, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
