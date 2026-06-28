import { FileSearch } from 'lucide-react';

export function DataTableEmpty() {
  return (
    <div className="flex flex-col items-center justify-center h-48 w-full text-center m-4 border-2 border-dashed border-border rounded-lg bg-background">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
        <FileSearch className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-base font-semibold text-foreground">Aucun résultat trouvé</p>
      <p className="text-sm text-muted-foreground mt-1">Modifiez vos critères de recherche ou ajoutez de nouvelles données.</p>
    </div>
  );
}
