import { type ColumnDef } from '@tanstack/react-table';
import { Mail, FolderKanban, Users as UsersIcon, CalendarDays } from 'lucide-react';
import { Badge } from '@/components/ui/data-display/Badge';
import { ActionsMenu, type ActionItem } from '@/components/projects/ActionsMenu';
import { type OrganisationRow } from '@/lib/organisationAdapter';
import { userAvatarStyle } from '@/components/users/userAvatarStyle';
import { type DataTableFilter } from '@/components/ui/data-table/types';

function statutVariant(statut: OrganisationRow['statut']): 'success' | 'destructive' {
  return statut === 'ACTIVE' ? 'success' : 'destructive';
}

export const STATUT_FILTER_OPTIONS = [
  { label: 'Actif', value: 'ACTIVE' },
  { label: 'Suspendu', value: 'SUSPENDUE' },
];

export const organisationFilters: DataTableFilter[] = [
  { id: 'statut', title: 'Statut', options: STATUT_FILTER_OPTIONS },
];

export function getOrganisationColumns(
  onView: (org: OrganisationRow) => void,
  getActions: (row: OrganisationRow) => ActionItem[]
): ColumnDef<OrganisationRow, unknown>[] {
  return [
    {
      accessorKey: 'nom',
      id: 'nom',
      header: 'Organisation',
      cell: ({ row }) => {
        const o = row.original;
        const initiales = o.nom.slice(0, 2).toUpperCase();
        const avatarStyle = userAvatarStyle(initiales);
        return (
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => onView(o)}
          >
            <div
              className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-transform group-hover:scale-105 ${avatarStyle}`}
              aria-hidden="true"
            >
              {initiales}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                {o.nom}
              </span>
              <span className="text-xs text-muted-foreground truncate flex items-center gap-1">
                <CalendarDays className="h-3 w-3 shrink-0" aria-hidden="true" />
                Créée le {o.createdAtDisplay}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'orgAdminNom',
      id: 'orgAdmin',
      header: 'Administrateur',
      cell: ({ row }) => {
        const o = row.original;
        return (
          <div className="flex flex-col min-w-0">
            <span className="font-medium text-foreground truncate">{o.orgAdminNom}</span>
            <span className="text-xs text-muted-foreground truncate flex items-center gap-1">
              <Mail className="h-3 w-3 shrink-0" aria-hidden="true" />
              {o.orgAdminEmail}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'projetsActifsCount',
      id: 'projetsActifsCount',
      header: 'Projets actifs',
      meta: { align: 'center' },
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
          <FolderKanban className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
          {row.original.projetsActifsCount}
        </span>
      ),
    },
    {
      accessorKey: 'utilisateursCount',
      id: 'utilisateursCount',
      header: 'Utilisateurs',
      meta: { align: 'center' },
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
          <UsersIcon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
          {row.original.utilisateursCount}
        </span>
      ),
    },
    {
      accessorKey: 'statut',
      id: 'statut',
      header: 'Statut',
      cell: ({ row }) => (
        <Badge variant={statutVariant(row.original.statut)} className="text-[11px]">
          {row.original.statutLabel}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => <ActionsMenu actions={getActions(row.original)} />,
    },
  ];
}
