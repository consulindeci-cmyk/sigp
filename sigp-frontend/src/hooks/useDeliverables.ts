import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { invokeEdgeFunction } from '@/lib/supabaseFunctions';
import type { Livrable, StatutLivrable, LivrableCategorie, PrioriteLivrable } from '@/types';

// ── Ligne Supabase (colonnes snake_case de la table `livrables`) ──────────────

interface LivrableRow {
  id: string;
  project_id: string;
  wbs_id: string | null;
  code: string | null;
  nom: string;
  description: string | null;
  statut: string;  // NON_COMMENCE | EN_COURS | SOUMIS | EN_REVISION | VALIDE | REJETE | EN_RETARD
  date_prevue: string | null;
  date_soumission: string | null;
  date_validation: string | null;
  responsable_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const LIVRABLE_SELECT = `
  id, project_id, wbs_id, code, nom, description, statut, date_prevue,
  date_soumission, date_validation, responsable_id, notes, created_at, updated_at
`;

// ── Extra metadata stored in `notes` (inchangé, indépendant du backend) ──────

const LIV_META_PREFIX = '__LIV_META__:';

interface LivMeta {
  categorie:   LivrableCategorie;
  composante?: string;
  responsable: string;
  avancement:  number;
  priorite:    PrioriteLivrable;
}

function encodeMeta(meta: LivMeta): string {
  return `${LIV_META_PREFIX}${JSON.stringify(meta)}`;
}

function decodeMeta(notes: string | null | undefined): LivMeta | null {
  if (!notes?.startsWith(LIV_META_PREFIX)) return null;
  try { return JSON.parse(notes.slice(LIV_META_PREFIX.length)) as LivMeta; }
  catch { return null; }
}

// ── Status mapping ─────────────────────────────────────────────────────────────
// Corrigé : l'enum réel côté base (LivrableStatus) est
// NON_COMMENCE | EN_COURS | SOUMIS | EN_REVISION | VALIDE | REJETE | EN_RETARD.
// L'ancien mapping envoyait 'REFUSE' et 'CLOTURE', deux valeurs qui n'existent
// PAS dans cet enum — un choix "Refusé" ou "Terminé" dans l'UI aurait fait
// échouer la sauvegarde côté serveur (valeur d'enum invalide). Corrigé ici :
// REFUSE ↔ REJETE, TERMINE ↔ VALIDE (pas d'état "clôturé" distinct de "validé"
// dans l'enum réel). EN_REVISION/EN_RETARD n'ont pas d'équivalent direct côté
// UI — approximés en SOUMIS/EN_COURS plutôt que silencieusement rangés en
// "à faire" comme le faisait l'ancien fallback.

function beStatutToFe(s: string): StatutLivrable {
  if (s === 'EN_COURS')    return 'EN_COURS';
  if (s === 'SOUMIS')      return 'SOUMIS';
  if (s === 'EN_REVISION') return 'SOUMIS';
  if (s === 'VALIDE')      return 'VALIDE';
  if (s === 'REJETE')      return 'REFUSE';
  if (s === 'EN_RETARD')   return 'EN_COURS';
  return 'A_FAIRE'; // NON_COMMENCE
}

function feStatutToBe(s: StatutLivrable): string {
  if (s === 'EN_COURS') return 'EN_COURS';
  if (s === 'SOUMIS')   return 'SOUMIS';
  if (s === 'VALIDE')   return 'VALIDE';
  if (s === 'REFUSE')   return 'REJETE';
  if (s === 'TERMINE')  return 'VALIDE';
  return 'NON_COMMENCE'; // A_FAIRE
}

function isoDate(val: string | null | undefined): string {
  if (!val) return '';
  try { return new Date(val).toISOString().slice(0, 10); }
  catch { return ''; }
}

// ── Adapter: ligne Supabase → frontend Livrable ───────────────────────────────
// responsable_id est une vraie FK vers users(id), transmise depuis peu (cf.
// audit Livrables) — le nom affiché est résolu via un aller-retour groupé
// (mêmes principes que useRisks.ts/useTasks.ts), pas d'embed PostgREST.

function adaptLivrable(row: LivrableRow, responsableNames: Map<string, string>): Livrable {
  const meta = decodeMeta(row.notes);
  return {
    id:            row.id,
    projet_id:     row.project_id,
    code_livrable: row.code ?? `LIV-${row.id.slice(0, 8).toUpperCase()}`,
    nom:           row.nom,
    description:   row.description ?? undefined,
    categorie:     meta?.categorie  ?? 'Autre',
    composante:    meta?.composante ?? undefined,
    responsable:   row.responsable_id ? responsableNames.get(row.responsable_id) ?? '' : (meta?.responsable ?? ''),
    responsableId: row.responsable_id,
    date_prevue:   isoDate(row.date_prevue),
    date_reelle:   isoDate(row.date_validation) || isoDate(row.date_soumission) || undefined,
    avancement:    meta?.avancement ?? 0,
    statut:        beStatutToFe(row.statut),
    priorite:      meta?.priorite   ?? 'MOYENNE',
    createdAt:     row.created_at,
    updatedAt:     row.updated_at,
  };
}

// ── Payload builders ──────────────────────────────────────────────────────────

type LivPayload = Omit<Livrable, 'id' | 'createdAt' | 'updatedAt'>;

function buildCreatePayload(projectId: string, l: LivPayload) {
  const meta: LivMeta = {
    categorie:   l.categorie,
    composante:  l.composante,
    responsable: l.responsable,
    avancement:  l.avancement,
    priorite:    l.priorite,
  };
  return {
    projectId,
    nom:           l.nom,
    code:          l.code_livrable || undefined,
    description:   l.description   || undefined,
    statut:        feStatutToBe(l.statut),
    datePrevue:    l.date_prevue   || undefined,
    responsableId: l.responsableId || undefined,
    notes:         encodeMeta(meta),
  };
}

function buildUpdatePayload(l: Partial<Livrable>, current?: Livrable) {
  const meta: LivMeta = {
    categorie:   l.categorie   ?? current?.categorie  ?? 'Autre',
    composante:  l.composante  ?? current?.composante,
    responsable: l.responsable ?? current?.responsable ?? '',
    avancement:  l.avancement  ?? current?.avancement ?? 0,
    priorite:    l.priorite    ?? current?.priorite   ?? 'MOYENNE',
  };
  const p: Record<string, unknown> = { notes: encodeMeta(meta) };
  if (l.nom           !== undefined) p.nom           = l.nom;
  if (l.code_livrable !== undefined) p.code          = l.code_livrable;
  if (l.description   !== undefined) p.description   = l.description;
  if (l.statut        !== undefined) p.statut        = feStatutToBe(l.statut);
  if (l.date_prevue   !== undefined) p.datePrevue    = l.date_prevue || undefined;
  if (l.responsableId !== undefined) p.responsableId = l.responsableId || null;
  return p;
}

// ── Cache keys ────────────────────────────────────────────────────────────────

export const deliverableKeys = {
  all: (projectId: string) => ['deliverables', projectId] as const,
};

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useDeliverables(projectId: string) {
  return useQuery({
    queryKey: deliverableKeys.all(projectId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('livrables')
        .select(LIVRABLE_SELECT)
        .eq('project_id', projectId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      const rows = data as unknown as LivrableRow[];

      // Résolution groupée des noms de responsables (cf. note sur
      // LivrableRow.responsable_id) — un seul aller-retour, pas de N+1.
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

      const livrables = rows.map(row => adaptLivrable(row, responsableNames));
      return { data: livrables, meta: { total: livrables.length, page: 1, limit: 100, totalPages: 1 } };
    },
    enabled: !!projectId,
  });
}

export function useCreateDeliverable(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: Omit<Livrable, 'id' | 'createdAt' | 'updatedAt'>) => {
      const payload = buildCreatePayload(projectId, dto);
      const { data } = await invokeEdgeFunction<{ data: LivrableRow }>('livrables-create', payload);
      // Nom du responsable non résolu ici (une seule ligne) — la liste se
      // rafraîchit de toute façon via l'invalidation ci-dessous.
      return adaptLivrable(data, new Map());
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: deliverableKeys.all(projectId) }),
  });
}

export function useUpdateDeliverable(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...dto }: Partial<Livrable> & { id: string }) => {
      const cached = qc.getQueryData<{ data: Livrable[] }>(deliverableKeys.all(projectId));
      const current = cached?.data?.find(l => l.id === id);
      const payload = buildUpdatePayload(dto, current);
      const { data } = await invokeEdgeFunction<{ data: LivrableRow }>('livrables-update', { id, ...payload });
      return adaptLivrable(data, new Map());
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: deliverableKeys.all(projectId) }),
  });
}

export function useDeleteDeliverable(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (livrableId: string) => {
      await invokeEdgeFunction<{ message: string }>('livrables-delete', { id: livrableId });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: deliverableKeys.all(projectId) }),
  });
}
