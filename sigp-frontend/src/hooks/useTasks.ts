import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { invokeEdgeFunction } from '@/lib/supabaseFunctions'
import type { Tache, StatutTache, PaginatedResponse } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// NOTE : useTasks(projectId) appelait `/projects/:id/tasks`, une route qui n'a
// JAMAIS existé côté NestJS (confirmé) — cet onglet "Activités" était donc
// silencieusement vide en production. Il n'existe pas de table "tasks"
// dédiée : sur validation explicite de l'utilisateur, ce hook est branché sur
// la vraie table `ptba_activites` (déjà migrée avec ses Edge Functions dans
// le module PTBA), avec un mapping de noms de champs — `Tache` et
// `ptba_activites` représentent le même concept d'activité sous deux
// vocabulaires différents. Conséquence assumée : les activités créées ici
// apparaîtront aussi dans l'onglet PTBA (même table), et inversement.
// ─────────────────────────────────────────────────────────────────────────────

interface PtbaActiviteRow {
  id: string;
  project_id: string;
  wbs_id: string | null;
  code: string;
  libelle: string;
  responsable_id: string | null;
  date_debut_prevue: string | null;
  date_fin_prevue: string | null;
  montant_prevu: number | null;
  montant_realise: number | null;
  taux_realisation: number | null;
  statut: string; // NON_DEMARRE | EN_COURS | TERMINE | ANNULE | EN_RETARD
  created_at: string;
  updated_at: string;
}

const PTBA_SELECT = `
  id, project_id, wbs_id, code, libelle, responsable_id, date_debut_prevue,
  date_fin_prevue, montant_prevu, montant_realise, taux_realisation, statut,
  created_at, updated_at
`;

// ── Statut mapping (StatutTache ↔ PtbaStatut) ─────────────────────────────────
// EN_ATTENTE (Tache) et EN_RETARD (Ptba) n'ont pas d'équivalent direct de
// l'autre côté — approximés au plus proche (NON_DEMARRE / EN_COURS).

function beStatutToFe(s: string): StatutTache {
  switch (s) {
    case 'EN_COURS': return 'EN_COURS';
    case 'TERMINE':  return 'TERMINE';
    case 'ANNULE':   return 'ANNULE';
    case 'EN_RETARD': return 'EN_COURS';
    default:          return 'A_FAIRE'; // NON_DEMARRE
  }
}

function feStatutToBe(s: StatutTache): string {
  switch (s) {
    case 'EN_COURS':    return 'EN_COURS';
    case 'TERMINE':     return 'TERMINE';
    case 'ANNULE':      return 'ANNULE';
    case 'EN_ATTENTE':  return 'NON_DEMARRE';
    default:            return 'NON_DEMARRE'; // A_FAIRE
  }
}

// ── Année/trimestre : ptba_activites les exige, Tache n'a pas cette notion —
// dérivés depuis date_debut (ou la date du jour à défaut).

function deriveAnneeTrimestre(dateDebut?: string | null): { annee: number; trimestre: number } {
  const d = dateDebut ? new Date(dateDebut) : new Date();
  return { annee: d.getFullYear(), trimestre: Math.ceil((d.getMonth() + 1) / 3) };
}

// ── Adapter: ligne ptba_activites → Tache ─────────────────────────────────────

function adaptRow(row: PtbaActiviteRow): Tache {
  return {
    id: row.id,
    projet_id: row.project_id,
    wbs_id: row.wbs_id,
    code_tache: row.code,
    description: row.libelle,
    responsable: row.responsable_id,
    date_debut: row.date_debut_prevue,
    date_fin: row.date_fin_prevue,
    cout_prevu: String(row.montant_prevu ?? 0),
    cout_reel: String(row.montant_realise ?? 0),
    avancement: row.taux_realisation ?? 0,
    statut: beStatutToFe(row.statut),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const taskKeys = {
  all: (projectId: string) => ['tasks', projectId] as const,
  list: (projectId: string, params?: object) => [...taskKeys.all(projectId), params] as const,
  detail: (projectId: string, id: string) => [...taskKeys.all(projectId), id] as const,
}

// Liste des tâches d'un projet
export function useTasks(projectId: string, params?: {
  page?: number; limit?: number; statut?: string; wbs_id?: string
}) {
  return useQuery({
    queryKey: taskKeys.list(projectId, params),
    queryFn: async (): Promise<PaginatedResponse<Tache>> => {
      let query = supabase.from('ptba_activites').select(PTBA_SELECT, { count: 'exact' })
        .eq('project_id', projectId).is('deleted_at', null);
      if (params?.wbs_id) query = query.eq('wbs_id', params.wbs_id);
      if (params?.statut) query = query.eq('statut', feStatutToBe(params.statut as StatutTache));

      const limit = params?.limit ?? 100;
      const page = params?.page ?? 1;
      query = query.range((page - 1) * limit, page * limit - 1);

      const { data, error, count } = await query;
      if (error) throw error;
      const list = (data as unknown as PtbaActiviteRow[]).map(adaptRow);
      const total = count ?? list.length;
      return { data: list, meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) } };
    },
    enabled: !!projectId,
  })
}

// Créer une tâche
export function useCreateTask(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (dto: Partial<Tache>) => {
      const { annee, trimestre } = deriveAnneeTrimestre(dto.date_debut);
      const { data } = await invokeEdgeFunction<{ data: PtbaActiviteRow }>('ptba-create', {
        projectId,
        code: dto.code_tache,
        libelle: dto.description,
        wbsId: dto.wbs_id ?? undefined,
        responsableId: dto.responsable ?? undefined,
        dateDebutPrevue: dto.date_debut ?? undefined,
        dateFinPrevue: dto.date_fin ?? undefined,
        montantPrevu: dto.cout_prevu ? Number(dto.cout_prevu) : undefined,
        statut: dto.statut ? feStatutToBe(dto.statut) : undefined,
        annee, trimestre,
      });
      return adaptRow(data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all(projectId) })
      qc.invalidateQueries({ queryKey: ['evm', projectId] })
    },
  })
}

// Mettre à jour une tâche (avec mutation optimiste)
export function useUpdateTask(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...dto }: Partial<Tache> & { id: string }) => {
      const { data } = await invokeEdgeFunction<{ data: PtbaActiviteRow }>('ptba-update', {
        id,
        libelle: dto.description,
        responsableId: dto.responsable ?? undefined,
        dateDebutPrevue: dto.date_debut ?? undefined,
        dateFinPrevue: dto.date_fin ?? undefined,
        montantPrevu: dto.cout_prevu !== undefined ? Number(dto.cout_prevu) : undefined,
        montantRealise: dto.cout_reel !== undefined ? Number(dto.cout_reel) : undefined,
        tauxRealisation: dto.avancement,
        statut: dto.statut ? feStatutToBe(dto.statut) : undefined,
      });
      return adaptRow(data);
    },
    onMutate: async ({ id, ...dto }) => {
      await qc.cancelQueries({ queryKey: taskKeys.list(projectId) })
      const previous = qc.getQueryData<PaginatedResponse<Tache>>(taskKeys.list(projectId))
      if (previous) {
        qc.setQueryData<PaginatedResponse<Tache>>(taskKeys.list(projectId), {
          ...previous,
          data: previous.data.map((t) => (t.id === id ? { ...t, ...dto } : t)),
        })
      }
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(taskKeys.list(projectId), ctx.previous)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all(projectId) })
      qc.invalidateQueries({ queryKey: ['evm', projectId] })
    },
  })
}

// Supprimer une tâche
export function useDeleteTask(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (taskId: string) => {
      await invokeEdgeFunction<{ message: string }>('ptba-delete', { id: taskId })
      return taskId
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all(projectId) })
      qc.invalidateQueries({ queryKey: ['evm', projectId] })
    },
  })
}
