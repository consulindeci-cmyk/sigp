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
  // responsable_id n'a pas de contrainte FK réelle vers users(id) en base —
  // PostgREST ne peut donc pas résoudre un embed `responsable:users(...)`
  // (400 PGRST200, "Could not find a relationship"). Le nom est résolu par
  // un second aller-retour léger dans useTasks() plutôt que côté requête.
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

// ── Trimestre : ptba_activites l'exige, Tache n'a pas cette notion — dérivé
// depuis date_debut (ou la date du jour à défaut). L'année n'est PLUS dérivée
// ici : elle doit être celle actuellement sélectionnée dans PTBAPage (cf.
// useCreateTask ci-dessous) — sinon une activité créée depuis l'onglet
// Activités atterrissait sous une année différente de celle affichée par la
// Matrice Financière/Calendrier/Gantt, la rendant invisible ailleurs que dans
// la liste des Activités (qui, elle, ne filtrait par aucune année).

function deriveTrimestre(dateDebut?: string | null): number {
  const d = dateDebut ? new Date(dateDebut) : new Date();
  return Math.ceil((d.getMonth() + 1) / 3);
}

// ── Adapter: ligne ptba_activites → Tache ─────────────────────────────────────

function adaptRow(row: PtbaActiviteRow, responsableNames: Map<string, string>): Tache {
  const responsableNom = row.responsable_id ? responsableNames.get(row.responsable_id) ?? null : null;

  return {
    id: row.id,
    projet_id: row.project_id,
    wbs_id: row.wbs_id,
    code_tache: row.code,
    description: row.libelle,
    responsable: responsableNom,
    responsableId: row.responsable_id,
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
  page?: number; limit?: number; statut?: string; wbs_id?: string; annee?: number
}) {
  return useQuery({
    queryKey: taskKeys.list(projectId, params),
    queryFn: async (): Promise<PaginatedResponse<Tache>> => {
      let query = supabase.from('ptba_activites').select(PTBA_SELECT, { count: 'exact' })
        .eq('project_id', projectId).is('deleted_at', null);
      if (params?.wbs_id) query = query.eq('wbs_id', params.wbs_id);
      if (params?.statut) query = query.eq('statut', feStatutToBe(params.statut as StatutTache));
      if (params?.annee) query = query.eq('annee', params.annee);

      const limit = params?.limit ?? 100;
      const page = params?.page ?? 1;
      query = query.range((page - 1) * limit, page * limit - 1);

      const { data, error, count } = await query;
      if (error) throw error;
      const rows = data as unknown as PtbaActiviteRow[];

      // Résolution manuelle des noms de responsables (cf. note sur
      // PtbaActiviteRow.responsable_id) — un seul aller-retour groupé, pas de
      // N+1 (mêmes principes que dashboard-summary/useEvm dans ce projet).
      const responsableIds = [...new Set(rows.map(r => r.responsable_id).filter((id): id is string => !!id))];
      const responsableNames = new Map<string, string>();
      if (responsableIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, nom, prenom')
          .in('id', responsableIds);
        if (usersError) throw usersError;
        for (const u of (usersData ?? []) as { id: string; nom: string | null; prenom: string | null }[]) {
          const nom = `${u.prenom ?? ''} ${u.nom ?? ''}`.trim();
          if (nom) responsableNames.set(u.id, nom);
        }
      }

      const list = rows.map(row => adaptRow(row, responsableNames));
      const total = count ?? list.length;
      return { data: list, meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) } };
    },
    enabled: !!projectId,
  })
}

// Créer une tâche — annee est celle actuellement sélectionnée dans PTBAPage
// (partagée avec la Matrice/Calendrier/Gantt), pas dérivée de date_debut :
// une activité créée depuis l'onglet Activités doit atterrir sous la même
// année que ce que l'utilisateur regarde déjà ailleurs dans le PTBA.
export function useCreateTask(projectId: string, annee: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (dto: Partial<Tache>) => {
      const trimestre = deriveTrimestre(dto.date_debut);
      const { data } = await invokeEdgeFunction<{ data: PtbaActiviteRow }>('ptba-create', {
        projectId,
        code: dto.code_tache,
        libelle: dto.description,
        wbsId: dto.wbs_id ?? undefined,
        responsableId: dto.responsableId ?? undefined,
        dateDebutPrevue: dto.date_debut ?? undefined,
        dateFinPrevue: dto.date_fin ?? undefined,
        montantPrevu: dto.cout_prevu ? Number(dto.cout_prevu) : undefined,
        statut: dto.statut ? feStatutToBe(dto.statut) : undefined,
        annee, trimestres: [trimestre],
      });
      // Nom du responsable non résolu ici (une seule ligne, pas besoin d'un
      // aller-retour dédié) — la liste se rafraîchit de toute façon via
      // l'invalidation ci-dessous, avec le nom correctement résolu.
      return adaptRow(data, new Map());
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all(projectId) })
      qc.invalidateQueries({ queryKey: ['evm', projectId] })
      // usePTBA (Matrice Financière + KPIs de PTBAPage) a sa propre clé de
      // cache ('ptba', pas 'tasks') bien que les deux hooks lisent la même
      // table ptba_activites — sans cette invalidation, la Matrice restait
      // figée sur les anciennes valeurs après une création/modification faite
      // depuis l'onglet Activités.
      qc.invalidateQueries({ queryKey: ['ptba', projectId] })
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
        wbsId: dto.wbs_id ?? undefined,
        responsableId: dto.responsableId ?? undefined,
        dateDebutPrevue: dto.date_debut ?? undefined,
        dateFinPrevue: dto.date_fin ?? undefined,
        montantPrevu: dto.cout_prevu !== undefined ? Number(dto.cout_prevu) : undefined,
        montantRealise: dto.cout_reel !== undefined ? Number(dto.cout_reel) : undefined,
        tauxRealisation: dto.avancement,
        statut: dto.statut ? feStatutToBe(dto.statut) : undefined,
      });
      // Nom du responsable non résolu ici (une seule ligne, pas besoin d'un
      // aller-retour dédié) — la liste se rafraîchit de toute façon via
      // l'invalidation ci-dessous, avec le nom correctement résolu.
      return adaptRow(data, new Map());
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
      qc.invalidateQueries({ queryKey: ['ptba', projectId] })
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
      qc.invalidateQueries({ queryKey: ['ptba', projectId] })
    },
  })
}
