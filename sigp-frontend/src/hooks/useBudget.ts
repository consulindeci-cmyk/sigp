import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { invokeEdgeFunction } from '@/lib/supabaseFunctions';
import { dashboardKeys } from '@/hooks/useDashboard';
import type { Budget, BudgetVersion, BudgetLigne, StatutBudget } from '@/types/budget';

// ─── Lignes Supabase (colonnes snake_case) ────────────────────────────────────

interface BudgetVersionRow {
  id: string;
  project_id: string;
  version: number;
  nom: string;
  statut: string;
  montant_total: number | null;
  approuve_par: string | null;
  approuve_le: string | null;
  created_at: string;
  updated_at: string;
}

interface WbsNodeEmbed {
  id: string;
  code: string;
  libelle: string;
}

interface FundingSourceEmbed {
  id: string;
  nom: string;
}

interface BudgetLineRow {
  id: string;
  version_id: string;
  parent_id: string | null;
  code_ligne: string;
  libelle: string;
  categorie: string | null;
  montant_prevu: number;
  montant_engage: number;
  montant_paye: number;
  ordre: number;
  wbs_id: string | null;
  unite: string | null;
  quantite: number | null;
  cout_unitaire: number | null;
  funding_source_id: string | null;
  created_at: string;
  updated_at: string;
  wbs_nodes: WbsNodeEmbed | null;
  funding_sources: FundingSourceEmbed | null;
}

const VERSION_SELECT = 'id, project_id, version, nom, statut, montant_total, approuve_par, approuve_le, created_at, updated_at';
const LINE_SELECT = `
  id, version_id, parent_id, code_ligne, libelle, categorie, montant_prevu,
  montant_engage, montant_paye, ordre, wbs_id, unite, quantite, cout_unitaire,
  funding_source_id, created_at, updated_at,
  wbs_nodes(id, code, libelle),
  funding_sources(id, nom)
`;

// ─── Adapters ─────────────────────────────────────────────────────────────────

function adaptVersionSummary(row: BudgetVersionRow): BudgetVersion {
  return {
    id:                    row.id,
    budget_id:             row.project_id + '-budget',
    numero_version:        row.nom || `v${row.version}`,
    statut:                row.statut as StatutBudget,
    montant_total_initial: row.montant_total ?? 0,
    montant_total_revise:  row.montant_total ?? 0,
    cree_le:               row.created_at,
    approuve_le:           row.approuve_le ?? undefined,
    approuve_par:          row.approuve_par ?? undefined,
    lignes:                undefined,
    revisions:             [],
  };
}

function adaptLine(row: BudgetLineRow): BudgetLigne {
  const prevu  = row.montant_prevu  ?? 0;
  const engage = row.montant_engage ?? 0;
  const paye   = row.montant_paye   ?? 0;
  return {
    id:                row.id,
    budget_version_id: row.version_id,
    version:           1,
    code_ligne:        row.code_ligne,
    wbs_id:            row.wbs_id,
    code_wbs:          row.wbs_nodes?.code ?? row.code_ligne,
    categorie_id:      row.categorie ?? '',
    unite:             row.unite,
    quantite:          row.quantite,
    cout_unitaire:     row.cout_unitaire,
    bailleur_id:       row.funding_source_id ?? '',
    bailleur_nom:      row.funding_sources?.nom,
    montant_initial:   prevu,
    montant_revise:    prevu,
    montant_engage:    engage,
    montant_decaisse:  paye,
    solde_disponible:  Math.max(0, prevu - engage),
    reste_a_payer:     Math.max(0, engage - paye),
    libelle:           row.wbs_nodes?.libelle ?? row.libelle,
  };
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
      const { data, error } = await supabase
        .from('budget_versions')
        .select(VERSION_SELECT)
        .eq('project_id', projetId)
        .is('deleted_at', null);
      if (error) throw error;

      const items = data as unknown as BudgetVersionRow[];
      const versions: BudgetVersion[] = items.map(adaptVersionSummary);

      const active = [...items].sort((a, b) => {
        const pa = STATUT_PRIORITY[a.statut] ?? 0;
        const pb = STATUT_PRIORITY[b.statut] ?? 0;
        if (pa !== pb) return pb - pa;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      })[0];

      return {
        id:                projetId + '-budget',
        projet_id:         projetId,
        devise_ref_id:     'XOF',
        cree_par:          '',
        cree_le:           items[0]?.created_at ?? new Date().toISOString(),
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
        supabase.from('budget_versions').select(VERSION_SELECT).eq('id', versionId as string).single(),
        supabase.from('budget_lignes').select(LINE_SELECT).eq('version_id', versionId as string).is('deleted_at', null).order('ordre', { ascending: true }),
      ]);
      if (vRes.error) throw vRes.error;
      if (lRes.error) throw lRes.error;

      return {
        ...adaptVersionSummary(vRes.data as unknown as BudgetVersionRow),
        lignes: (lRes.data as unknown as BudgetLineRow[]).map(adaptLine),
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
      return invokeEdgeFunction<{ data: BudgetVersionRow }>('budget-versions-update', { id, statut: payload.nouveauStatut });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.versions(projetId) });
      queryClient.invalidateQueries({ queryKey: ['budget-version'] });
      // Un changement de statut de version (ex: passage à APPROUVE) change
      // directement quelles lignes comptent pour le BAC/AC du portefeuille.
      queryClient.invalidateQueries({ queryKey: dashboardKeys.global() });
    },
  });
}

// ─── Line CRUD mutations ──────────────────────────────────────────────────────

export function useCreateBudgetLine(versionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      versionId: string; codeLigne: string; libelle: string; categorie?: string;
      montantPrevu?: number; montantEngage?: number; montantPaye?: number; ordre?: number;
      wbsId?: string; unite?: string; quantite?: number; coutUnitaire?: number; fundingSourceId?: string;
    }) =>
      invokeEdgeFunction<{ data: BudgetLineRow }>('budget-lines-create', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.version(versionId) });
      queryClient.invalidateQueries({ queryKey: budgetKeys.lines(versionId) });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.global() });
    },
  });
}

export function useUpdateBudgetLine(versionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: {
      id: string; codeLigne?: string; libelle?: string; categorie?: string;
      montantPrevu?: number; montantEngage?: number; montantPaye?: number; ordre?: number;
      wbsId?: string | null; unite?: string | null; quantite?: number | null;
      coutUnitaire?: number | null; fundingSourceId?: string | null;
    }) =>
      invokeEdgeFunction<{ data: BudgetLineRow }>('budget-lines-update', { id, ...payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.version(versionId) });
      queryClient.invalidateQueries({ queryKey: budgetKeys.lines(versionId) });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.global() });
    },
  });
}

export function useDeleteBudgetLine(versionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await invokeEdgeFunction<{ message: string }>('budget-lines-delete', { id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.version(versionId) });
      queryClient.invalidateQueries({ queryKey: budgetKeys.lines(versionId) });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.global() });
    },
  });
}

export function useCreateBudgetVersion(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { projectId: string; nom: string; version?: number; statut?: string; montantTotal?: number; notes?: string }) =>
      invokeEdgeFunction<{ data: BudgetVersionRow }>('budget-versions-create', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.versions(projectId) });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.global() });
    },
  });
}
