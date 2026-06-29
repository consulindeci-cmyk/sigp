import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

interface EvmIndexCardProps {
  label: 'CPI' | 'SPI';
  value: number;
  message: string;
}

function IndexIcon({ v }: { v: number }) {
  if (v >= 1)    return <TrendingUp  size={16} className="shrink-0 text-success" />;
  if (v >= 0.9)  return <Minus       size={16} className="shrink-0 text-warning" />;
  return              <TrendingDown size={16} className="shrink-0 text-destructive" />;
}

function getVariantClasses(v: number): string {
  if (v >= 1)   return 'bg-success/10 border-success/30';
  if (v >= 0.9) return 'bg-warning/10 border-warning/30';
  return             'bg-destructive/10 border-destructive/30';
}

function getValueClass(v: number): string {
  if (v >= 1)   return 'text-success';
  if (v >= 0.9) return 'text-warning';
  return             'text-destructive';
}

export function EvmIndexCard({ label, value, message }: EvmIndexCardProps) {
  return (
    <div className={`rounded-lg border p-4 flex flex-col gap-2 ${getVariantClasses(value)}`}>
      <div className="flex items-center gap-2">
        <IndexIcon v={value} />
        <span className={`text-xl font-extrabold tabular-nums ${getValueClass(value)}`}>
          {label} = {formatNumber(value, 2)}
        </span>
      </div>
      <p className="text-sm text-muted-foreground leading-snug">{message}</p>
    </div>
  );
}
