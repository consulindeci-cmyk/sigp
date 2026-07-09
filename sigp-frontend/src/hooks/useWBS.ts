import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { WBS } from '@/types';

// ── Cache keys ────────────────────────────────────────────────────────────────

export const wbsKeys = {
  all: (projectId: string) => ['wbs', projectId] as const,
};

// ── Backend DTO ───────────────────────────────────────────────────────────────

interface WbsResponseDto {
  id: string;
  projectId: string;
  parentId?: string | null;
  objectiveId?: string | null;
  code: string;
  libelle: string;
  type: 'PHASE' | 'LOT' | 'ACTIVITE' | 'LIVRABLE';
  ordre: number;
  niveau: number;
  responsableId?: string | null;
  actif: boolean;
  dateDebut?: string | null;
  dateFin?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Adapter: backend → frontend ───────────────────────────────────────────────

function adaptNode(dto: WbsResponseDto): WBS {
  return {
    id: dto.id,
    projet_id: dto.projectId,
    parent_id: dto.parentId ?? null,
    code_wbs: dto.code,
    titre: dto.libelle,
    niveau: dto.niveau,
    ordre: dto.ordre,
    statut: 'NON_COMMENCE',
    responsable: dto.responsableId ?? '',
    logframe_ref_id: dto.objectiveId ?? null,
    date_debut_prevue: dto.dateDebut ?? undefined,
    date_fin_prevue: dto.dateFin ?? undefined,
    budget_alloue: 0,
    progression_physique: 0,
  };
}

// ── Budget / progression aggregation (upward through tree) ────────────────────

function aggregateBudgetProgression(nodes: WBS[]): WBS[] {
  const result = nodes.map(n => ({ ...n }));

  const aggregate = (node: WBS) => {
    const children = result.filter(n => n.parent_id === node.id);
    if (children.length > 0) {
      children.forEach(aggregate);
      node.budget_alloue = children.reduce((sum, c) => sum + (c.budget_alloue || 0), 0);
      node.progression_physique =
        children.reduce((sum, c) => sum + (c.progression_physique || 0), 0) / children.length;
    }
  };

  result.filter(n => !n.parent_id).forEach(aggregate);
  return result;
}

// ── Fetch ─────────────────────────────────────────────────────────────────────

async function fetchWBSList(projectId: string): Promise<WBS[]> {
  const { data } = await api.get('/wbs', { params: { projectId } });
  const dtos: WbsResponseDto[] = Array.isArray(data) ? data : (data?.data ?? []);
  const nodes = dtos.map(adaptNode);
  return aggregateBudgetProgression(nodes);
}

// ── Payload helpers ───────────────────────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUUID = (val?: string | null): val is string => !!val && UUID_RE.test(val);

function deriveNodeType(parentId?: string | null): 'PHASE' | 'LOT' | 'ACTIVITE' | 'LIVRABLE' {
  return parentId ? 'ACTIVITE' : 'PHASE';
}

export function buildCreatePayload(
  projectId: string,
  data: Partial<WBS>,
  existingNodes: WBS[],
) {
  let code: string;
  if (!data.parent_id) {
    const rootCount = existingNodes.filter(n => !n.parent_id).length;
    code = String(rootCount + 1);
  } else {
    const parent = existingNodes.find(n => n.id === data.parent_id);
    const siblingCount = existingNodes.filter(n => n.parent_id === data.parent_id).length;
    code = parent ? `${parent.code_wbs}.${siblingCount + 1}` : `A${siblingCount + 1}`;
  }

  return {
    projectId,
    code: code.substring(0, 30).toUpperCase(),
    libelle: data.titre || '',
    type: deriveNodeType(data.parent_id),
    parentId:     isUUID(data.parent_id)      ? data.parent_id      : undefined,
    objectiveId:  isUUID(data.logframe_ref_id) ? data.logframe_ref_id : undefined,
    responsableId: isUUID(data.responsable)   ? data.responsable    : undefined,
    ordre: data.ordre,
    dateDebut: data.date_debut_prevue || undefined,
    dateFin:   data.date_fin_prevue   || undefined,
  };
}

function buildUpdatePayload(data: Partial<WBS>) {
  return {
    libelle:      data.titre || undefined,
    parentId:     isUUID(data.parent_id)       ? data.parent_id       : undefined,
    objectiveId:  isUUID(data.logframe_ref_id)  ? data.logframe_ref_id : undefined,
    responsableId: isUUID(data.responsable)    ? data.responsable     : undefined,
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
      await Promise.all(items.map(item => api.patch(`/wbs/${item.id}`, { ordre: item.ordre })));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: wbsKeys.all(projectId) }),
  });
}

export function useCreateWBSNode(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      data,
      existingNodes,
    }: {
      data: Partial<WBS>;
      existingNodes: WBS[];
    }) => {
      const payload = buildCreatePayload(projectId, data, existingNodes);
      const { data: resp } = await api.post('/wbs', payload);
      return resp?.data ?? resp;
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
      const { data: resp } = await api.patch(`/wbs/${id}`, payload);
      return resp?.data ?? resp;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: wbsKeys.all(projectId) }),
    onError: () => qc.invalidateQueries({ queryKey: wbsKeys.all(projectId) }),
  });
}

export function useDeleteWBSNode(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/wbs/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: wbsKeys.all(projectId) }),
    onError: () => qc.invalidateQueries({ queryKey: wbsKeys.all(projectId) }),
  });
}
