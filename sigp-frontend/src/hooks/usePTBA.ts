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
  // Une activité peut s'étaler sur plusieurs trimestres (ex: Q1+Q2+Q3, modèle
  // Excel d'origine) — trimestres integer[] en base, jamais vide.
  trimestres: number[];
  date_debut_prevue: string | null;
  date_fin_prevue: string | null;
  date_debut_reelle: string | null;
  date_fin_reelle: string | null;
  montant_prevu: number | null;
  montant_realise: number | null;
  taux_realisation: number | null;
  responsable_id: string | null;
  // Tiers externe sans compte système (ex: "Entreprise de construction XYZ")
  // — mutuellement exclusif avec responsable_id côté formulaire.
  responsable_externe: string | null;
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
  trimestres: number[];
  dateDebutPrevue: string | null;
  dateFinPrevue: string | null;
  dateDebutReelle: string | null;
  dateFinReelle: string | null;
  montantPrevu: number | null;
  montantRealise: number | null;
  tauxRealisation: number | null;
  responsableId: string | null;
  responsableExterne: string | null;
  createdAt: string;
  updatedAt: string;
}

const PTBA_ACTIVITE_SELECT = `
  id, project_id, wbs_id, logframe_ref_id, code, libelle, description, statut,
  annee, trimestres, date_debut_prevue, date_fin_prevue, date_debut_reelle,
  date_fin_reelle, montant_prevu, montant_realise, taux_realisation,
  responsable_id, responsable_externe, created_at, updated_at
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
    trimestres: row.trimestres,
    dateDebutPrevue: row.date_debut_prevue,
    dateFinPrevue: row.date_fin_prevue,
    dateDebutReelle: row.date_debut_reelle,
    dateFinReelle: row.date_fin_reelle,
    montantPrevu: row.montant_prevu,
    montantRealise: row.montant_realise,
    tauxRealisation: row.taux_realisation,
    responsableId: row.responsable_id,
    responsableExterne: row.responsable_externe,
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

// Répartit le montant total également sur TOUS les mois de TOUS les
// trimestres cochés (ex: Q1+Q2+Q3 → 9 mois se partagent le montant), pas
// seulement sur les 3 mois d'un trimestre unique — cf. modèle Excel d'origine
// où une même activité peut être cochée sur plusieurs trimestres.
function distributeMonthly(montant: number, trimestres: number[]): Record<MonthKey, number> {
  const result = {} as Record<MonthKey, number>;
  ALL_MONTH_KEYS.forEach(k => (result[k] = 0));
  if (trimestres.length === 0) return result;

  const monthKeys: MonthKey[] = [];
  for (const t of [...trimestres].sort((a, b) => a - b)) {
    const startMonth = (t - 1) * 3;
    for (let i = 0; i < 3; i++) monthKeys.push(ALL_MONTH_KEYS[startMonth + i]);
  }

  const base = Math.floor(montant / monthKeys.length);
  const lastKey = monthKeys[monthKeys.length - 1];
  monthKeys.forEach(key => (result[key] = base));
  result[lastKey] = montant - base * (monthKeys.length - 1); // reste sur le dernier mois chronologique
  return result;
}

type CibleKey =
  | 'm1_cible' | 'm2_cible'  | 'm3_cible'
  | 'm4_cible' | 'm5_cible'  | 'm6_cible'
  | 'm7_cible' | 'm8_cible'  | 'm9_cible'
  | 'm10_cible'| 'm11_cible' | 'm12_cible';

// Un point cible (cible physique) par trimestre coché, sur son dernier mois.
function distributeCibles(trimestres: number[]): Record<CibleKey, boolean> {
  const cibles: Record<CibleKey, boolean> = {
    m1_cible: false,  m2_cible: false,  m3_cible: false,
    m4_cible: false,  m5_cible: false,  m6_cible: false,
    m7_cible: false,  m8_cible: false,  m9_cible: false,
    m10_cible: false, m11_cible: false, m12_cible: false,
  };
  for (const t of trimestres) {
    cibles[`m${t * 3}_cible` as CibleKey] = true;
  }
  return cibles;
}

// ─── Adapter ─────────────────────────────────────────────────────────────────

function adaptActivite(dto: PtbaActiviteDto, ptbaId: string): PTBALigne {
  const montant = dto.montantPrevu ?? 0;
  const monthly = distributeMonthly(montant, dto.trimestres);
  const cibles  = distributeCibles(dto.trimestres);

  return {
    id:              dto.id,
    ptba_id:         ptbaId,
    wbs_id:          dto.wbsId ?? dto.code,
    logframe_ref_id: dto.logframeIndicatorId,
    activite_nom:    dto.libelle,
    responsable_id:  dto.responsableId,
    responsable_externe: dto.responsableExterne,
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
      trimestres: number[];
      wbsId?:           string;
      logframeIndicatorId?: string;
      responsableId?:   string | null;
      responsableExterne?: string | null;
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
      trimestres?:     number[];
      montantPrevu?:   number;
      montantRealise?: number;
      tauxRealisation?: number;
      dateDebutPrevue?: string;
      dateFinPrevue?:   string;
      dateDebutReelle?: string;
      dateFinReelle?:   string;
      wbsId?:           string;
      logframeIndicatorId?: string;
      // string | null (pas juste optionnel) : le formulaire envoie toujours
      // les deux pour garantir l'exclusivité mutuelle utilisateur/externe.
      responsableId?:   string | null;
      responsableExterne?: string | null;
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
