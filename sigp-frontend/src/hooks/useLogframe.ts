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
// PRODUIT has no backend equivalent → stored in meta only, mapped to RESULTAT on write.

type FELevel = CadreLogique['niveau_intervention'];
type BELevel = 'OBJECTIF_GLOBAL' | 'OBJECTIF_SPECIFIQUE' | 'RESULTAT' | 'ACTIVITE';

const FE_TO_BE: Record<FELevel, BELevel> = {
  IMPACT:   'OBJECTIF_GLOBAL',
  OBJECTIF: 'OBJECTIF_SPECIFIQUE',
  RESULTAT: 'RESULTAT',
  PRODUIT:  'RESULTAT',   // no backend equivalent — stored in meta
  ACTIVITE: 'ACTIVITE',
};

const BE_TO_FE: Record<BELevel, FELevel> = {
  OBJECTIF_GLOBAL:    'IMPACT',
  OBJECTIF_SPECIFIQUE: 'OBJECTIF',
  RESULTAT:            'RESULTAT',
  ACTIVITE:            'ACTIVITE',
};

// ── Meta encoding (description field) — inchangé, même colonne côté Supabase ──

const LF_META_PREFIX = '__LF_META__:';

interface LFMeta {
  feNiveau: FELevel;
  valeur_reference?: string;
  cible?: string;
  source_verification?: string;
  hypotheses?: string;
}

function encodeMeta(meta: LFMeta): string {
  return `${LF_META_PREFIX}${JSON.stringify(meta)}`;
}

function decodeMeta(description: string | null | undefined): LFMeta | null {
  if (!description?.startsWith(LF_META_PREFIX)) return null;
  try {
    return JSON.parse(description.slice(LF_META_PREFIX.length)) as LFMeta;
  } catch {
    return null;
  }
}

// ── Ligne Supabase (colonnes snake_case de `logframe_objectives`) ────────────

interface LogframeObjectiveRow {
  id: string;
  project_id: string;
  niveau: BELevel;
  code: string;
  libelle: string;
  description: string | null;
  parent_id: string | null;
  ordre: number;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

const OBJECTIVE_SELECT = 'id, project_id, niveau, code, libelle, description, parent_id, ordre, actif, created_at, updated_at';

// ── Adapter: ligne Supabase → CadreLogique ────────────────────────────────────

function adaptObjective(row: LogframeObjectiveRow): CadreLogique {
  const meta = decodeMeta(row.description);
  const feNiveau: FELevel = meta?.feNiveau ?? BE_TO_FE[row.niveau] ?? 'IMPACT';

  return {
    id:                   row.id,
    projet_id:            row.project_id,
    parent_id:            row.parent_id ?? null,
    niveau_intervention:  feNiveau,
    indicateur:           row.libelle,
    valeur_reference:     meta?.valeur_reference,
    cible:                meta?.cible,
    source_verification:  meta?.source_verification,
    hypotheses:           meta?.hypotheses ?? (meta ? undefined : (row.description ?? undefined)),
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

function generateCode(feNiveau: FELevel, existingItems: CadreLogique[]): string {
  const abbrev = NIVEAU_ABBREV[feNiveau];
  const count = existingItems.filter(i => i.niveau_intervention === feNiveau).length + 1;
  return `${abbrev}-${count}-${Date.now().toString(36)}`.substring(0, 20).toUpperCase();
}

function buildCreatePayload(
  projectId: string,
  data: Partial<CadreLogique>,
  existingItems: CadreLogique[],
) {
  const feNiveau: FELevel = data.niveau_intervention ?? 'IMPACT';
  const meta: LFMeta = {
    feNiveau,
    valeur_reference:   data.valeur_reference,
    cible:              data.cible,
    source_verification: data.source_verification,
    hypotheses:         data.hypotheses,
  };

  return {
    projectId,
    niveau:    FE_TO_BE[feNiveau],
    code:      generateCode(feNiveau, existingItems),
    libelle:   data.indicateur || '',
    description: encodeMeta(meta),
    parentId:  isUUID(data.parent_id) ? data.parent_id : undefined,
  };
}

function buildUpdatePayload(data: Partial<CadreLogique>, current?: CadreLogique) {
  const feNiveau: FELevel = data.niveau_intervention ?? current?.niveau_intervention ?? 'ACTIVITE';
  const meta: LFMeta = {
    feNiveau,
    valeur_reference:    data.valeur_reference   ?? current?.valeur_reference,
    cible:               data.cible              ?? current?.cible,
    source_verification: data.source_verification ?? current?.source_verification,
    hypotheses:          data.hypotheses          ?? current?.hypotheses,
  };

  return {
    libelle:     data.indicateur ?? undefined,
    description: encodeMeta(meta),
    niveau:      data.niveau_intervention ? FE_TO_BE[data.niveau_intervention] : undefined,
    parentId:    isUUID(data.parent_id) ? data.parent_id : undefined,
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

// ── CRUD — Objectifs ──────────────────────────────────────────────────────────

export function useCreateLogframe(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: Partial<CadreLogique>) => {
      const cached: CadreLogique[] =
        (qc.getQueryData<{ data: CadreLogique[] }>(logframeKeys.all(projectId))?.data) ?? [];
      const payload = buildCreatePayload(projectId, dto, cached);
      const { data } = await invokeEdgeFunction<{ data: LogframeObjectiveRow }>('logframe-objectives-create', payload);
      return data;
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
      const payload = buildUpdatePayload(data, current);
      const { data: resp } = await invokeEdgeFunction<{ data: LogframeObjectiveRow }>('logframe-objectives-update', { id, ...payload });
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

// ── CRUD — Indicateurs ────────────────────────────────────────────────────────
// Ces hooks complètent la connexion du module sans impacter l'UI existante.

export function useCreateLogframeIndicator(projectId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: {
      objectiveId: string;
      libelle: string;
      code?: string;
      type?: 'IMPACT' | 'OUTCOME' | 'OUTPUT' | 'PROCESS';
      unite?: string;
      valeurBaseline?: number;
      valeurCible?: number;
      valeurActuelle?: number;
      sourceVerification?: string;
      periodicite?: string;
    }) => {
      const code = dto.code ?? `IND-${Date.now().toString(36)}`.substring(0, 30).toUpperCase();
      return invokeEdgeFunction<{ data: unknown }>('logframe-indicators-create', { ...dto, code });
    },
    onSuccess: () => {
      if (projectId) qc.invalidateQueries({ queryKey: logframeKeys.all(projectId) });
    },
  });
}

export function useUpdateLogframeIndicator(projectId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...dto
    }: {
      id: string;
      libelle?: string;
      type?: 'IMPACT' | 'OUTCOME' | 'OUTPUT' | 'PROCESS';
      unite?: string;
      valeurBaseline?: number;
      valeurCible?: number;
      valeurActuelle?: number;
      sourceVerification?: string;
      periodicite?: string;
      actif?: boolean;
    }) => invokeEdgeFunction<{ data: unknown }>('logframe-indicators-update', { id, ...dto }),
    onSuccess: () => {
      if (projectId) qc.invalidateQueries({ queryKey: logframeKeys.all(projectId) });
    },
  });
}

export function useDeleteLogframeIndicator(projectId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await invokeEdgeFunction<{ message: string }>('logframe-indicators-delete', { id });
    },
    onSuccess: () => {
      if (projectId) qc.invalidateQueries({ queryKey: logframeKeys.all(projectId) });
    },
  });
}
