import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { ROLE_LABELS } from '@/mocks/usersMocks';
import type { MockUser, UserRole, UserPermissions } from '@/mocks/usersMocks';

// ── Cache keys ────────────────────────────────────────────────────────────────

export const userKeys = {
  all: () => ['users'] as const,
  one: (id: string) => ['users', id] as const,
};

// ── Backend DTO ───────────────────────────────────────────────────────────────

type BERole = 'ADMIN' | 'COORDINATEUR' | 'CHARGE_PROGRAMME' | 'FINANCIER' | 'AUDITEUR' | 'VIEWER';

interface UserDto {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: BERole;
  actif: boolean;
  telephone: string | null;
  languePreference: string;
  avatarUrl: string | null;
  derniereConnexion: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Role mapping ──────────────────────────────────────────────────────────────

const BE_TO_FE_ROLE: Record<BERole, UserRole> = {
  ADMIN:            'ADMIN_PROJET',
  COORDINATEUR:     'COORDONNATEUR_PROJET',
  CHARGE_PROGRAMME: 'RESPONSABLE_SUIVI_EVALUATION',
  FINANCIER:        'RESPONSABLE_FINANCIER',
  AUDITEUR:         'AUDITEUR',
  VIEWER:           'OBSERVATEUR',
};

const FE_TO_BE_ROLE: Record<UserRole, BERole> = {
  SUPER_ADMIN:                   'ADMIN',
  ADMIN_PROJET:                  'ADMIN',
  COORDONNATEUR_PROJET:          'COORDINATEUR',
  RESPONSABLE_FINANCIER:         'FINANCIER',
  RESPONSABLE_TECHNIQUE:         'COORDINATEUR',
  RESPONSABLE_PASSATION_MARCHES: 'COORDINATEUR',
  RESPONSABLE_SUIVI_EVALUATION:  'CHARGE_PROGRAMME',
  BAILLEUR:                      'VIEWER',
  AUDITEUR:                      'AUDITEUR',
  OBSERVATEUR:                   'VIEWER',
};

// ── Permissions default (mirrors usersMocks.defaultPermissions) ───────────────

function permissionsFromRole(role: UserRole): UserPermissions {
  const all:   UserPermissions = { projets: true,  budget: true,  marches: true,  rapports: true,  utilisateurs: true,  parametres: true,  export: true,  audit: true  };
  const admin: UserPermissions = { projets: true,  budget: true,  marches: true,  rapports: true,  utilisateurs: true,  parametres: false, export: true,  audit: false };
  const cp:    UserPermissions = { projets: true,  budget: true,  marches: false, rapports: true,  utilisateurs: false, parametres: false, export: true,  audit: false };
  const fin:   UserPermissions = { projets: true,  budget: true,  marches: false, rapports: true,  utilisateurs: false, parametres: false, export: true,  audit: false };
  const tech:  UserPermissions = { projets: true,  budget: false, marches: false, rapports: true,  utilisateurs: false, parametres: false, export: true,  audit: false };
  const march: UserPermissions = { projets: true,  budget: false, marches: true,  rapports: true,  utilisateurs: false, parametres: false, export: true,  audit: false };
  const se:    UserPermissions = { projets: true,  budget: false, marches: false, rapports: true,  utilisateurs: false, parametres: false, export: true,  audit: true  };
  const bail:  UserPermissions = { projets: false, budget: false, marches: false, rapports: true,  utilisateurs: false, parametres: false, export: true,  audit: false };
  const aud:   UserPermissions = { projets: false, budget: false, marches: false, rapports: true,  utilisateurs: false, parametres: false, export: false, audit: true  };
  const obs:   UserPermissions = { projets: false, budget: false, marches: false, rapports: true,  utilisateurs: false, parametres: false, export: false, audit: false };

  switch (role) {
    case 'SUPER_ADMIN':                   return all;
    case 'ADMIN_PROJET':                  return admin;
    case 'COORDONNATEUR_PROJET':          return cp;
    case 'RESPONSABLE_FINANCIER':         return fin;
    case 'RESPONSABLE_TECHNIQUE':         return tech;
    case 'RESPONSABLE_PASSATION_MARCHES': return march;
    case 'RESPONSABLE_SUIVI_EVALUATION':  return se;
    case 'BAILLEUR':                      return bail;
    case 'AUDITEUR':                      return aud;
    case 'OBSERVATEUR':                   return obs;
  }
}

// ── Adapter: UserDto → MockUser ───────────────────────────────────────────────

function adaptUser(dto: UserDto): MockUser {
  const feRole: UserRole = BE_TO_FE_ROLE[dto.role] ?? 'OBSERVATEUR';
  const initiales = `${dto.prenom[0] ?? '?'}${dto.nom[0] ?? '?'}`.toUpperCase();
  const statut = dto.actif ? ('Actif' as const) : ('Inactif' as const);
  const lastConnexion = dto.derniereConnexion
    ? new Date(dto.derniereConnexion).toLocaleString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '—';
  const createdAt = dto.createdAt ? dto.createdAt.split('T')[0] : '';

  return {
    id:              dto.id,
    prenom:          dto.prenom,
    nom:             dto.nom,
    initiales,
    email:           dto.email,
    telephone:       dto.telephone ?? '',
    role:            feRole,
    roleLabel:       ROLE_LABELS[feRole] ?? feRole,
    fonction:        '',
    statut,
    actif:           dto.actif,
    createdAt,
    lastConnexion,
    projetsAffecter: [],
    permissions:     permissionsFromRole(feRole),
  };
}

// ── Fetch ─────────────────────────────────────────────────────────────────────

async function fetchUsers(): Promise<MockUser[]> {
  const { data } = await api.get('/users', { params: { limit: 500 } });
  const raw: unknown = data?.data ?? data;
  const dtos: UserDto[] = Array.isArray(raw) ? raw : [];
  return dtos.map(adaptUser);
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useUsers() {
  return useQuery({
    queryKey: userKeys.all(),
    queryFn:  fetchUsers,

  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.one(id),
    queryFn: async () => {
      const { data } = await api.get(`/users/${id}`);
      return adaptUser(data?.data ?? data);
    },
    enabled: !!id,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: {
      nom: string;
      prenom: string;
      email: string;
      password: string;
      role?: UserRole;
      telephone?: string;
    }) => {
      const beRole: BERole = dto.role ? FE_TO_BE_ROLE[dto.role] : 'VIEWER';
      const { data } = await api.post('/users', { ...dto, role: beRole });
      return adaptUser(data?.data ?? data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all() }),
    onError:   () => qc.invalidateQueries({ queryKey: userKeys.all() }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: { nom?: string; prenom?: string; telephone?: string; role?: UserRole; actif?: boolean };
    }) => {
      const payload: Record<string, unknown> = { ...data };
      if (data.role !== undefined) payload.role = FE_TO_BE_ROLE[data.role];
      const { data: resp } = await api.patch(`/users/${id}`, payload);
      return adaptUser(resp?.data ?? resp);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all() }),
    onError:   () => qc.invalidateQueries({ queryKey: userKeys.all() }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/users/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all() }),
    onError:   () => qc.invalidateQueries({ queryKey: userKeys.all() }),
  });
}
