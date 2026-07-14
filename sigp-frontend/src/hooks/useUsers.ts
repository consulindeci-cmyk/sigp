import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import api from '@/lib/axios';
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

// ── Cache keys (Phase 20.1: Granular Keys — Anti-Query Storm) ─────────────────

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

// ── Hook: Liste paginée, filtrée et triée côté serveur ───────────────────────

export function useUsers(params?: UseUsersParams) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: async () => {
      const queryParams: Record<string, string | number | boolean | undefined> = {
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
      };

      if (params?.search) queryParams.search = params.search;
      if (params?.sortBy) queryParams.sortBy = params.sortBy;
      if (params?.sortOrder) queryParams.sortOrder = params.sortOrder;
      if (params?.role) queryParams.role = params.role;
      if (params?.status) queryParams.status = params.status;

      if (params?.filters) {
        for (const [key, value] of Object.entries(params.filters)) {
          if (value !== undefined && value !== null && value !== '') {
            if (key === 'role') {
              queryParams.role = value as UserRole;
            } else if (key === 'status') {
              queryParams.status = value as 'active' | 'inactive';
            } else {
              queryParams[key] = value;
            }
          }
        }
      }

      const { data } = await api.get('/users', { params: queryParams });

      // Shape 1: Wrapped by NestJS ResponseInterceptor -> { success: true, data: { data: [...], meta: { ... } } }
      if (data && data.data && data.data.meta && Array.isArray(data.data.data)) {
        const list = (data.data.data as UserApiDto[]).map(adaptUserDto);
        return {
          data: list,
          meta: data.data.meta,
        } as PaginatedResponse<UserRow>;
      }

      // Shape 2: Direct paginated response -> { data: [...], meta: { ... } }
      if (data && data.meta && Array.isArray(data.data)) {
        const list = (data.data as UserApiDto[]).map(adaptUserDto);
        return {
          data: list,
          meta: data.meta,
        } as PaginatedResponse<UserRow>;
      }

      // Shape 3 or fallback
      const rawList = Array.isArray(data?.data?.data)
        ? data.data.data
        : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : [];

      const list = (rawList as UserApiDto[]).map(adaptUserDto);
      const totalCount = data?.data?.meta?.total ?? data?.meta?.total ?? list.length;
      const totalPagesCount =
        (data?.data?.meta?.totalPages ??
          data?.meta?.totalPages ??
          Math.ceil(totalCount / (params?.limit ?? 20))) || 1;

      return {
        data: list,
        meta: {
          total: totalCount,
          page: params?.page ?? 1,
          limit: params?.limit ?? 20,
          totalPages: totalPagesCount,
          hasNextPage: (params?.page ?? 1) < totalPagesCount,
          hasPreviousPage: (params?.page ?? 1) > 1,
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
      const { data } = await api.get(`/users/${id}`);
      const payload = data?.data ?? data;
      return adaptUserDto(payload as UserApiDto);
    },
    enabled: !!id,
    staleTime: 60_000,
  });
}

// ── Hook: KPIs du portefeuille utilisateurs (GET /users/summary/kpis) ─────────

export function useUsersKPIs() {
  return useQuery({
    queryKey: userKeys.kpis(),
    queryFn: async () => {
      const { data } = await api.get('/users/summary/kpis');
      const payload = data?.data ?? data;
      return payload as UsersKPIs;
    },
    staleTime: 30_000,
  });
}

// ── Mutations : Création / Modification / Suppression (Inval chirurgicales) ───

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateUserPayload) => {
      const { data } = await api.post('/users', payload);
      const resp = data?.data ?? data;
      return adaptUserDto(resp as UserApiDto);
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
      const { data } = await api.patch(`/users/${id}`, payload);
      const resp = data?.data ?? data;
      return adaptUserDto(resp as UserApiDto);
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
      await api.delete(`/users/${id}`);
      return id;
    },
    onSuccess: (deletedId) => {
      qc.invalidateQueries({ queryKey: userKeys.list() });
      qc.invalidateQueries({ queryKey: userKeys.kpis() });
      qc.invalidateQueries({ queryKey: userKeys.detail(deletedId) });
    },
  });
}
