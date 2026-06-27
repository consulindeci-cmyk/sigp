import React from 'react';
import { AlertTriangle, FileQuestion, Loader2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../forms/Button';

export function LoadingState({ className, text = "Chargement en cours..." }: { className?: string, text?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-slate", className)}>
      <Loader2 className="h-8 w-8 animate-spin text-navy-500 mb-4" />
      <p className="text-sm font-medium">{text}</p>
    </div>
  );
}

export function ErrorState({ className, title = "Une erreur est survenue", description, onRetry }: { className?: string, title?: string, description?: string, onRetry?: () => void }) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
      <div className="rounded-full bg-red-bg p-3 mb-4">
        <AlertTriangle className="h-6 w-6 text-red" />
      </div>
      <h3 className="text-lg font-semibold text-ink mb-2">{title}</h3>
      {description && <p className="text-sm text-slate mb-4 max-w-sm">{description}</p>}
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>Réessayer</Button>
      )}
    </div>
  );
}

export function EmptyState({ className, title = "Aucun résultat", description, action }: { className?: string, title?: string, description?: string, action?: React.ReactNode }) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
      <div className="rounded-full bg-canvas p-4 mb-4">
        <FileQuestion className="h-8 w-8 text-slate-light" />
      </div>
      <h3 className="text-lg font-semibold text-ink mb-2">{title}</h3>
      {description && <p className="text-sm text-slate mb-4 max-w-sm">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}
