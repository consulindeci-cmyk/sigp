import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from './Card';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type StatCardIconVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'destructive'
  | 'warning'
  | 'info';

export interface StatCardTrend {
  /** Valeur numérique du delta (ex : 3, -12.5) */
  value: number;
  /** Libellé contextuel affiché à côté de la valeur */
  label: string;
  /** true = progression positive (↑ vert), false = régression (↓ rouge) */
  isPositive?: boolean;
  /**
   * Unité affichée après la valeur.
   * Laisser vide (`''`) si la valeur n'est pas un pourcentage.
   * @default ''
   */
  unit?: string;
}

export interface StatCardProps {
  title: string;
  value: string | number;
  /** Icône Lucide React — la couleur CSS portée par l'icône est préservée */
  icon?: React.ReactNode;
  /**
   * Variante sémantique du conteneur d'icône.
   * Définit le fond coloré autour de l'icône sans écraser sa couleur.
   * @default 'default'
   */
  iconVariant?: StatCardIconVariant;
  description?: string;
  trend?: StatCardTrend;
  className?: string;
}

// ---------------------------------------------------------------------------
// Mapping des variantes d'icône → classes Tailwind
// ---------------------------------------------------------------------------
const iconContainerVariants: Record<StatCardIconVariant, string> = {
  default:     'bg-muted',
  primary:     'bg-primary/10',
  success:     'bg-success/10',
  destructive: 'bg-destructive/10',
  warning:     'bg-warning/10',
  info:        'bg-info/10',
};

// ---------------------------------------------------------------------------
// StatCard
// ---------------------------------------------------------------------------
export function StatCard({
  title,
  value,
  icon,
  iconVariant = 'default',
  description,
  trend,
  className,
}: StatCardProps) {
  return (
    <Card className={cn('overflow-hidden shadow-card hover:shadow-sm transition-shadow duration-200', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </CardTitle>
        {icon && (
          // Le conteneur porte le fond coloré.
          // text-muted-foreground est ABSENT pour ne pas écraser la couleur de l'icône.
          <div
            className={cn(
              'h-8 w-8 rounded-md flex items-center justify-center shrink-0',
              iconContainerVariants[iconVariant]
            )}
          >
            {icon}
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="text-xl font-bold font-mono text-foreground tracking-tight">
          {value}
        </div>

        {(description || trend) && (
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            {trend && (
              <span
                className={cn(
                  'font-semibold flex items-center gap-0.5 shrink-0',
                  trend.isPositive ? 'text-success' : 'text-destructive'
                )}
              >
                {trend.isPositive ? '↑' : '↓'}
                {Math.abs(trend.value)}
                {trend.unit ?? ''}
              </span>
            )}
            <span className="text-muted-foreground truncate">
              {description ?? trend?.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
