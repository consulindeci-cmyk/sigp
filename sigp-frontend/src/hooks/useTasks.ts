import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import type { Tache, StatutTache, PaginatedResponse } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// NOTE : useTasks(projectId) appelait `/projects/:id/tasks`, une route qui n'a
// JAMAIS existé côté NestJS (confirmé). Il n'existe pas de table "tasks"
// dédiée : ce hook lit la vraie table `ptba_activites` (module PTBA), avec un
// mapping de noms de champs — `Tache` et `ptba_activites` représentent le
// même concept d'activité sous deux vocabulaires différents. Lecture seule
// ici : la création/modification/suppression se fait exclusivement depuis la
// Matrice Financière (PTBAPage/usePTBA) — l'ancien onglet "Activités" qui
// dupliquait ce CRUD via ce hook a été supprimé (cf. optimisation UX PTBA :
// fusion des vues, un seul point de saisie pour éviter les incohérences
// d'année/trimestre entre les deux surfaces).
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
