import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { invokeEdgeFunction } from '@/lib/supabaseFunctions';
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
// Stores all frontend-only fields in backend.description as JSON — inchangé,
// indépendant du backend (même colonne `description` côté Supabase).

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

// ── Ligne Supabase (colonnes snake_case de la table `documents_projet`) ───────

interface DocumentRow {
  id:          string;
  project_id:  string;
  livrable_id: string | null;
  titre:       string;
  description: string | null;
  statut:      StatutDocument;
  created_by:  string | null;
  created_at:  string;
  updated_at:  string;
}

const DOCUMENT_SELECT = 'id, project_id, livrable_id, titre, description, statut, created_by, created_at, updated_at';

// ── Adapter ───────────────────────────────────────────────────────────────────

function adaptDocument(row: DocumentRow): DocumentProjet {
  const meta    = decodeMeta(row.description);
  const today   = row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0];
  const updated = row.updated_at ? row.updated_at.split('T')[0] : today;

  return {
    id:                row.id,
    projet_id:         row.project_id,
    code_document:     meta?.code_document    ?? `DOC-${row.id.slice(0, 8).toUpperCase()}`,
    titre:             row.titre,
    description:       meta ? undefined : (row.description ?? undefined),
    categorie:         meta?.categorie         ?? 'Autre',
    activite_liee:     meta?.activite_liee,
    version:           meta?.version           ?? '1.0',
    auteur:            meta?.auteur            ?? (row.created_by ?? ''),
    responsable:       meta?.responsable       ?? (row.created_by ?? ''),
    date_creation:     meta?.date_creation     ?? today,
    date_modification: meta?.date_modification ?? updated,
    statut:            row.statut,
    taille_ko:         meta?.taille_ko         ?? 0,
    type_fichier:      meta?.type_fichier      ?? 'Autre',
    mots_cles:         meta?.mots_cles         ?? [],
    confidentialite:   meta?.confidentialite   ?? 'INTERNE',
    createdAt:         row.created_at,
    updatedAt:         row.updated_at,
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
  const { data, error } = await supabase
    .from('documents_projet')
    .select(DOCUMENT_SELECT)
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data as unknown as DocumentRow[]).map(adaptDocument);
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
      const { data } = await invokeEdgeFunction<{ data: DocumentRow }>('documents-create', payload);
      return adaptDocument(data);
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
      const { data: resp } = await invokeEdgeFunction<{ data: DocumentRow }>('documents-update', { id, ...payload });
      return adaptDocument(resp);
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
      await invokeEdgeFunction<{ message: string }>('documents-delete', { id: documentId });
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
