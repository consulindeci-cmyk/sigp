import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type {
  DocumentProjet, DocumentCategorie, TypeFichier,
  StatutDocument, ConfidentialiteDocument,
} from '@/types';

// ── Cache keys ────────────────────────────────────────────────────────────────

export const documentKeys = {
  all:     ()           => ['documents'] as const,
  project: (pid: string) => ['documents', pid] as const,
};

// ── Meta encoding (description field) ────────────────────────────────────────
// Stores all frontend-only fields in backend.description as JSON.

const PDOC_META_PREFIX = '__PDOC_META__:';

interface PDocMeta {
  code_document:   string;
  categorie:       DocumentCategorie;
  activite_liee?:  string;
  version:         string;
  auteur:          string;
  responsable:     string;
  date_creation:   string;
  date_modification: string;
  taille_ko:       number;
  type_fichier:    TypeFichier;
  mots_cles:       string[];
  confidentialite: ConfidentialiteDocument;
}

function encodeMeta(meta: PDocMeta): string {
  return `${PDOC_META_PREFIX}${JSON.stringify(meta)}`;
}

function decodeMeta(description: string | null | undefined): PDocMeta | null {
  if (!description?.startsWith(PDOC_META_PREFIX)) return null;
  try {
    return JSON.parse(description.slice(PDOC_META_PREFIX.length)) as PDocMeta;
  } catch {
    return null;
  }
}

// ── Backend DTO ───────────────────────────────────────────────────────────────

interface DocumentDto {
  id:          string;
  projectId:   string;
  livrableId:  string | null;
  titre:       string;
  description: string | null;
  statut:      StatutDocument;
  createdBy:   string | null;
  updatedBy:   string | null;
  createdAt:   string;
  updatedAt:   string;
}

// ── Adapter ───────────────────────────────────────────────────────────────────

function adaptDocument(dto: DocumentDto): DocumentProjet {
  const meta    = decodeMeta(dto.description);
  const today   = dto.createdAt ? dto.createdAt.split('T')[0] : new Date().toISOString().split('T')[0];
  const updated = dto.updatedAt ? dto.updatedAt.split('T')[0] : today;

  return {
    id:                dto.id,
    projet_id:         dto.projectId,
    code_document:     meta?.code_document    ?? `DOC-${dto.id.slice(0, 8).toUpperCase()}`,
    titre:             dto.titre,
    description:       meta ? undefined : (dto.description ?? undefined),
    categorie:         meta?.categorie         ?? 'Autre',
    activite_liee:     meta?.activite_liee,
    version:           meta?.version           ?? '1.0',
    auteur:            meta?.auteur            ?? (dto.createdBy ?? ''),
    responsable:       meta?.responsable       ?? (dto.createdBy ?? ''),
    date_creation:     meta?.date_creation     ?? today,
    date_modification: meta?.date_modification ?? updated,
    statut:            dto.statut,
    taille_ko:         meta?.taille_ko         ?? 0,
    type_fichier:      meta?.type_fichier      ?? 'Autre',
    mots_cles:         meta?.mots_cles         ?? [],
    confidentialite:   meta?.confidentialite   ?? 'INTERNE',
    createdAt:         dto.createdAt,
    updatedAt:         dto.updatedAt,
  };
}

// ── Payload builders ──────────────────────────────────────────────────────────

type PDocPayload = Omit<DocumentProjet, 'id' | 'createdAt' | 'updatedAt'>;

function buildCreatePayload(projectId: string, data: PDocPayload) {
  const meta: PDocMeta = {
    code_document:     data.code_document,
    categorie:         data.categorie,
    activite_liee:     data.activite_liee,
    version:           data.version,
    auteur:            data.auteur,
    responsable:       data.responsable,
    date_creation:     data.date_creation,
    date_modification: data.date_modification,
    taille_ko:         data.taille_ko,
    type_fichier:      data.type_fichier,
    mots_cles:         data.mots_cles,
    confidentialite:   data.confidentialite,
  };
  return {
    projectId,
    titre:       data.titre,
    description: encodeMeta(meta),
    statut:      data.statut,
  };
}

function buildUpdatePayload(
  data: Partial<DocumentProjet>,
  current?: DocumentProjet,
): Record<string, unknown> {
  const now   = new Date().toISOString();
  const today = now.split('T')[0];
  const meta: PDocMeta = {
    code_document:     data.code_document     ?? current?.code_document     ?? '',
    categorie:         data.categorie          ?? current?.categorie          ?? 'Autre',
    activite_liee:     data.activite_liee      ?? current?.activite_liee,
    version:           data.version            ?? current?.version            ?? '1.0',
    auteur:            data.auteur             ?? current?.auteur             ?? '',
    responsable:       data.responsable        ?? current?.responsable        ?? '',
    date_creation:     data.date_creation      ?? current?.date_creation      ?? today,
    date_modification: data.date_modification  ?? today,
    taille_ko:         data.taille_ko          ?? current?.taille_ko          ?? 0,
    type_fichier:      data.type_fichier       ?? current?.type_fichier       ?? 'Autre',
    mots_cles:         data.mots_cles          ?? current?.mots_cles          ?? [],
    confidentialite:   data.confidentialite    ?? current?.confidentialite    ?? 'INTERNE',
  };
  return {
    titre:       data.titre   ?? undefined,
    description: encodeMeta(meta),
    statut:      data.statut  ?? undefined,
  };
}

// ── Fetch ─────────────────────────────────────────────────────────────────────

async function fetchDocuments(projectId: string): Promise<DocumentProjet[]> {
  const { data } = await api.get('/documents', { params: { projectId, limit: 1000 } });
  const raw: unknown = data?.data ?? data;
  const dtos: DocumentDto[] = Array.isArray(raw) ? raw : [];
  return dtos.map(adaptDocument);
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useDocuments(projectId: string) {
  return useQuery({
    queryKey: documentKeys.project(projectId),
    queryFn:  () => fetchDocuments(projectId),
    enabled:  !!projectId,

  });
}

export function useCreateDocument(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: PDocPayload) => {
      const payload = buildCreatePayload(projectId, dto);
      const { data } = await api.post('/documents', payload);
      return adaptDocument(data?.data ?? data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: documentKeys.project(projectId) });
      qc.invalidateQueries({ queryKey: documentKeys.all() });
    },
    onError: () => {
      qc.invalidateQueries({ queryKey: documentKeys.project(projectId) });
    },
  });
}

export function useUpdateDocument(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...dto }: Partial<DocumentProjet> & { id: string }) => {
      const cached  = qc.getQueryData<DocumentProjet[]>(documentKeys.project(projectId));
      const current = cached?.find(d => d.id === id);
      const payload = buildUpdatePayload(dto, current);
      const { data: resp } = await api.patch(`/documents/${id}`, payload);
      return adaptDocument(resp?.data ?? resp);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: documentKeys.project(projectId) });
      qc.invalidateQueries({ queryKey: documentKeys.all() });
    },
    onError: () => {
      qc.invalidateQueries({ queryKey: documentKeys.project(projectId) });
    },
  });
}

export function useDeleteDocument(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (documentId: string) => {
      await api.delete(`/documents/${documentId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: documentKeys.project(projectId) });
      qc.invalidateQueries({ queryKey: documentKeys.all() });
    },
    onError: () => {
      qc.invalidateQueries({ queryKey: documentKeys.project(projectId) });
    },
  });
}
