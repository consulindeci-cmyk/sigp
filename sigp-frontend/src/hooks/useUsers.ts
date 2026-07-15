import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { invokeEdgeFunction } from '@/lib/supabaseFunctions';
import type { PaginatedResponse } from '@/types';
import {
  adaptUserDto,
  type UserApiDto,
  type UserRow,
  type UserRole,
  type CreateUserPayload,
  type UpdateUserPayload,
  type UsersKPIs,
} from '@/lib/userAdapter';

// ── Cache keys ────────────────────────────────────────────────────────────────

export const userKeys = {
  all: ['users'] as const,
  list: (params?: object) => [...userKeys.all, 'list', params] as const,
  detail: (id: string) => [...userKeys.all, 'detail', id] as const,
  kpis: (filters?: object) => [...userKeys.all, 'kpis', filters] as const,
};

// ── Params ────────────────────────────────────────────────────────────────────

export interface UseUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, string | number | boolean | undefined>;
  role?: UserRole;
  status?: 'active' | 'inactive';
}

// ── Ligne Supabase (colonnes snake_case de la table `users`) ─────────────────
// RLS (users_select) scope déjà la visibilité par organisation — pas de
// filtre explicite d'organisation nécessaire ici.

interface UserRowDb {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: UserRole;
  actif: boolean;
  telephone: string | null;
  langue_preference: string;
  avatar_url: string | null;
  derniere_connexion: string | null;
  created_at: string;
  updated_at: string;
}

const USER_SELECT = 'id, nom, prenom, email, role, actif, telephone, langue_preference, avatar_url, derniere_connexion, created_at, updated_at';

function rowToDto(row: UserRowDb): UserApiDto {
  return {
    id: row.id,
    nom: row.nom,
    prenom: row.prenom,
    email: row.email,
    role: row.role,
    actif: row.actif,
    telephone: row.telephone,
    languePreference: row.langue_preference ?? 'fr',
    avatarUrl: row.avatar_url,
    derniereConnexion: row.derniere_connexion,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Les Edge Functions users-create/update ne renvoient que le sous-ensemble de
// colonnes utile à la gestion RBAC (pas langue_preference/avatar_url/
// derniere_connexion) — complété ici avec des valeurs par défaut sûres avant
// adaptUserDto (qui attend un UserApiDto complet).
function edgeRowToDto(row: Partial<UserRowDb> & { id: string; nom: string; prenom: string; email: string; role: UserRole; actif: boolean }): UserApiDto {
  return {
    id: row.id,
    nom: row.nom,
    prenom: row.prenom,
    email: row.email,
    role: row.role,
    actif: row.actif,
    telephone: row.telephone ?? null,
    languePreference: row.langue_preference ?? 'fr',
    avatarUrl: row.avatar_url ?? null,
    derniereConnexion: row.derniere_connexion ?? null,
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
  };
}

const SORT_COLUMN_MAP: Record<string, string> = {
  nom: 'nom', prenom: 'prenom', email: 'email', role: 'role', actif: 'actif',
  createdAt: 'created_at', updatedAt: 'updated_at', derniereConnexion: 'derniere_connexion',
};

// ── Hook: Liste paginée, filtrée et triée côté serveur ───────────────────────

export function useUsers(params?: UseUsersParams) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: async () => {
      const page = params?.page ?? 1;
      const limit = params?.limit ?? 20;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let query = supabase.from('users').select(USER_SELECT, { count: 'exact' }).is('deleted_at', null);

      if (params?.search) {
        query = query.or(`nom.ilike.%${params.search}%,prenom.ilike.%${params.search}%,email.ilike.%${params.search}%`);
      }

      let roleFilter = params?.role;
      let statusFilter = params?.status;
      if (params?.filters) {
        for (const [key, value] of Object.entries(params.filters)) {
          if (value === undefined || value === null || value === '') continue;
          if (key === 'role') roleFilter = value as UserRole;
          else if (key === 'status') statusFilter = value as 'active' | 'inactive';
        }
      }
      if (roleFilter) query = query.eq('role', roleFilter);
      if (statusFilter) query = query.eq('actif', statusFilter === 'active');

      const sortCol = params?.sortBy && SORT_COLUMN_MAP[params.sortBy] ? SORT_COLUMN_MAP[params.sortBy] : 'created_at';
      query = query.order(sortCol, { ascending: params?.sortOrder === 'asc' }).range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;

      const list = (data as unknown as UserRowDb[]).map(rowToDto).map(adaptUserDto);
      const total = count ?? list.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));

      return {
        data: list,
        meta: {
          total, page, limit, totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      } as PaginatedResponse<UserRow>;
    },
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

// ── Hook: Détail d'un utilisateur ─────────────────────────────────────────────

export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase.from('users').select(USER_SELECT).eq('id', id).is('deleted_at', null).single();
      if (error) throw error;
      return adaptUserDto(rowToDto(data as unknown as UserRowDb));
    },
    enabled: !!id,
    staleTime: 60_000,
  });
}

// ── Hook: KPIs du portefeuille utilisateurs ───────────────────────────────────
// RLS scope déjà par organisation — pas besoin de recalculer l'organisationId
// comme le faisait NestJS manuellement.

export function useUsersKPIs() {
  return useQuery({
    queryKey: userKeys.kpis(),
    queryFn: async (): Promise<UsersKPIs> => {
      const base = () => supabase.from('users').select('*', { count: 'exact', head: true }).is('deleted_at', null);
      const [total, active, inactive, admin, coord, chargeProgramme, financier, auditeur, viewer] = await Promise.all([
        base(),
        base().eq('actif', true),
        base().eq('actif', false),
        base().eq('role', 'ADMIN'),
        base().eq('role', 'COORDINATEUR'),
        base().eq('role', 'CHARGE_PROGRAMME'),
        base().eq('role', 'FINANCIER'),
        base().eq('role', 'AUDITEUR'),
        base().eq('role', 'VIEWER'),
      ]);
      for (const res of [total, active, inactive, admin, coord, chargeProgramme, financier, auditeur, viewer]) {
        if (res.error) throw res.error;
      }
      return {
        totalUsers: total.count ?? 0,
        activeUsers: active.count ?? 0,
        inactiveUsers: inactive.count ?? 0,
        administrators: admin.count ?? 0,
        coordinators: coord.count ?? 0,
        financiers: financier.count ?? 0,
        auditors: auditeur.count ?? 0,
        // Réplique fidèlement getPortfolioKpis côté NestJS : CHARGE_PROGRAMME
        // est agrégé dans le même compteur que VIEWER.
        viewers: (viewer.count ?? 0) + (chargeProgramme.count ?? 0),
      };
    },
    staleTime: 30_000,
  });
}

// ── Mutations : Création / Modification / Suppression ─────────────────────────

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateUserPayload) => {
      const { data } = await invokeEdgeFunction<{ data: Partial<UserRowDb> & { id: string; nom: string; prenom: string; email: string; role: UserRole; actif: boolean } }>('users-create', { ...payload });
      return adaptUserDto(edgeRowToDto(data));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.list() });
      qc.invalidateQueries({ queryKey: userKeys.kpis() });
    },
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data: payload }: { id: string; data: UpdateUserPayload }) => {
      const { data } = await invokeEdgeFunction<{ data: Partial<UserRowDb> & { id: string; nom: string; prenom: string; email: string; role: UserRole; actif: boolean } }>('users-update', { id, ...payload });
      return adaptUserDto(edgeRowToDto(data));
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: userKeys.list() });
      qc.invalidateQueries({ queryKey: userKeys.kpis() });
      qc.invalidateQueries({ queryKey: userKeys.detail(variables.id) });
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await invokeEdgeFunction<{ message: string }>('users-delete', { id });
      return id;
    },
    onSuccess: (deletedId) => {
      qc.invalidateQueries({ queryKey: userKeys.list() });
      qc.invalidateQueries({ queryKey: userKeys.kpis() });
      qc.invalidateQueries({ queryKey: userKeys.detail(deletedId) });
    },
  });
}
