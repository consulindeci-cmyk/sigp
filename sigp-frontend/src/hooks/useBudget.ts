import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { Budget, BudgetVersion, BudgetLigne, StatutBudget } from '@/types/budget';

// ─── Backend DTOs ─────────────────────────────────────────────────────────────

interface BudgetVersionDto {
  id: string;
  projectId: string;
  version: number;
  nom: string;
  statut: string;
  montantTotal: number | null;
  approvePar: string | null;
  approuveLe: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface BudgetLineDto {
  id: string;
  versionId: string;
  parentId: string | null;
  codeLigne: string;
  libelle: string;
  categorie: string | null;
  montantPrevu: number;
  montantEngage: number;
  montantPaye: number;
  ordre: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Adapters ─────────────────────────────────────────────────────────────────

function adaptVersionSummary(dto: BudgetVersionDto): BudgetVersion {
  return {
    id:                    dto.id,
    budget_id:             dto.projectId + '-budget',
    numero_version:        dto.nom || `v${dto.version}`,
    statut:                dto.statut as StatutBudget,
    montant_total_initial: dto.montantTotal ?? 0,
    montant_total_revise:  dto.montantTotal ?? 0,
    cree_le:               dto.createdAt,
    approuve_le:           dto.approuveLe ?? undefined,
    approuve_par:          dto.approvePar ?? undefined,
    lignes:                undefined,
    revisions:             [],
  };
}

function adaptLine(dto: BudgetLineDto): BudgetLigne {
  const prevu  = dto.montantPrevu  ?? 0;
  const engage = dto.montantEngage ?? 0;
  const paye   = dto.montantPaye   ?? 0;
  return {
    id:                    dto.id,
    budget_version_id:     dto.versionId,
    version:               1,
    wbs_id:                dto.codeLigne,
    bailleur_id:           '',
    source_financement_id: dto.categorie ?? '',
    categorie_id:          dto.categorie ?? '',
    compte_comptable_id:   undefined,
    montant_initial:       prevu,
    montant_revise:        prevu,
    montant_pre_engage:    0,
    montant_engage:        engage,
    montant_liquide:       0,
    montant_decaisse:      paye,
    solde_disponible:      Math.max(0, prevu - engage),
    reste_a_payer:         Math.max(0, engage - paye),
    wbs_nom:               dto.libelle,
    bailleur_nom:          undefined,
  };
}

function extractList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object' && Array.isArray((data as any).data)) return (data as any).data as T[];
  return [];
}

// Higher priority = preferred as active version
const STATUT_PRIORITY: Record<string, number> = {
  APPROUVE:    4,
  SOUMIS:      3,
  EN_REVISION: 2,
  BROUILLON:   1,
  ARCHIVE:     0,
};

// ─── Query keys ───────────────────────────────────────────────────────────────

export const budgetKeys = {
  versions: (projectId: string) => ['budget-versions', projectId] as const,
  version:  (versionId: string) => ['budget-version', versionId]  as const,
  lines:    (versionId: string) => ['budget-lines',   versionId]  as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useBudget(projetId: string) {
  return useQuery({
    queryKey: budgetKeys.versions(projetId),
    queryFn: async (): Promise<Budget> => {
      const { data } = await api.get('/budget-versions', { params: { projectId: projetId } });
      const items = extractList<BudgetVersionDto>(data);
      const versions: BudgetVersion[] = items.map(adaptVersionSummary);

      const active = [...items].sort((a, b) => {
        const pa = STATUT_PRIORITY[a.statut] ?? 0;
        const pb = STATUT_PRIORITY[b.statut] ?? 0;
        if (pa !== pb) return pb - pa;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })[0];

      return {
        id:                projetId + '-budget',
        projet_id:         projetId,
        devise_ref_id:     'XOF',
        cree_par:          '',
        cree_le:           items[0]?.createdAt ?? new Date().toISOString(),
        version_active_id: active?.id ?? '',
        versions,
      };
    },
    enabled: !!projetId,
  });
}

export function useBudgetVersion(projetId: string, versionId?: string) {
  return useQuery({
    queryKey: budgetKeys.version(versionId ?? ''),
    queryFn: async (): Promise<BudgetVersion> => {
      const [vRes, lRes] = await Promise.all([
        api.get(`/budget-versions/${versionId}`),
        api.get('/budget-lines', { params: { versionId } }),
      ]);

      const dto: BudgetVersionDto = vRes.data?.data ?? vRes.data;
      const lineItems = extractList<BudgetLineDto>(lRes.data);

      return {
        ...adaptVersionSummary(dto),
        lignes: lineItems.map(adaptLine),
      };
    },
    enabled: !!projetId && !!versionId,
  });
}

export function useBudgetWorkflow(projetId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      budgetId:      string;
      versionId?:    string;
      nouveauStatut: string;
      commentaire?:  string;
    }) => {
      const id = payload.versionId ?? payload.budgetId;
      const { data } = await api.patch(`/budget-versions/${id}`, { statut: payload.nouveauStatut });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.versions(projetId) });
      queryClient.invalidateQueries({ queryKey: ['budget-version'] });
    },
  });
}

// ─── Line CRUD mutations ──────────────────────────────────────────────────────

export function useCreateBudgetLine(versionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { versionId: string; codeLigne: string; libelle: string; categorie?: string; montantPrevu?: number; ordre?: number }) => {
      const { data } = await api.post('/budget-lines', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.version(versionId) });
      queryClient.invalidateQueries({ queryKey: budgetKeys.lines(versionId) });
    },
  });
}

export function useUpdateBudgetLine(versionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; codeLigne?: string; libelle?: string; categorie?: string; montantPrevu?: number; montantEngage?: number; montantPaye?: number; ordre?: number }) => {
      const { data } = await api.patch(`/budget-lines/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.version(versionId) });
      queryClient.invalidateQueries({ queryKey: budgetKeys.lines(versionId) });
    },
  });
}

export function useDeleteBudgetLine(versionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/budget-lines/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.version(versionId) });
      queryClient.invalidateQueries({ queryKey: budgetKeys.lines(versionId) });
    },
  });
}

export function useCreateBudgetVersion(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { projectId: string; nom: string; version?: number; statut?: string; montantTotal?: number; notes?: string }) => {
      const { data } = await api.post('/budget-versions', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.versions(projectId) });
    },
  });
}
