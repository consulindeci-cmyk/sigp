import React from 'react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type ProgressBarColor = 'default' | 'primary' | 'success' | 'warning' | 'destructive';

export interface ProgressBarProps {
  /** Valeur entre 0 et 100 */
  value: number;
  /**
   * Couleur sémantique de la barre.
   * @default 'primary'
   */
  color?: ProgressBarColor;
  /** Afficher le pourcentage à droite */
  showLabel?: boolean;
  /** Hauteur de la barre */
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  'aria-label'?: string;
}

// ---------------------------------------------------------------------------
// Mapping couleur → classes Tailwind
// ---------------------------------------------------------------------------
const colorClasses: Record<ProgressBarColor, string> = {
  default:     'bg-muted-foreground/40',
  primary:     'bg-primary',
  success:     'bg-success',
  warning:     'bg-warning',
  destructive: 'bg-destructive',
};

const sizeClasses = {
  xs: 'h-1',
  sm: 'h-1.5',
  md: 'h-2',
};

// ---------------------------------------------------------------------------
// ProgressBar
// ---------------------------------------------------------------------------
export function ProgressBar({
  value,
  color = 'primary',
  showLabel = false,
  size = 'md',
  className,
  'aria-label': ariaLabel,
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel}
        className={cn('flex-1 w-full rounded-full overflow-hidden bg-secondary', sizeClasses[size])}
      >
        <div
          className={cn('h-full rounded-full transition-all duration-500 ease-out', colorClasses[color])}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
      {showLabel && (
        <span className="font-mono text-xs text-muted-foreground w-9 shrink-0 text-right tabular-nums">
          {clampedValue}%
        </span>
      )}
    </div>
  );
}
