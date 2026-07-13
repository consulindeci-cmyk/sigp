import { AlertTriangle } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface WidgetErrorBoundaryProps {
  children: React.ReactNode;
  label?: string;
  className?: string;
}

/**
 * Isole un widget/graphique individuel : si son rendu échoue, seul ce widget
 * affiche un état d'erreur local — le reste de la page (Dashboard ou autre)
 * continue de fonctionner normalement.
 */
export function WidgetErrorBoundary({ children, label = 'ce widget', className }: WidgetErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={
        <div
          className={className ?? 'h-full min-h-[160px] w-full flex flex-col items-center justify-center gap-2 text-center p-4'}
          role="alert"
        >
          <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground">Impossible d'afficher {label}</p>
          <p className="text-xs text-muted-foreground">Le reste de la page reste disponible.</p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
