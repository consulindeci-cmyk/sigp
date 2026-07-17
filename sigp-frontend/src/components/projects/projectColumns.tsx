import { Link } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/data-display/Badge';
import { ProgressBar } from '@/components/ui/data-display/ProgressBar';
import { ActionsMenu, type ActionItem } from '@/components/projects/ActionsMenu';
import { statusVariant, progressColor } from '@/components/projects/ProjectCard';
import { type ProjectRow } from '@/lib/projectAdapter';

function formatDateShort(iso: string): string {
  try {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
  } catch {
    return iso || '-';
  }
}

export interface GetProjectColumnsOptions {
  // SUPER_ADMIN uniquement — affiche l'organisation propriétaire de
  // chaque projet (vue plateforme multi-organisations).
  showOrganisation?: boolean;
}

export function getProjectColumns(
  getActions: (row: ProjectRow) => ActionItem[],
  options?: GetProjectColumnsOptions
): ColumnDef<ProjectRow, unknown>[] {
  const columns: ColumnDef<ProjectRow, unknown>[] = [
    {
      accessorKey: 'code',
      header: 'CODE',
      meta: { isSticky: true },
      enableSorting: true,
      cell: ({ getValue }) => (
        <span className="font-mono text-[12px] text-muted-foreground">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: 'name',
      header: 'NOM DU PROJET',
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5 min-w-[180px] max-w-[280px]">
          <Link
            to={`/projects/${row.original.id}`}
            className="text-[13px] font-semibold text-primary hover:underline leading-snug line-clamp-2"
          >
            {row.original.name}
          </Link>
          <span className="text-[10px] text-muted-foreground">{row.original.sector}</span>
        </div>
      ),
    },
    ...(options?.showOrganisation
      ? [
          {
            accessorKey: 'organisationNom',
            header: 'ORGANISATION',
            enableSorting: false,
            cell: ({ getValue }: { getValue: () => unknown }) => (
              <Badge variant="secondary" className="text-[11px] w-max">
                {(getValue() as string) || 'Sans organisation'}
              </Badge>
            ),
          } satisfies ColumnDef<ProjectRow, unknown>,
        ]
      : []),
    {
      accessorKey: 'donor',
      header: 'BAILLEUR',
      enableSorting: true,
      cell: ({ getValue }) => (
        <Badge variant="outline" className="text-[11px] w-max">{getValue() as string || 'Non défini'}</Badge>
      ),
    },
    {
      accessorKey: 'country',
      header: 'PAYS',
      enableSorting: true,
      cell: ({ getValue }) => (
        <span className="text-[12px] text-foreground">{getValue() as string || '-' }</span>
      ),
    },
    {
      // Tâche 13 : Le tri est désactivé sur manager car non mappé sur les colonnes SQL scalaires de base du projet
      accessorKey: 'manager',
      header: 'CHEF DE PROJET',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-bold shrink-0">
            {row.original.initialesManager}
          </div>
          <span className="text-[12px] text-foreground truncate">{row.original.manager}</span>
        </div>
      ),
    },
    {
      accessorKey: 'startDate',
      header: 'DÉBUT',
      enableSorting: true,
      cell: ({ getValue }) => (
        <span className="font-mono text-[11px] text-muted-foreground">{formatDateShort(getValue() as string)}</span>
      ),
    },
    {
      accessorKey: 'endDate',
      header: 'FIN',
      enableSorting: true,
      cell: ({ getValue }) => (
        <span className="font-mono text-[11px] text-muted-foreground">{formatDateShort(getValue() as string)}</span>
      ),
    },
    {
      // On utilise budgetTotal pour que le tri serveur fonctionne proprement avec SORT_COLUMN_MAPPING
      accessorKey: 'budgetTotal',
      header: 'BUDGET',
      enableSorting: true,
      meta: { align: 'right' },
      cell: ({ row }) => (
        <span className="font-mono text-[12px] font-semibold">{row.original.budgetDisplay}</span>
      ),
    },
    {
      accessorKey: 'statut',
      header: 'STATUT',
      enableSorting: true,
      cell: ({ row }) => {
        const s = row.original.status;
        return <Badge variant={statusVariant(s)} className="text-[11px] w-max">{s}</Badge>;
      },
    },
    {
      // Tâche 13 : Le tri est désactivé sur progressScore et profileScore (agrégations calculées)
      accessorKey: 'progressScore',
      header: 'PROGRESSION',
      enableSorting: false,
      cell: ({ getValue }) => {
        const score = getValue() as number;
        return (
          <div className="min-w-[80px] flex flex-col gap-0.5">
            <span className="font-mono text-[10px] text-foreground">{score}%</span>
            <ProgressBar value={score} size="xs" color={progressColor(score)} aria-label={`Progression ${score}%`} />
          </div>
        );
      },
    },
    {
      // Tâche 13 : Le tri est désactivé sur profileScore
      accessorKey: 'profileScore',
      header: 'PROFIL',
      enableSorting: false,
      cell: ({ getValue }) => {
        const score = getValue() as number;
        return (
          <div className="min-w-[80px] flex flex-col gap-0.5">
            <span className="font-mono text-[10px] text-foreground">{score}%</span>
            <ProgressBar value={score} size="xs" color="warning" aria-label={`Profil ${score}%`} />
          </div>
        );
      },
    },
    {
      id: 'sector',
      accessorKey: 'sector',
      header: 'SECTEUR',
      enableHiding: true,
      enableSorting: true,
      cell: () => null,
    },
    {
      id: 'search',
      accessorFn: (row) =>
        [row.name, row.code, row.donor, row.sector, row.country, row.manager].join(' '),
      enableHiding: true,
      enableSorting: false,
      header: '',
      cell: () => null,
    },
    {
      id: 'actions',
      enableHiding: false,
      enableSorting: false,
      meta: { align: 'right' },
      cell: ({ row }) => (
        <ActionsMenu
          actions={getActions(row.original)}
          aria-label={`Actions pour ${row.original.name}`}
        />
      ),
    },
  ];
  return columns;
}
