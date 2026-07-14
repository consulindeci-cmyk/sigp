import { type ColumnDef } from '@tanstack/react-table';
import { Mail, Shield, Phone } from 'lucide-react';
import { Badge } from '@/components/ui/data-display/Badge';
import { ActionsMenu, type ActionItem } from '@/components/projects/ActionsMenu';
import { USER_ROLE_OPTIONS, type UserRow, type UserRole } from '@/lib/userAdapter';
import { userAvatarStyle } from '@/components/users/userAvatarStyle';
import { type DataTableFilter } from '@/components/ui/data-table/types';

function statusVariant(actif: boolean): 'success' | 'destructive' {
  return actif ? 'success' : 'destructive';
}

function roleVariant(role: UserRole): 'default' | 'secondary' | 'info' | 'warning' | 'outline' {
  switch (role) {
    case 'ADMIN':
      return 'info';
    case 'COORDINATEUR':
      return 'warning';
    case 'AUDITEUR':
      return 'secondary';
    case 'VIEWER':
      return 'outline';
    default:
      return 'default';
  }
}

export const STATUS_FILTER_OPTIONS = [
  { label: 'Actif', value: 'active' },
  { label: 'Désactivé', value: 'inactive' },
];

export const userFilters: DataTableFilter[] = [
  { id: 'role', title: 'Rôle', options: USER_ROLE_OPTIONS },
  { id: 'status', title: 'Statut', options: STATUS_FILTER_OPTIONS },
];

export function getUserColumns(
  onView: (user: UserRow) => void,
  getActions: (row: UserRow) => ActionItem[]
): ColumnDef<UserRow, unknown>[] {
  return [
    {
      accessorKey: 'nom',
      id: 'nom',
      header: 'Utilisateur',
      cell: ({ row }) => {
        const u = row.original;
        const avatarStyle = userAvatarStyle(u.initiales);
        return (
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => onView(u)}
          >
            <div
              className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-transform group-hover:scale-105 ${avatarStyle}`}
              aria-hidden="true"
            >
              {u.initiales}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                {u.fullName}
              </span>
              <span className="text-xs text-muted-foreground truncate flex items-center gap-1">
                <Mail className="h-3 w-3 shrink-0" aria-hidden="true" />
                {u.email}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'role',
      id: 'role',
      header: 'Rôle système',
      cell: ({ row }) => (
        <Badge variant={roleVariant(row.original.role)} className="text-[11px] font-medium">
          <Shield className="h-3 w-3 mr-1" aria-hidden="true" />
          {row.original.roleLabel}
        </Badge>
      ),
    },
    {
      accessorKey: 'actif',
      id: 'status',
      header: 'Statut',
      cell: ({ row }) => (
        <Badge variant={statusVariant(row.original.actif)} className="text-[11px]">
          {row.original.statutLabel}
        </Badge>
      ),
    },
    {
      accessorKey: 'telephone',
      header: 'Téléphone',
      cell: ({ row }) =>
        row.original.telephone ? (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Phone className="h-3 w-3 shrink-0" aria-hidden="true" />
            {row.original.telephone}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/60">—</span>
        ),
    },
    {
      accessorKey: 'derniereConnexion',
      header: 'Dernière connexion',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.derniereConnexionDisplay}
        </span>
      ),
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => <ActionsMenu actions={getActions(row.original)} />,
    },
  ];
}
