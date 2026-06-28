import { AlertCircle } from 'lucide-react';

interface DataTableErrorProps {
  message?: string;
}

export function DataTableError({ message = "Une erreur est survenue lors du chargement des données." }: DataTableErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center h-48 w-full bg-destructive/5 text-destructive rounded-lg border border-destructive/20 m-4">
      <AlertCircle className="h-8 w-8 mb-3" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
