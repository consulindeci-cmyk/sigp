import { useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  UserPlus, Eye, Edit, UserCheck, UserX, KeyRound,
  Shield, Trash2, CheckCircle2, Mail,
} from 'lucide-react';
import { ContentLayout } from '@/components/layout/ContentLayout';
import { PageHeader } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/forms/Button';
import { Badge } from '@/components/ui/data-display/Badge';
import { DataTable } from '@/components/ui/data-table/DataTable';
import { DataTableFilter } from '@/components/ui/data-table/types';
import {
  Modal, ModalContent, ModalHeader, ModalTitle,
  ModalDescription, ModalFooter, ModalClose,
} from '@/components/ui/overlays/Modal';

// Users components
import { UserKPIs } from '@/components/users/UserKPIs';
import { UserSlideOver, type UserSlideOverMode } from '@/components/users/UserSlideOver';
import { UserPermissionsModal } from '@/components/users/UserPermissionsModal';
import { ActionsMenu, type ActionItem } from '@/components/projects/ActionsMenu';
import { userAvatarStyle } from '@/components/users/userAvatarStyle';

// Mock data
import {
  mockUsers,
  ROLE_LABELS,
  type MockUser,
  type UserRole,
  type UserStatus,
  type UsersKPIs,
  type UserPermissions,
} from '@/mocks/usersMocks';

// ─────────────────────────────────────────────────────────────────────────────
// Static filter options
// ─────────────────────────────────────────────────────────────────────────────

const ROLE_FILTER_OPTIONS = (Object.keys(ROLE_LABELS) as UserRole[]).map((k) => ({
  label: ROLE_LABELS[k],
  value: k,
}));

const STATUS_FILTER_OPTIONS: { label: string; value: UserStatus }[] = [
  { label: 'Actif',       value: 'Actif' },
  { label: 'Inactif',     value: 'Inactif' },
  { label: 'En attente',  value: 'En attente' },
  { label: 'Suspendu',    value: 'Suspendu' },
];

const userFilters: DataTableFilter[] = [
  { id: 'role',   title: 'Rôle',   options: ROLE_FILTER_OPTIONS },
  { id: 'statut', title: 'Statut', options: STATUS_FILTER_OPTIONS },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function statusVariant(s: UserStatus): 'success' | 'destructive' | 'warning' | 'default' {
  switch (s) {
    case 'Actif':       return 'success';
    case 'Inactif':     return 'destructive';
    case 'Suspendu':    return 'warning';
    case 'En attente':  return 'default';
  }
}

function roleVariant(role: UserRole): 'default' | 'secondary' | 'info' | 'warning' | 'outline' {
  switch (role) {
    case 'SUPER_ADMIN':   return 'info';
    case 'ADMIN_PROJET':  return 'info';
    case 'BAILLEUR':      return 'warning';
    case 'AUDITEUR':      return 'secondary';
    case 'OBSERVATEUR':   return 'outline';
    default:              return 'default';
  }
}

function formatLastLogin(s: string): string {
  if (s === '—') return '—';
  return s;
}

// ─────────────────────────────────────────────────────────────────────────────
// UsersPage
// ─────────────────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const [users, setUsers] = useState<MockUser[]>(mockUsers);

  // SlideOver
  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const [slideOverMode, setSlideOverMode] = useState<UserSlideOverMode>('view');
  const [selectedUser, setSelectedUser] = useState<MockUser | null>(null);

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<MockUser | null>(null);

  // Password reset modal
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [userToReset, setUserToReset] = useState<MockUser | null>(null);
  const [resetDone, setResetDone] = useState(false);

  // Permissions modal
  const [permsModalOpen, setPermsModalOpen] = useState(false);
  const [userForPerms, setUserForPerms] = useState<MockUser | null>(null);

  // ── Dynamic KPIs ──────────────────────────────────────────────────────────
  const kpis = useMemo<UsersKPIs>(() => ({
    total:            users.length,
    actifs:           users.filter((u) => u.statut === 'Actif').length,
    inactifs:         users.filter((u) => u.statut === 'Inactif' || u.statut === 'Suspendu').length,
    enAttente:        users.filter((u) => u.statut === 'En attente').length,
    administrateurs:  users.filter((u) => u.role === 'SUPER_ADMIN' || u.role === 'ADMIN_PROJET').length,
  }), [users]);

  // ── Actions ───────────────────────────────────────────────────────────────
  function openView(user: MockUser) {
    setSelectedUser(user);
    setSlideOverMode('view');
    setSlideOverOpen(true);
  }

  function openEdit(user: MockUser) {
    setSelectedUser(user);
    setSlideOverMode('edit');
    setSlideOverOpen(true);
  }

  function handleActivate(user: MockUser) {
    setUsers((prev) =>
      prev.map((u) => u.id === user.id ? { ...u, actif: true, statut: 'Actif' as const } : u)
    );
  }

  function handleDeactivate(user: MockUser) {
    setUsers((prev) =>
      prev.map((u) => u.id === user.id ? { ...u, actif: false, statut: 'Inactif' as const } : u)
    );
  }

  function openResetPassword(user: MockUser) {
    setUserToReset(user);
    setResetDone(false);
    setResetModalOpen(true);
  }

  function handleResetConfirm() {
    setResetDone(true);
    setTimeout(() => {
      setResetModalOpen(false);
      setResetDone(false);
      setUserToReset(null);
    }, 1800);
  }

  function openPermissions(user: MockUser) {
    setUserForPerms(user);
    setPermsModalOpen(true);
  }

  function handlePermissionsSave(userId: string, permissions: UserPermissions) {
    setUsers((prev) =>
      prev.map((u) => u.id === userId ? { ...u, permissions } : u)
    );
  }

  function openDelete(user: MockUser) {
    setUserToDelete(user);
    setDeleteModalOpen(true);
  }

  function handleDeleteConfirm() {
    if (!userToDelete) return;
    setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
    setDeleteModalOpen(false);
    setUserToDelete(null);
  }

  function handleSave() {
    setSlideOverOpen(false);
  }

  // ── Row action builder ────────────────────────────────────────────────────
  function getActions(user: MockUser): ActionItem[] {
    const isActive = user.statut === 'Actif';
    return [
      {
        label: 'Voir le profil',
        icon: <Eye className="h-3.5 w-3.5" />,
        onClick: () => openView(user),
      },
      {
        label: 'Modifier',
        icon: <Edit className="h-3.5 w-3.5" />,
        onClick: () => openEdit(user),
      },
      {
        label: isActive ? 'Désactiver' : 'Activer',
        icon: isActive
          ? <UserX className="h-3.5 w-3.5" />
          : <UserCheck className="h-3.5 w-3.5" />,
        onClick: () => isActive ? handleDeactivate(user) : handleActivate(user),
        separator: true,
      },
      {
        label: 'Réinitialiser mdp',
        icon: <KeyRound className="h-3.5 w-3.5" />,
        onClick: () => openResetPassword(user),
      },
      {
        label: 'Gérer permissions',
        icon: <Shield className="h-3.5 w-3.5" />,
        onClick: () => openPermissions(user),
      },
      {
        label: 'Supprimer',
        icon: <Trash2 className="h-3.5 w-3.5" />,
        onClick: () => openDelete(user),
        variant: 'destructive',
        separator: true,
      },
    ];
  }

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns = useMemo<ColumnDef<MockUser, any>[]>(() => [
    // Hidden search column — combines prenom, nom, email for full-text search
    {
      id: 'search',
      accessorFn: (row) => `${row.prenom} ${row.nom} ${row.email}`,
      enableHiding: true,
      header: '',
      cell: () => null,
    },
    // Visible: avatar + nom + email (sticky)
    {
      id: 'utilisateur',
      header: 'UTILISATEUR',
      meta: { isSticky: true } as any,
      cell: ({ row }) => {
        const u = row.original;
        const style = userAvatarStyle(u.initiales);
        return (
          <div className="flex items-center gap-2.5 min-w-[200px]">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${style}`}
              aria-hidden="true"
            >
              {u.initiales}
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <button
                type="button"
                onClick={() => openView(u)}
                className="text-[13px] font-semibold text-foreground hover:text-primary transition-colors text-left truncate focus-visible:outline-none focus-visible:underline"
              >
                {u.prenom} {u.nom}
              </button>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
                <Mail className="h-3 w-3 shrink-0" aria-hidden="true" />
                {u.email}
              </span>
            </div>
          </div>
        );
      },
    },
    // Role column — accessorKey must match filter id
    {
      accessorKey: 'role',
      header: 'RÔLE',
      cell: ({ row }) => (
        <Badge variant={roleVariant(row.original.role)} className="text-[11px] w-max">
          {row.original.roleLabel}
        </Badge>
      ),
    },
    {
      accessorKey: 'fonction',
      header: 'FONCTION',
      cell: ({ getValue }) => (
        <span className="text-[12px] text-foreground">{getValue() as string}</span>
      ),
    },
    // Statut column — filterable
    {
      accessorKey: 'statut',
      header: 'STATUT',
      cell: ({ getValue }) => {
        const s = getValue() as UserStatus;
        return <Badge variant={statusVariant(s)} className="text-[11px] w-max">{s}</Badge>;
      },
    },
    // Projets count
    {
      id: 'projets',
      header: 'PROJETS',
      meta: { align: 'right' } as any,
      cell: ({ row }) => {
        const count = row.original.projetsAffecter.length;
        return (
          <Badge variant={count > 0 ? 'outline' : 'secondary'} className="font-mono text-[11px] w-max">
            {count}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'lastConnexion',
      header: 'DERNIÈRE CONNEXION',
      cell: ({ getValue }) => (
        <span className="font-mono text-[11px] text-muted-foreground">{formatLastLogin(getValue() as string)}</span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'CRÉÉ LE',
      cell: ({ getValue }) => (
        <span className="font-mono text-[11px] text-muted-foreground">{getValue() as string}</span>
      ),
    },
    {
      id: 'actions',
      enableHiding: false,
      meta: { align: 'right' } as any,
      cell: ({ row }) => (
        <ActionsMenu
          actions={getActions(row.original)}
          aria-label={`Actions pour ${row.original.prenom} ${row.original.nom}`}
        />
      ),
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [users]);

  // ── Header actions ────────────────────────────────────────────────────────
  const headerActions = (
    <Button
      variant="default"
      leftIcon={<UserPlus className="h-4 w-4" />}
      onClick={() => {
        setSelectedUser(null);
        setSlideOverMode('new');
        setSlideOverOpen(true);
      }}
    >
      Inviter un utilisateur
    </Button>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <ContentLayout>
      <PageHeader
        title="Utilisateurs"
        subtitle={`${users.length} compte${users.length !== 1 ? 's' : ''} — ${kpis.actifs} actif${kpis.actifs !== 1 ? 's' : ''} · ${kpis.enAttente} en attente · ${kpis.administrateurs} admin`}
        actions={headerActions}
        className="mb-2"
      />

      {/* KPI Strip */}
      <UserKPIs kpis={kpis} />

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={users}
        searchKey="search"
        searchPlaceholder="Rechercher par nom ou email..."
        filters={userFilters}
        enableRowSelection
      />

      {/* ── SlideOver View / Edit / New ─────────────────────────────────── */}
      <UserSlideOver
        open={slideOverOpen}
        onOpenChange={setSlideOverOpen}
        user={selectedUser}
        mode={slideOverMode}
        onSave={handleSave}
      />

      {/* ── Permissions Modal ───────────────────────────────────────────── */}
      <UserPermissionsModal
        open={permsModalOpen}
        onOpenChange={setPermsModalOpen}
        user={userForPerms}
        onSave={handlePermissionsSave}
      />

      {/* ── Delete Confirmation Modal ───────────────────────────────────── */}
      <Modal open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Confirmer la suppression</ModalTitle>
            <ModalDescription>
              Êtes-vous sûr de vouloir supprimer le compte de{' '}
              <strong className="text-foreground">{userToDelete?.prenom} {userToDelete?.nom}</strong> ?
              Cette action est irréversible.
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <ModalClose asChild>
              <Button variant="outline">Annuler</Button>
            </ModalClose>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              <Trash2 className="h-4 w-4 mr-1.5" aria-hidden="true" />
              Supprimer le compte
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ── Password Reset Modal ────────────────────────────────────────── */}
      <Modal open={resetModalOpen} onOpenChange={setResetModalOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary" aria-hidden="true" />
              Réinitialiser le mot de passe
            </ModalTitle>
            <ModalDescription>
              Un email de réinitialisation sera envoyé à{' '}
              <strong className="text-foreground">{userToReset?.email}</strong>.
            </ModalDescription>
          </ModalHeader>

          {resetDone && (
            <div className="flex items-center gap-2 text-success text-sm bg-success/10 rounded-md px-3 py-2 border border-success/20">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              Email envoyé à {userToReset?.email} — réinitialisation simulée
            </div>
          )}

          <ModalFooter>
            <ModalClose asChild>
              <Button variant="outline">Annuler</Button>
            </ModalClose>
            <Button
              variant="default"
              onClick={handleResetConfirm}
              disabled={resetDone}
            >
              {resetDone ? 'Envoi en cours...' : 'Envoyer l\'email'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </ContentLayout>
  );
}
