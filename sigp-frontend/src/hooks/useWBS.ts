import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { invokeEdgeFunction } from '@/lib/supabaseFunctions';
import type { WBS } from '@/types';

// ── Cache keys ────────────────────────────────────────────────────────────────

export const wbsKeys = {
  all: (projectId: string) => ['wbs', projectId] as const,
};

// ── Ligne Supabase (colonnes snake_case de la table `wbs_nodes`) ──────────────

interface WbsNodeRow {
  id: string;
  project_id: string;
  parent_id: string | null;
  objective_id: string | null;
  code: string;
  libelle: string;
  type: 'PHASE' | 'LOT' | 'ACTIVITE' | 'LIVRABLE';
  ordre: number;
  niveau: number;
  responsable_id: string | null;
  // Tiers externe sans compte système (ex: "Entreprise de construction XYZ")
  // — mutuellement exclusif avec responsable_id côté formulaire.
  responsable_externe: string | null;
  date_debut: string | null;
  date_fin: string | null;
}

const WBS_SELECT = 'id, project_id, parent_id, objective_id, code, libelle, type, ordre, niveau, responsable_id, responsable_externe, date_debut, date_fin';

// ── Ligne Supabase (colonnes utiles de `ptba_activites` pour l'agrégation) ────

interface ActiviteAggRow {
  wbs_id: string | null;
  montant_prevu: number | null;
  taux_realisation: number | null;
}

// ── Adapter: ligne Supabase → frontend ────────────────────────────────────────
// budget_alloue/progression_physique initialisés à 0 ici, TOUJOURS écrasés par
// aggregateBudgetProgression() juste après — jamais la valeur finale affichée.

function adaptNode(row: WbsNodeRow): WBS {
  return {
    id: row.id,
    projet_id: row.project_id,
    parent_id: row.parent_id ?? null,
    code_wbs: row.code,
    titre: row.libelle,
    niveau: row.niveau,
    ordre: row.ordre,
    statut: 'NON_COMMENCE',
    responsable: row.responsable_id ?? '',
    responsable_externe: row.responsable_externe ?? null,
    logframe_ref_id: row.objective_id ?? null,
    date_debut_prevue: row.date_debut ?? undefined,
    date_fin_prevue: row.date_fin ?? undefined,
    budget_alloue: 0,
    progression_physique: 0,
  };
}

// ── Agrégation des activités PTBA liées (ptba_activites.wbs_id), par nœud ────
// Regroupement fait côté client (une seule requête, pas de N+1) plutôt qu'en
// SQL : même approche déjà utilisée pour dashboard-summary/useEvm dans ce projet.

function buildActivityAggregation(rows: ActiviteAggRow[]): Map<string, { budget: number; progressionWeighted: number }> {
  const map = new Map<string, { budget: number; progressionWeighted: number }>();
  for (const row of rows) {
    if (!row.wbs_id) continue;
    const budget = Number(row.montant_prevu ?? 0);
    const taux = Number(row.taux_realisation ?? 0);
    const existing = map.get(row.wbs_id) ?? { budget: 0, progressionWeighted: 0 };
    existing.budget += budget;
    existing.progressionWeighted += budget * taux;
    map.set(row.wbs_id, existing);
  }
  return map;
}

// ── Budget / progression aggregation (upward through tree) ────────────────────
// Nœuds terminaux : somme réelle des activités PTBA liées (ptba_activites.wbs_id).
// Nœuds parents : somme des enfants + activités directement liées (défensif),
// progression = moyenne pondérée par le budget (cohérent avec le calcul EVM).

function aggregateBudgetProgression(
  nodes: WBS[],
  activityAgg: Map<string, { budget: number; progressionWeighted: number }>,
): WBS[] {
  const result = nodes.map(n => ({ ...n }));

  const aggregate = (node: WBS) => {
    const children = result.filter(n => n.parent_id === node.id);
    const direct = activityAgg.get(node.id);
    const directBudget = direct?.budget ?? 0;
    const directProgressionWeighted = direct?.progressionWeighted ?? 0;

    children.forEach(aggregate);
    const childrenBudget = children.reduce((sum, c) => sum + (c.budget_alloue || 0), 0);
    const childrenProgressionWeighted = children.reduce(
      (sum, c) => sum + (c.progression_physique || 0) * (c.budget_alloue || 0),
      0,
    );

    const budget = childrenBudget + directBudget;
    const progressionWeighted = childrenProgressionWeighted + directProgressionWeighted;
    node.budget_alloue = budget;
    node.progression_physique = budget > 0 ? Math.round(progressionWeighted / budget) : 0;
  };

  result.filter(n => !n.parent_id).forEach(aggregate);
  return result;
}

// ── Fetch ─────────────────────────────────────────────────────────────────────

async function fetchWBSList(projectId: string): Promise<WBS[]> {
  const [nodesRes, activitiesRes] = await Promise.all([
    supabase
      .from('wbs_nodes')
      .select(WBS_SELECT)
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .order('niveau', { ascending: true })
      .order('ordre', { ascending: true }),
    supabase
      .from('ptba_activites')
      .select('wbs_id, montant_prevu, taux_realisation')
      .eq('project_id', projectId)
      .is('deleted_at', null),
  ]);
  if (nodesRes.error) throw nodesRes.error;
  if (activitiesRes.error) throw activitiesRes.error;

  const nodes = (nodesRes.data as unknown as WbsNodeRow[]).map(adaptNode);
  const activityAgg = buildActivityAggregation((activitiesRes.data ?? []) as ActiviteAggRow[]);
  return aggregateBudgetProgression(nodes, activityAgg);
}

// ── Payload helpers ───────────────────────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUUID = (val?: string | null): val is string => !!val && UUID_RE.test(val);

function deriveNodeType(parentId?: string | null): 'PHASE' | 'LOT' | 'ACTIVITE' | 'LIVRABLE' {
  return parentId ? 'ACTIVITE' : 'PHASE';
}

// Le code n'est plus auto-généré ici à partir du nombre de frères/sœurs — le
// formulaire (WBSNodeForm) le pré-remplit à titre de suggestion mais laisse
// l'utilisateur le saisir/corriger librement (obligatoire), cf. alignement
// WBS/Matrice PTBA. On fait simplement confiance à la valeur fournie.
function buildCreatePayload(projectId: string, data: Partial<WBS>) {
  return {
    projectId,
    code: (data.code_wbs || '').trim().substring(0, 30).toUpperCase(),
    libelle: data.titre || '',
    type: deriveNodeType(data.parent_id),
    parentId:     isUUID(data.parent_id)      ? data.parent_id      : undefined,
    objectiveId:  isUUID(data.logframe_ref_id) ? data.logframe_ref_id : undefined,
    // string | null (pas juste optionnel) : le formulaire garantit
    // l'exclusivité mutuelle utilisateur/externe (un seul des deux renseigné).
    responsableId: isUUID(data.responsable) ? data.responsable : null,
    responsableExterne: data.responsable_externe?.trim() || null,
    ordre: data.ordre,
    dateDebut: data.date_debut_prevue || undefined,
    dateFin:   data.date_fin_prevue   || undefined,
  };
}

// parentId/code volontairement absents ici : la structure (rattachement +
// code) est fixée à la création et immuable ensuite (cf. WBSNodeForm — mêmes
// champs désactivés en édition) pour éviter d'invalider silencieusement les
// codes des enfants d'un nœud déplacé/renommé.
function buildUpdatePayload(data: Partial<WBS>) {
  return {
    libelle:      data.titre || undefined,
    objectiveId:  isUUID(data.logframe_ref_id)  ? data.logframe_ref_id : undefined,
    responsableId: isUUID(data.responsable)    ? data.responsable     : null,
    responsableExterne: data.responsable_externe?.trim() || null,
    dateDebut: data.date_debut_prevue || undefined,
    dateFin:   data.date_fin_prevue   || undefined,
  };
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useWBS(projectId: string) {
  return useQuery({
    queryKey: wbsKeys.all(projectId),
    queryFn: () => fetchWBSList(projectId).then(data => ({ data })),
    enabled: !!projectId,
  });
}

export function useUpdateWBSOrder(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: { id: string; parent_id?: string | null; ordre: number }[]) => {
      await Promise.all(items.map(item =>
        invokeEdgeFunction<{ data: unknown }>('wbs-update', { id: item.id, ordre: item.ordre }),
      ));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: wbsKeys.all(projectId) }),
  });
}

export function useCreateWBSNode(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ data }: { data: Partial<WBS> }) => {
      const payload = buildCreatePayload(projectId, data);
      const { data: resp } = await invokeEdgeFunction<{ data: unknown }>('wbs-create', payload);
      return resp;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: wbsKeys.all(projectId) }),
    onError: () => qc.invalidateQueries({ queryKey: wbsKeys.all(projectId) }),
  });
}

export function useUpdateWBSNode(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<WBS> }) => {
      const payload = buildUpdatePayload(data);
      const { data: resp } = await invokeEdgeFunction<{ data: unknown }>('wbs-update', { id, ...payload });
      return resp;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: wbsKeys.all(projectId) }),
    onError: () => qc.invalidateQueries({ queryKey: wbsKeys.all(projectId) }),
  });
}

export function useDeleteWBSNode(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await invokeEdgeFunction<{ message: string }>('wbs-delete', { id });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: wbsKeys.all(projectId) }),
    onError: () => qc.invalidateQueries({ queryKey: wbsKeys.all(projectId) }),
  });
}
