import React from 'react';
import { AlertTriangle, FileQuestion, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../forms/Button';

// ---------------------------------------------------------------------------
// LoadingState
// ---------------------------------------------------------------------------
export function LoadingState({
  className,
  text = 'Chargement en cours...',
}: {
  className?: string;
  text?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-muted-foreground', className)}>
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-sm font-medium text-muted-foreground">{text}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ErrorState
// ---------------------------------------------------------------------------
export function ErrorState({
  className,
  title = 'Une erreur est survenue',
  description,
  onRetry,
}: {
  className?: string;
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      <div className="rounded-full bg-destructive/10 p-3 mb-4">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-4 max-w-sm">{description}</p>
      )}
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Réessayer
        </Button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// EmptyState
// ---------------------------------------------------------------------------
export function EmptyState({
  className,
  title = 'Aucun résultat',
  description,
  action,
}: {
  className?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      <div className="rounded-full bg-muted p-4 mb-4">
        <FileQuestion className="h-8 w-8 text-muted-foreground/60" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-4 max-w-sm">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
