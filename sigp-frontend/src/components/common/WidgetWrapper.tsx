import React from 'react';
import { Loader2 } from 'lucide-react';
import { WidgetState } from '../../types/dashboard';

interface WidgetWrapperProps {
  title: string;
  state?: WidgetState;
  errorMsg?: string;
  children: React.ReactNode;
  height?: string;
  gridColumn?: string;
}

export default function WidgetWrapper({
  title,
  state = 'success',
  errorMsg,
  children,
  height = '100%',
  gridColumn,
}: WidgetWrapperProps) {
  return (
    <div
      className="bg-muted/5 border border-border rounded-md p-4 flex flex-col overflow-hidden"
      style={{ height, gridColumn }}
    >
      <h4 className="text-[13px] font-semibold text-foreground mb-4 shrink-0">{title}</h4>

      <div className="flex-1 relative flex flex-col">
        {state === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/5 z-10">
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement...
            </span>
          </div>
        )}

        {state === 'empty' && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/5 z-10">
            <span className="text-xs text-muted-foreground">Aucune donnée disponible.</span>
          </div>
        )}

        {state === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center bg-destructive/5 rounded z-10">
            <span className="text-xs text-destructive text-center p-2.5">
              ⚠️ {errorMsg || 'Impossible de charger les données.'}
            </span>
          </div>
        )}

        {(state === 'success' || state === 'loading') && children}
      </div>
    </div>
  );
}
