import { Loader2 } from 'lucide-react';

export function DataTableLoading() {
  return (
    <div className="flex flex-col items-center justify-center h-48 w-full bg-background/50 backdrop-blur-sm z-10">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-sm font-medium text-muted-foreground animate-pulse">Chargement des données...</p>
    </div>
  );
}
