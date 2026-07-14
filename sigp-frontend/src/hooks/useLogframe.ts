import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
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

// ── Meta encoding (description field) ────────────────────────────────────────
// Stores frontend-only fields in the backend's description field as JSON.

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

// ── Backend DTOs ──────────────────────────────────────────────────────────────

export interface LogframeObjectiveDto {
  id: string;
  projectId: string;
  niveau: BELevel;
  code: string;
  libelle: string;
  description: string | null;
  parentId: string | null;
  ordre: number;
  actif: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LogframeIndicatorDto {
  id: string;
  objectiveId: string;
  code: string;
  libelle: string;
  type: 'IMPACT' | 'OUTCOME' | 'OUTPUT' | 'PROCESS';
  unite: string | null;
  valeurBaseline: number | null;
  valeurCible: number | null;
  valeurActuelle: number | null;
  sourceVerification: string | null;
  periodicite: string | null;
  actif: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Adapter: backend objective → CadreLogique ─────────────────────────────────

function adaptObjective(dto: LogframeObjectiveDto): CadreLogique {
  const meta = decodeMeta(dto.description);
  const feNiveau: FELevel = meta?.feNiveau ?? BE_TO_FE[dto.niveau] ?? 'IMPACT';

  return {
    id:                   dto.id,
    projet_id:            dto.projectId,
    parent_id:            dto.parentId ?? null,
    niveau_intervention:  feNiveau,
    indicateur:           dto.libelle,
    valeur_reference:     meta?.valeur_reference,
    cible:                meta?.cible,
    source_verification:  meta?.source_verification,
    hypotheses:           meta?.hypotheses ?? (meta ? undefined : (dto.description ?? undefined)),
  };
}

// ── Fetch ─────────────────────────────────────────────────────────────────────

async function fetchObjectives(projectId: string): Promise<CadreLogique[]> {
  const { data } = await api.get('/logframe-objectives', {
    params: { projectId, limit: 100 },
  });
  // Handle both paginated { data: [...] } and plain array responses
  const raw: unknown = data?.data?.data ?? data?.data ?? data;
  const dtos: LogframeObjectiveDto[] = Array.isArray(raw) ? raw : [];
  return dtos.map(adaptObjective);
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
      const { data } = await api.post('/logframe-objectives', payload);
      return data?.data ?? data;
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
      const { data: resp } = await api.patch(`/logframe-objectives/${id}`, payload);
      return resp?.data ?? resp;
    },
    onSuccess:  () => qc.invalidateQueries({ queryKey: logframeKeys.all(projectId) }),
    onError:    () => qc.invalidateQueries({ queryKey: logframeKeys.all(projectId) }),
  });
}

export function useDeleteLogframe(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/logframe-objectives/${id}`);
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
      const { data } = await api.post('/logframe-indicators', { ...dto, code });
      return data?.data ?? data;
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
    }) => {
      const { data } = await api.patch(`/logframe-indicators/${id}`, dto);
      return data?.data ?? data;
    },
    onSuccess: () => {
      if (projectId) qc.invalidateQueries({ queryKey: logframeKeys.all(projectId) });
    },
  });
}

export function useDeleteLogframeIndicator(projectId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/logframe-indicators/${id}`);
    },
    onSuccess: () => {
      if (projectId) qc.invalidateQueries({ queryKey: logframeKeys.all(projectId) });
    },
  });
}
