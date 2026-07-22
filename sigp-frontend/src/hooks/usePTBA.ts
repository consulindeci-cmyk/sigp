import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { invokeEdgeFunction } from '@/lib/supabaseFunctions';
import { dashboardKeys } from '@/hooks/useDashboard';
import type { PTBA, PTBALigne, StatutPTBA } from '@/types/ptba';

// ─── Ligne Supabase (colonnes snake_case de la table `ptba_activites`) ────────

interface PtbaActiviteRow {
  id: string;
  project_id: string;
  wbs_id: string | null;
  logframe_ref_id: string | null;
  code: string;
  libelle: string;
  description: string | null;
  statut: string; // NON_DEMARRE | EN_COURS | TERMINE | ANNULE | EN_RETARD
  annee: number;
  trimestre: number;
  date_debut_prevue: string | null;
  date_fin_prevue: string | null;
  date_debut_reelle: string | null;
  date_fin_reelle: string | null;
  montant_prevu: number | null;
  montant_realise: number | null;
  taux_realisation: number | null;
  responsable_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PtbaActiviteDto {
  id: string;
  projectId: string;
  wbsId: string | null;
  logframeIndicatorId: string | null;
  code: string;
  libelle: string;
  description: string | null;
  statut: string;
  annee: number;
  trimestre: number;
  dateDebutPrevue: string | null;
  dateFinPrevue: string | null;
  dateDebutReelle: string | null;
  dateFinReelle: string | null;
  montantPrevu: number | null;
  montantRealise: number | null;
  tauxRealisation: number | null;
  responsableId: string | null;
  createdAt: string;
  updatedAt: string;
}

const PTBA_ACTIVITE_SELECT = `
  id, project_id, wbs_id, logframe_ref_id, code, libelle, description, statut,
  annee, trimestre, date_debut_prevue, date_fin_prevue, date_debut_reelle,
  date_fin_reelle, montant_prevu, montant_realise, taux_realisation,
  responsable_id, created_at, updated_at
`;

function rowToDto(row: PtbaActiviteRow): PtbaActiviteDto {
  return {
    id: row.id,
    projectId: row.project_id,
    wbsId: row.wbs_id,
    logframeIndicatorId: row.logframe_ref_id,
    code: row.code,
    libelle: row.libelle,
    description: row.description,
    statut: row.statut,
    annee: row.annee,
    trimestre: row.trimestre,
    dateDebutPrevue: row.date_debut_prevue,
    dateFinPrevue: row.date_fin_prevue,
    dateDebutReelle: row.date_debut_reelle,
    dateFinReelle: row.date_fin_reelle,
    montantPrevu: row.montant_prevu,
    montantRealise: row.montant_realise,
    tauxRealisation: row.taux_realisation,
    responsableId: row.responsable_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── Statut mapping (inchangé) ────────────────────────────────────────────────

function deriveContainerStatut(activites: PtbaActiviteDto[]): StatutPTBA {
  if (!activites.length) return 'BROUILLON';
  if (activites.every(a => a.statut === 'TERMINE'))   return 'APPROUVE';
  if (activites.some(a => a.statut === 'EN_RETARD'))  return 'EN_REVISION';
  if (activites.some(a => a.statut === 'EN_COURS'))   return 'EN_PREPARATION';
  if (activites.some(a => a.statut === 'ANNULE'))     return 'ARCHIVE';
  return 'BROUILLON';
}

// ─── Budget distribution (inchangé) ───────────────────────────────────────────

type MonthKey =
  | 'm1_montant' | 'm2_montant'  | 'm3_montant'
  | 'm4_montant' | 'm5_montant'  | 'm6_montant'
  | 'm7_montant' | 'm8_montant'  | 'm9_montant'
  | 'm10_montant'| 'm11_montant' | 'm12_montant';

const ALL_MONTH_KEYS: MonthKey[] = [
  'm1_montant','m2_montant','m3_montant',
  'm4_montant','m5_montant','m6_montant',
  'm7_montant','m8_montant','m9_montant',
  'm10_montant','m11_montant','m12_montant',
];

function distributeMonthly(montant: number, trimestre: number): Record<MonthKey, number> {
  const base = Math.floor(montant / 3);
  const extra = montant - base * 2; // last month of quarter gets the remainder
  const result = {} as Record<MonthKey, number>;
  ALL_MONTH_KEYS.forEach(k => (result[k] = 0));
  const startMonth = (trimestre - 1) * 3; // 0-indexed offset
  for (let i = 0; i < 3; i++) {
    const key = ALL_MONTH_KEYS[startMonth + i];
    result[key] = i < 2 ? base : extra;
  }
  return result;
}

type CibleKey =
  | 'm1_cible' | 'm2_cible'  | 'm3_cible'
  | 'm4_cible' | 'm5_cible'  | 'm6_cible'
  | 'm7_cible' | 'm8_cible'  | 'm9_cible'
  | 'm10_cible'| 'm11_cible' | 'm12_cible';

function distributeCibles(trimestre: number): Record<CibleKey, boolean> {
  const cibles: Record<CibleKey, boolean> = {
    m1_cible: false,  m2_cible: false,  m3_cible: false,
    m4_cible: false,  m5_cible: false,  m6_cible: false,
    m7_cible: false,  m8_cible: false,  m9_cible: false,
    m10_cible: false, m11_cible: false, m12_cible: false,
  };
  const lastMonthOfQuarter = `m${trimestre * 3}_cible` as CibleKey;
  cibles[lastMonthOfQuarter] = true;
  return cibles;
}

// ─── Adapter ─────────────────────────────────────────────────────────────────

function adaptActivite(dto: PtbaActiviteDto, ptbaId: string): PTBALigne {
  const montant = dto.montantPrevu ?? 0;
  const monthly = distributeMonthly(montant, dto.trimestre);
  const cibles  = distributeCibles(dto.trimestre);

  return {
    id:              dto.id,
    ptba_id:         ptbaId,
    wbs_id:          dto.wbsId ?? dto.code,
    logframe_ref_id: dto.logframeIndicatorId,
    activite_nom:    dto.libelle,
    responsable_id:  dto.responsableId,
    devise:          'XOF',
    taux_change_ref: 1,
    is_procurement:  false,
    quantite:        1,
    unite_mesure:    'Forfait',
    cout_unitaire:   montant,
    montant_total:   montant,

    ...monthly,
    q1_montant: monthly.m1_montant + monthly.m2_montant + monthly.m3_montant,
    q2_montant: monthly.m4_montant + monthly.m5_montant + monthly.m6_montant,
    q3_montant: monthly.m7_montant + monthly.m8_montant + monthly.m9_montant,
    q4_montant: monthly.m10_montant + monthly.m11_montant + monthly.m12_montant,

    cibles_physiques: dto.description ?? '',
    ...cibles,

    montant_engage:        0,
    montant_decaisse:      dto.montantRealise    ?? 0,
    progression_physique:  dto.tauxRealisation   ?? 0,
  };
}

function synthesizePtba(projectId: string, annee: number, activites: PtbaActiviteDto[]): PTBA {
  const ptbaId = `${projectId}-ptba-${annee}`;
  return {
    id:                 ptbaId,
    projet_id:          projectId,
    annee,
    statut:             deriveContainerStatut(activites),
    version_majeure:    1,
    version_mineure:    0,
    nom_version:        `PTBA ${annee} v1.0`,
    cree_par:           '',
    date_creation:      activites[0]?.createdAt ?? new Date().toISOString(),
    budget_total:       activites.reduce((s, a) => s + (a.montantPrevu ?? 0), 0),
    lignes:             activites.map(a => adaptActivite(a, ptbaId)),
    historique_workflow: [],
  };
}

// ─── Query keys ───────────────────────────────────────────────────────────────

export const ptbaKeys = {
  list:     (projectId: string, annee: number) => ['ptba', projectId, annee] as const,
  activite: (id: string)                        => ['ptba-activite', id]     as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function usePTBA(projectId: string, annee: number) {
  return useQuery({
    queryKey: ptbaKeys.list(projectId, annee),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ptba_activites')
        .select(PTBA_ACTIVITE_SELECT)
        .eq('project_id', projectId)
        .eq('annee', annee)
        .is('deleted_at', null)
        .limit(100);
      if (error) throw error;
      const items = (data as unknown as PtbaActiviteRow[]).map(rowToDto);
      return { data: synthesizePtba(projectId, annee, items) };
    },
    enabled: !!projectId && !!annee,
  });
}


// Ligne brute pour l'édition — PTBALigne (via usePTBA) est une synthèse à
// perte (ex: wbs_id = dto.wbsId ?? dto.code, montants mensuels recalculés) :
// un formulaire d'édition a besoin des vraies colonnes, pas de la version
// affichée dans la matrice.
export function usePtbaActivite(id: string) {
  return useQuery({
    queryKey: ptbaKeys.activite(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ptba_activites')
        .select(PTBA_ACTIVITE_SELECT)
        .eq('id', id)
        .is('deleted_at', null)
        .single();
      if (error) throw error;
      return rowToDto(data as unknown as PtbaActiviteRow);
    },
    enabled: !!id,
  });
}

// ─── Activity CRUD ────────────────────────────────────────────────────────────

export function useCreatePtbaActivite(projectId: string, annee: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      projectId: string;
      code:       string;
      libelle:    string;
      annee:      number;
      trimestre:  number;
      wbsId?:           string;
      logframeIndicatorId?: string;
      responsableId?:   string;
      dateDebutPrevue?: string;
      dateFinPrevue?:   string;
      montantPrevu?:    number;
      description?:     string;
      statut?:          string;
    }) => invokeEdgeFunction<{ data: PtbaActiviteRow }>('ptba-create', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ptbaKeys.list(projectId, annee) });
      qc.invalidateQueries({ queryKey: dashboardKeys.global() });
    },
  });
}

export function useUpdatePtbaActivite(projectId: string, annee: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: {
      id:              string;
      libelle?:        string;
      description?:    string;
      statut?:         string;
      trimestre?:      number;
      montantPrevu?:   number;
      montantRealise?: number;
      tauxRealisation?: number;
      dateDebutPrevue?: string;
      dateFinPrevue?:   string;
      dateDebutReelle?: string;
      dateFinReelle?:   string;
      wbsId?:           string;
      responsableId?:   string;
    }) => invokeEdgeFunction<{ data: PtbaActiviteRow }>('ptba-update', { id, ...payload }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ptbaKeys.list(projectId, annee) });
      qc.invalidateQueries({ queryKey: dashboardKeys.global() });
    },
  });
}

export function useDeletePtbaActivite(projectId: string, annee: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await invokeEdgeFunction<{ message: string }>('ptba-delete', { id });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ptbaKeys.list(projectId, annee) });
      qc.invalidateQueries({ queryKey: dashboardKeys.global() });
    },
  });
}
