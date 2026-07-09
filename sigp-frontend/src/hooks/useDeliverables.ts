import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { Livrable, StatutLivrable, LivrableCategorie, PrioriteLivrable } from '@/types';

// ── Backend DTO ───────────────────────────────────────────────────────────────

interface LivrableResponseDto {
  id: string;
  projectId: string;
  wbsId: string | null;
  code: string | null;
  nom: string;
  description: string | null;
  statut: string;  // LivrableStatus: NON_COMMENCE | EN_COURS | SOUMIS | VALIDE | REFUSE | CLOTURE
  datePrevue: string | null;
  dateSoumission: string | null;
  dateValidation: string | null;
  responsableId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Extra metadata stored in backend `notes` field ───────────────────────────

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

function beStatutToFe(s: string): StatutLivrable {
  if (s === 'EN_COURS') return 'EN_COURS';
  if (s === 'SOUMIS')   return 'SOUMIS';
  if (s === 'VALIDE')   return 'VALIDE';
  if (s === 'REFUSE')   return 'REFUSE';
  if (s === 'CLOTURE')  return 'TERMINE';
  return 'A_FAIRE'; // NON_COMMENCE
}

function feStatutToBe(s: StatutLivrable): string {
  if (s === 'EN_COURS') return 'EN_COURS';
  if (s === 'SOUMIS')   return 'SOUMIS';
  if (s === 'VALIDE')   return 'VALIDE';
  if (s === 'REFUSE')   return 'REFUSE';
  if (s === 'TERMINE')  return 'CLOTURE';
  return 'NON_COMMENCE'; // A_FAIRE
}

function isoDate(val: string | null | undefined): string {
  if (!val) return '';
  try { return new Date(val).toISOString().slice(0, 10); }
  catch { return ''; }
}

// ── Adapter: backend DTO → frontend Livrable ──────────────────────────────────

function adaptLivrable(dto: LivrableResponseDto): Livrable {
  const meta = decodeMeta(dto.notes);
  return {
    id:            dto.id,
    projet_id:     dto.projectId,
    code_livrable: dto.code ?? `LIV-${dto.id.slice(0, 8).toUpperCase()}`,
    nom:           dto.nom,
    description:   dto.description ?? undefined,
    categorie:     meta?.categorie  ?? 'Autre',
    composante:    meta?.composante ?? undefined,
    responsable:   meta?.responsable ?? (dto.responsableId ?? ''),
    date_prevue:   isoDate(dto.datePrevue),
    date_reelle:   isoDate(dto.dateValidation) || isoDate(dto.dateSoumission) || undefined,
    avancement:    meta?.avancement ?? 0,
    statut:        beStatutToFe(dto.statut),
    priorite:      meta?.priorite   ?? 'MOYENNE',
    createdAt:     dto.createdAt,
    updatedAt:     dto.updatedAt,
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
    nom:         l.nom,
    code:        l.code_livrable || undefined,
    description: l.description   || undefined,
    statut:      feStatutToBe(l.statut),
    datePrevue:  l.date_prevue   || undefined,
    notes:       encodeMeta(meta),
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
  if (l.nom           !== undefined) p.nom         = l.nom;
  if (l.code_livrable !== undefined) p.code        = l.code_livrable;
  if (l.description   !== undefined) p.description = l.description;
  if (l.statut        !== undefined) p.statut      = feStatutToBe(l.statut);
  if (l.date_prevue   !== undefined) p.datePrevue  = l.date_prevue || undefined;
  return p;
}

function extractDtos(data: unknown): LivrableResponseDto[] {
  const unwrapped = (data as any)?.data ?? data;
  const list = Array.isArray(unwrapped) ? unwrapped : ((unwrapped as any)?.data ?? []);
  return Array.isArray(list) ? list : [];
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
      const { data } = await api.get('/livrables', { params: { projectId, limit: 1000 } });
      const livrables = extractDtos(data).map(adaptLivrable);
      return { data: livrables, meta: { total: livrables.length, page: 1, limit: 1000, totalPages: 1 } };
    },
    enabled: !!projectId,

  });
}

export function useCreateDeliverable(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: Omit<Livrable, 'id' | 'createdAt' | 'updatedAt'>) => {
      const payload = buildCreatePayload(projectId, dto);
      const { data } = await api.post('/livrables', payload);
      return adaptLivrable(data?.data ?? data);
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
      const { data } = await api.patch(`/livrables/${id}`, payload);
      return adaptLivrable(data?.data ?? data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: deliverableKeys.all(projectId) }),
  });
}

export function useDeleteDeliverable(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (livrableId: string) => {
      await api.delete(`/livrables/${livrableId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: deliverableKeys.all(projectId) }),
  });
}
