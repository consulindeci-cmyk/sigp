import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface BarChartDataPoint {
  label: string;
  value: number;
  color?: string; // classe Tailwind bg-*
}

export interface BarChartStubProps {
  data: BarChartDataPoint[];
  /** Hauteur totale du graphique */
  heightClass?: string;
  /** Afficher les valeurs au-dessus des barres */
  showValues?: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// BarChartStub
// Graphique en barres CSS pur — structure finale du Design System.
// À remplacer par Recharts <BarChart> lors de l'intégration des données réelles.
// La structure visuelle (dimensions, espacement, couleurs) est canonique.
// ---------------------------------------------------------------------------
export function BarChartStub({
  data,
  heightClass = 'h-56',
  showValues = true,
  className,
}: BarChartStubProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className={cn('w-full flex flex-col gap-2', className)}>
      {/* Zone des barres */}
      <div className={cn('w-full flex items-end gap-2 px-2', heightClass)}>
        {data.map((item, idx) => {
          const heightPct = (item.value / maxValue) * 100;
          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
              {/* Valeur au-dessus */}
              {showValues && (
                <span className="text-xs font-mono font-semibold text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.value}
                </span>
              )}
              {/* Barre */}
              <div
                className={cn(
                  'w-full rounded-t-md transition-all duration-700 ease-out',
                  item.color ?? 'bg-primary'
                )}
                style={{ height: `${heightPct}%`, minHeight: '4px' }}
                title={`${item.label}: ${item.value}`}
              />
            </div>
          );
        })}
      </div>

      {/* Axe X — Labels */}
      <div className="w-full flex items-start gap-2 px-2">
        {data.map((item, idx) => (
          <div key={idx} className="flex-1 text-center">
            <span className="text-xs text-muted-foreground truncate block">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
