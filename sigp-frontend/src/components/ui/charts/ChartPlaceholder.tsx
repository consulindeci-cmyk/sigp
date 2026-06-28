import React from 'react';
import { cn } from '@/lib/utils';
import { BarChart2, PieChart, LineChart, TrendingUp } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type ChartType = 'bar' | 'line' | 'donut' | 'area';

export interface ChartPlaceholderProps {
  /** Type de graphique prévu — affiche l'icône correspondante */
  type?: ChartType;
  /** Titre du graphique */
  title?: string;
  /** Description / sous-titre */
  description?: string;
  /** Hauteur du conteneur (classe Tailwind) */
  heightClass?: string;
  className?: string;
}

// ---------------------------------------------------------------------------
// Icônes par type de chart
// ---------------------------------------------------------------------------
const chartIcons: Record<ChartType, React.ElementType> = {
  bar:    BarChart2,
  line:   TrendingUp,
  donut:  PieChart,
  area:   LineChart,
};

const chartLabels: Record<ChartType, string> = {
  bar:    'Graphique en barres',
  line:   'Graphique linéaire',
  donut:  'Graphique en anneau',
  area:   'Graphique de zone',
};

// ---------------------------------------------------------------------------
// ChartPlaceholder
// Composant officiel du Design System pour les graphiques non encore connectés.
// Ne jamais utiliser un simple <div> avec du texte à la place d'un chart.
// ---------------------------------------------------------------------------
export function ChartPlaceholder({
  type = 'bar',
  title,
  description,
  heightClass = 'h-64',
  className,
}: ChartPlaceholderProps) {
  const Icon = chartIcons[type];
  const label = chartLabels[type];

  return (
    <div
      className={cn(
        'w-full rounded-lg border border-dashed border-border bg-muted/20',
        'flex flex-col items-center justify-center gap-3',
        'transition-colors duration-200 hover:bg-muted/30',
        heightClass,
        className
      )}
      role="img"
      aria-label={title ?? label}
    >
      {/* Icône animée */}
      <div className="p-3 rounded-full bg-muted">
        <Icon className="h-8 w-8 text-muted-foreground/50" strokeWidth={1.5} />
      </div>

      {/* Libellés */}
      <div className="text-center space-y-1 px-4">
        {title && (
          <p className="text-sm font-semibold text-muted-foreground">{title}</p>
        )}
        {description && (
          <p className="text-xs text-muted-foreground/70 max-w-xs">{description}</p>
        )}
        {!title && !description && (
          <p className="text-xs text-muted-foreground/60">{label}</p>
        )}
      </div>

      {/* Badge de statut */}
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-xs font-medium text-muted-foreground border border-border">
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
        Données à connecter
      </span>
    </div>
  );
}
