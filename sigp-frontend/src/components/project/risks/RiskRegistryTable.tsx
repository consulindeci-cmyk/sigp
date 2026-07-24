import { useMemo } from 'react';
import { flexRender, type ColumnDef } from '@tanstack/react-table';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import type { Risque } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/forms/Button';
import { useDataTable } from '@/components/ui/data-table/hooks/useDataTable';
import { DataTableToolbar } from '@/components/ui/data-table/DataTableToolbar';
import { DataTablePagination } from '@/components/ui/data-table/DataTablePagination';
import { DataTableLoading } from '@/components/ui/data-table/DataTableLoading';
import { DataTableEmpty } from '@/components/ui/data-table/DataTableEmpty';
import type { DataTableFilter } from '@/components/ui/data-table/types';

// ─── Rendu "feuille de calcul Excel" dédié au Registre des risques — délibérément
// distinct du <DataTable> générique partagé par le reste de l'app (thead bleu roi,
// zébrage, bordures nettes, remplissage plein de la cellule Criticité). Réutilise
// le même moteur tanstack (useDataTable) et les mêmes sous-composants (toolbar,
// pagination, états vide/chargement) que <DataTable>, mais avec un rendu de
// <table> entièrement propre à cet écran plutôt que de modifier le composant
// partagé (qui est utilisé par une vingtaine d'autres modules).

// Matrice 3×3 stricte : mêmes seuils ET mêmes tokens de couleur thème que
// RiskMatrixCard.tsx (bg-success/warning/destructive) — pas de couleurs
// Tailwind codées en dur, pour rester cohérent avec le thème clair/sombre
// de l'app.
function bucketFor(score: number): { bg: string; text: string; label: string } {
  if (score <= 4) return { bg: 'bg-success',     text: 'text-success-foreground',     label: 'FAIBLE' };
  if (score <= 6) return { bg: 'bg-warning',     text: 'text-warning-foreground',     label: 'MOYEN'  };
  return           { bg: 'bg-destructive', text: 'text-destructive-foreground', label: 'ÉLEVÉ'  };
}

interface RiskRegistryTableProps {
  risques: Risque[];
  isLoading: boolean;
  canManage: boolean;
  canDelete: boolean;
  categorieFilterOptions: DataTableFilter['options'];
  niveauFilterOptions: DataTableFilter['options'];
  onView: (r: Risque) => void;
  onEdit: (r: Risque) => void;
  onDelete: (r: Risque) => void;
}

const TH = 'px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-primary-foreground border border-primary/70 whitespace-nowrap select-none';

export function RiskRegistryTable({
  risques, isLoading, canManage, canDelete, categorieFilterOptions, niveauFilterOptions,
  onView, onEdit, onDelete,
}: RiskRegistryTableProps) {
  const columns = useMemo((): ColumnDef<Risque, unknown>[] => [
    {
      accessorKey: 'code_risque',
      header: 'N°',
      size: 90,
      cell: ({ row }) => (
        <span className="block px-3 py-2 font-bold text-foreground">{row.original.code_risque}</span>
      ),
    },
    {
      accessorKey: 'categorie',
      header: 'Catégorie',
      size: 150,
      cell: ({ row }) => <span className="block px-3 py-2">{row.original.categorie}</span>,
    },
    {
      accessorKey: 'description',
      header: 'Description du Risque',
      size: 300,
      cell: ({ row }) => (
        <span className="block px-3 py-2 whitespace-normal break-words">{row.original.description}</span>
      ),
    },
    {
      accessorKey: 'probabilite',
      header: () => (
        <div className="flex flex-col items-center gap-0.5 leading-tight">
          <span>P</span>
          <span className="text-[9px] font-normal normal-case tracking-normal text-primary-foreground/80">1=Faible, 2=Moyen, 3=Fort</span>
        </div>
      ),
      size: 90,
      cell: ({ row }) => (
        <span className="flex items-center justify-center px-3 py-2 font-bold text-foreground">{row.original.probabilite}</span>
      ),
    },
    {
      accessorKey: 'impact',
      header: () => (
        <div className="flex flex-col items-center gap-0.5 leading-tight">
          <span>I</span>
          <span className="text-[9px] font-normal normal-case tracking-normal text-primary-foreground/80">1=Faible, 2=Moyen, 3=Fort</span>
        </div>
      ),
      size: 90,
      cell: ({ row }) => (
        <span className="flex items-center justify-center px-3 py-2 font-bold text-foreground">{row.original.impact}</span>
      ),
    },
    {
      accessorKey: 'niveau_criticite',
      header: 'Criticité',
      size: 130,
      cell: ({ row }) => {
        const { criticite } = row.original;
        const b = bucketFor(criticite);
        return (
          <div className={cn('flex flex-col items-center justify-center gap-0 h-full py-2 font-bold', b.bg, b.text)}>
            <span className="text-base leading-tight tabular-nums">{criticite}</span>
            <span className="text-[10px] font-bold uppercase tracking-wide leading-tight">({b.label})</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'strategie',
      header: "Stratégie d'atténuation",
      size: 280,
      cell: ({ row }) => {
        const s = row.original.strategie;
        return (
          <span className="block px-3 py-2 whitespace-normal break-words">
            {s || <span className="text-muted-foreground">—</span>}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      size: 110,
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-0.5 px-2 py-1.5">
          <Button variant="ghost" size="icon" className="h-7 w-7"
            onClick={() => onView(row.original)} title="Consulter">
            <Eye className="h-3.5 w-3.5" />
          </Button>
          {canManage && (
            <Button variant="ghost" size="icon" className="h-7 w-7"
              onClick={() => onEdit(row.original)} title="Modifier">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          {canDelete && (
            <Button variant="ghost" size="icon"
              className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onDelete(row.original)} title="Supprimer">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ], [canManage, canDelete, onView, onEdit, onDelete]);

  const { table } = useDataTable({ data: risques, columns });

  return (
    <div className="flex flex-col bg-background border border-border rounded-lg shadow-sm overflow-hidden min-w-0">
      <DataTableToolbar
        table={table}
        searchKey="description"
        searchPlaceholder="Rechercher un risque…"
        filters={[
          { id: 'niveau_criticite', title: 'Niveau',    options: niveauFilterOptions    },
          { id: 'categorie',        title: 'Catégorie', options: categorieFilterOptions },
        ]}
      />

      <div className="w-full overflow-x-auto overflow-y-hidden">
        {isLoading ? (
          <DataTableLoading />
        ) : risques.length === 0 || table.getRowModel().rows.length === 0 ? (
          <DataTableEmpty />
        ) : (
          <table className="w-full min-w-max border-collapse text-sm">
            <thead className="sticky top-0 z-20 bg-primary">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      className={cn(TH, ['probabilite', 'impact', 'niveau_criticite', 'actions'].includes(header.column.id) && 'text-center')}
                      style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                    >
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            <tbody>
              {table.getRowModel().rows.map((row, rowIndex) => (
                <tr key={row.id} className={rowIndex % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="border border-border align-middle p-0">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <DataTablePagination table={table} />
    </div>
  );
}
