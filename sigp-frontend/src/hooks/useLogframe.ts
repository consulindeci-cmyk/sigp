import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { invokeEdgeFunction } from '@/lib/supabaseFunctions';
import type { CadreLogique } from '@/types';

// ── Cache keys ────────────────────────────────────────────────────────────────

export const logframeKeys = {
  all: (projectId: string) => ['logframe', projectId] as const,
};

// ── Level mapping (backend ↔ frontend) ────────────────────────────────────────
// Backend LogframeLevel: OBJECTIF_GLOBAL | OBJECTIF_SPECIFIQUE | RESULTAT | ACTIVITE
// Frontend niveau_intervention: IMPACT | OBJECTIF | RESULTAT | PRODUIT | ACTIVITE
// PRODUIT n'a pas d'équivalent backend historique (contrainte niveau non
// modifiée) → toujours compressé sur RESULTAT pour cette colonne-là, mais le
// niveau réel est désormais porté par sa propre colonne niveau_intervention_fe
// (logframe_objectives), plus par un JSON caché dans description.

type FELevel = CadreLogique['niveau_intervention'];
type BELevel = 'OBJECTIF_GLOBAL' | 'OBJECTIF_SPECIFIQUE' | 'RESULTAT' | 'ACTIVITE';

const FE_TO_BE: Record<FELevel, BELevel> = {
  IMPACT:   'OBJECTIF_GLOBAL',
  OBJECTIF: 'OBJECTIF_SPECIFIQUE',
  RESULTAT: 'RESULTAT',
  PRODUIT:  'RESULTAT',   // pas d'équivalent backend — la vraie valeur vit dans niveau_intervention_fe
  ACTIVITE: 'ACTIVITE',
};

// ── Ligne Supabase (colonnes snake_case de `logframe_objectives`, avec
// l'indicateur IOV principal embarqué depuis `logframe_indicators`) ──────────

interface LogframeIndicatorEmbed {
  id: string;
  libelle: string | null;
  valeur_baseline: number | null;
  valeur_cible: number | null;
  unite: string | null;
  source_verification: string | null;
  deleted_at: string | null;
}

interface LogframeObjectiveRow {
  id: string;
  project_id: string;
  niveau_intervention_fe: FELevel;
  code: string;
  libelle: string;
  hypotheses: string | null;
  parent_id: string | null;
  ordre: number;
  actif: boolean;
  created_at: string;
  updated_at: string;
  logframe_indicators: LogframeIndicatorEmbed[] | null;
}

const OBJECTIVE_SELECT = `
  id, project_id, niveau_intervention_fe, code, libelle, hypotheses, parent_id, ordre, actif,
  created_at, updated_at,
  logframe_indicators(id, libelle, valeur_baseline, valeur_cible, unite, source_verification, deleted_at)
`;

// ── Adapter: ligne Supabase → CadreLogique ────────────────────────────────────

function adaptObjective(row: LogframeObjectiveRow): CadreLogique {
  const indicator = (row.logframe_indicators ?? []).find(i => !i.deleted_at) ?? null;

  return {
    id:                   row.id,
    projet_id:            row.project_id,
    parent_id:            row.parent_id ?? null,
    niveau_intervention:  row.niveau_intervention_fe,
    description:          row.libelle,
    indicateur:           indicator?.libelle ?? undefined,
    indicator_id:         indicator?.id ?? null,
    valeur_reference:     indicator?.valeur_baseline ?? null,
    cible:                indicator?.valeur_cible ?? null,
    unite:                indicator?.unite ?? null,
    source_verification:  indicator?.source_verification ?? undefined,
    hypotheses:           row.hypotheses ?? undefined,
  };
}

// ── Fetch ─────────────────────────────────────────────────────────────────────

async function fetchObjectives(projectId: string): Promise<CadreLogique[]> {
  const { data, error } = await supabase
    .from('logframe_objectives')
    .select(OBJECTIVE_SELECT)
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .order('ordre', { ascending: true })
    .limit(100);
  if (error) throw error;
  return (data as unknown as LogframeObjectiveRow[]).map(adaptObjective);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUUID = (val?: string | null): val is string => !!val && UUID_RE.test(val);

const NIVEAU_ABBREV: Record<FELevel, string> = {
  IMPACT: 'OG', OBJECTIF: 'OS', RESULTAT: 'RS', PRODUIT: 'PR', ACTIVITE: 'AC',
};

// Classification IOV standard (chaîne de résultats) — un indicateur n'est
// jamais créé pour ACTIVITE (cf. hasIndicatorData / section masquée dans
// LogframeForm), d'où l'absence de mapping pour ce niveau.
const NIVEAU_TO_INDICATOR_TYPE: Record<Exclude<FELevel, 'ACTIVITE'>, 'IMPACT' | 'OUTCOME' | 'OUTPUT'> = {
  IMPACT: 'IMPACT', OBJECTIF: 'OUTCOME', RESULTAT: 'OUTPUT', PRODUIT: 'OUTPUT',
};

function generateCode(prefix: string, feNiveau: FELevel, existingItems: CadreLogique[]): string {
  const abbrev = NIVEAU_ABBREV[feNiveau];
  const count = existingItems.filter(i => i.niveau_intervention === feNiveau).length + 1;
  return `${prefix}-${abbrev}-${count}-${Date.now().toString(36)}`.substring(0, 24).toUpperCase();
}

// Un indicateur IOV n'a de sens que pour les niveaux non-ACTIVITE — reflète
// exactement la section "Mesure & Vérification" masquée pour ACTIVITE côté
// LogframeForm.
function hasIndicatorData(data: Partial<CadreLogique>): boolean {
  return (
    !!data.indicateur?.trim() ||
    data.valeur_reference != null ||
    data.cible != null ||
    !!data.unite?.trim() ||
    !!data.source_verification?.trim()
  );
}

// `?? undefined` / `|| undefined` effaceraient la distinction entre "champ
// non fourni" (undefined → l'Edge Function ignore la clé, ne touche pas la
// valeur existante) et "champ explicitement vidé" (null → l'Edge Function
// écrase avec null) : LogframeForm envoie toujours null/'' quand l'utilisateur
// vide Baseline/Cible/Unité/Source, ce qui doit réellement effacer la valeur
// stockée plutôt que de la laisser inchangée pour toujours.
function buildIndicatorPayload(data: Partial<CadreLogique>) {
  return {
    unite:              data.unite === undefined ? undefined : (data.unite?.trim() || null),
    valeurBaseline:      data.valeur_reference,
    valeurCible:         data.cible,
    sourceVerification: data.source_verification === undefined ? undefined : (data.source_verification.trim() || null),
  };
}

// ── Main hook ─────────────────────────────────────────────────────────────────

export function useLogframe(projectId: string) {
  return useQuery({
    queryKey: logframeKeys.all(projectId),
    queryFn: () => fetchObjectives(projectId).then(data => ({ data })),
    enabled: !!projectId,
  });
}

// ── CRUD — Objectifs + indicateur IOV principal ───────────────────────────────
// Un objectif du Cadre Logique et son indicateur IOV principal vivent dans
// deux tables distinctes (logframe_objectives / logframe_indicators) mais
// sont créés/modifiés ensemble depuis ce même formulaire — orchestration de
// deux appels Edge Function ici plutôt que de dupliquer cette logique dans
// chaque composant appelant.

export function useCreateLogframe(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: Partial<CadreLogique>) => {
      const cached: CadreLogique[] =
        (qc.getQueryData<{ data: CadreLogique[] }>(logframeKeys.all(projectId))?.data) ?? [];
      const feNiveau: FELevel = dto.niveau_intervention ?? 'IMPACT';

      const { data: objective } = await invokeEdgeFunction<{ data: LogframeObjectiveRow }>(
        'logframe-objectives-create',
        {
          projectId,
          niveau:    FE_TO_BE[feNiveau],
          niveauFe:  feNiveau,
          code:      generateCode('OBJ', feNiveau, cached),
          libelle:   dto.description || '',
          hypotheses: dto.hypotheses?.trim() || undefined,
          parentId:  isUUID(dto.parent_id) ? dto.parent_id : undefined,
        },
      );

      if (feNiveau !== 'ACTIVITE' && hasIndicatorData(dto)) {
        await invokeEdgeFunction('logframe-indicators-create', {
          objectiveId: objective.id,
          code: generateCode('IND', feNiveau, cached),
          libelle: (dto.indicateur?.trim() || dto.description || objective.libelle).slice(0, 200),
          type: NIVEAU_TO_INDICATOR_TYPE[feNiveau],
          ...buildIndicatorPayload(dto),
        });
      }

      return objective;
    },
    onSuccess:  () => qc.invalidateQueries({ queryKey: logframeKeys.all(projectId) }),
    onError:    () => qc.invalidateQueries({ queryKey: logframeKeys.all(projectId) }),
  });
}

export function useUpdateLogframe(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<CadreLogique> & { id: string }) => {
      const cached: CadreLogique[] =
        (qc.getQueryData<{ data: CadreLogique[] }>(logframeKeys.all(projectId))?.data) ?? [];
      const current = cached.find(i => i.id === id);
      const feNiveau: FELevel | undefined = data.niveau_intervention;

      const { data: resp } = await invokeEdgeFunction<{ data: LogframeObjectiveRow }>(
        'logframe-objectives-update',
        {
          id,
          niveau:    feNiveau ? FE_TO_BE[feNiveau] : undefined,
          niveauFe:  feNiveau,
          libelle:   data.description,
          hypotheses: data.hypotheses !== undefined ? (data.hypotheses?.trim() || null) : undefined,
          parentId:  isUUID(data.parent_id) ? data.parent_id : undefined,
        },
      );

      const effectiveNiveau = feNiveau ?? current?.niveau_intervention;
      if (effectiveNiveau !== 'ACTIVITE') {
        const indicatorId = current?.indicator_id;
        if (indicatorId) {
          // Toujours réconcilié quand l'indicateur existe déjà — sinon vider
          // Baseline/Cible/Unité/Source dans le formulaire n'a aucun effet
          // observable : l'ancien indicateur garderait ses anciennes valeurs
          // pour toujours faute d'appel de mise à jour. `libelle` inclus ici
          // (auparavant jamais mis à jour après sa création initiale).
          await invokeEdgeFunction('logframe-indicators-update', {
            id: indicatorId,
            libelle: data.indicateur !== undefined ? (data.indicateur.trim() || undefined) : undefined,
            ...buildIndicatorPayload(data),
          });
        } else if (hasIndicatorData(data)) {
          const createNiveau = effectiveNiveau ?? 'RESULTAT';
          await invokeEdgeFunction('logframe-indicators-create', {
            objectiveId: id,
            code: generateCode('IND', createNiveau, cached),
            libelle: (data.indicateur?.trim() || data.description || current?.description || '').slice(0, 200),
            type: NIVEAU_TO_INDICATOR_TYPE[createNiveau],
            ...buildIndicatorPayload(data),
          });
        }
      }

      return resp;
    },
    onSuccess:  () => qc.invalidateQueries({ queryKey: logframeKeys.all(projectId) }),
    onError:    () => qc.invalidateQueries({ queryKey: logframeKeys.all(projectId) }),
  });
}

export function useDeleteLogframe(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await invokeEdgeFunction<{ message: string }>('logframe-objectives-delete', { id });
    },
    onSuccess:  () => qc.invalidateQueries({ queryKey: logframeKeys.all(projectId) }),
    onError:    () => qc.invalidateQueries({ queryKey: logframeKeys.all(projectId) }),
  });
}
