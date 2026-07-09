import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { PTBA, PTBALigne, StatutPTBA } from '@/types/ptba';

// ─── Backend DTO ──────────────────────────────────────────────────────────────

interface PtbaActiviteDto {
  id: string;
  projectId: string;
  wbsId: string | null;
  logframeIndicatorId: string | null;
  code: string;
  libelle: string;
  description: string | null;
  // Backend PtbaStatut: NON_DEMARRE | EN_COURS | TERMINE | ANNULE | EN_RETARD
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

// ─── Statut mapping ───────────────────────────────────────────────────────────

function frontendStatutToBackend(statut: StatutPTBA): string {
  switch (statut) {
    case 'APPROUVE':      return 'TERMINE';
    case 'EN_PREPARATION':
    case 'SOUMIS':        return 'EN_COURS';
    case 'EN_REVISION':
    case 'SUSPENDU':      return 'EN_RETARD';
    case 'ARCHIVE':
    case 'CLOTURE':       return 'ANNULE';
    default:              return 'NON_DEMARRE'; // BROUILLON, REJETE
  }
}

function deriveContainerStatut(activites: PtbaActiviteDto[]): StatutPTBA {
  if (!activites.length) return 'BROUILLON';
  if (activites.every(a => a.statut === 'TERMINE'))   return 'APPROUVE';
  if (activites.some(a => a.statut === 'EN_RETARD'))  return 'EN_REVISION';
  if (activites.some(a => a.statut === 'EN_COURS'))   return 'EN_PREPARATION';
  if (activites.some(a => a.statut === 'ANNULE'))     return 'ARCHIVE';
  return 'BROUILLON';
}

// ─── Budget distribution ──────────────────────────────────────────────────────

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

function extractList(data: unknown): PtbaActiviteDto[] {
  if (Array.isArray(data)) return data as PtbaActiviteDto[];
  if (data && typeof data === 'object') {
    const d = (data as Record<string, unknown>).data;
    if (Array.isArray(d)) return d as PtbaActiviteDto[];
  }
  return [];
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
      const { data } = await api.get('/ptba', {
        params: { projectId, annee, limit: 100 },
      });
      const items = extractList(data);
      return { data: synthesizePtba(projectId, annee, items) };
    },
    enabled: !!projectId && !!annee,
  });
}

export function useWorkflowPTBA(projectId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ptbaId,
      nouveauStatut,
      activityIds,
    }: {
      ptbaId:        string;
      nouveauStatut: StatutPTBA;
      activityIds?:  string[];
      commentaire?:  string;
    }) => {
      const backendStatut = frontendStatutToBackend(nouveauStatut);
      if (activityIds?.length) {
        await Promise.all(
          activityIds.map(id => api.patch(`/ptba/${id}`, { statut: backendStatut }))
        );
      }
      return { success: true, ptbaId };
    },
    onSuccess: (_, vars) => {
      const match = vars.ptbaId.match(/-ptba-(\d{4})$/);
      const annee = match ? Number(match[1]) : 0;
      qc.invalidateQueries({ queryKey: ptbaKeys.list(projectId, annee) });
    },
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
    }) => {
      const { data } = await api.post('/ptba', payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ptbaKeys.list(projectId, annee) });
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
    }) => {
      const { data } = await api.patch(`/ptba/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ptbaKeys.list(projectId, annee) });
    },
  });
}

export function useDeletePtbaActivite(projectId: string, annee: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/ptba/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ptbaKeys.list(projectId, annee) });
    },
  });
}
