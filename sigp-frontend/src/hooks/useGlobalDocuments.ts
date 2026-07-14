import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type {
  DocumentGlobal, CategorieGlobalDoc, StatutGlobalDoc,
  ConfidentialiteGlobalDoc, TypeFichier, VersionGlobalDoc,
} from '@/types';

// ── Cache key ─────────────────────────────────────────────────────────────────

export const globalDocumentKeys = {
  all: () => ['global-documents'] as const,
};

// ── Meta encoding (description field) ────────────────────────────────────────
// Stores all frontend-only fields in backend.description as JSON.
// PUBLIE/EXPIRE (FE) have no backend equivalent → stored in feStatut.

const GDOC_META_PREFIX = '__GDOC_META__:';

interface GDocMeta {
  code_document:      string;
  categorie:          CategorieGlobalDoc;
  type:               TypeFichier;
  version:            string;
  auteur:             string;
  service:            string;
  mots_cles:          string[];
  confidentialite:    ConfidentialiteGlobalDoc;
  feStatut:           StatutGlobalDoc;
  taille_ko:          number;
  nb_telechargements: number;
  nb_commentaires:    number;
  date_creation:      string;
  date_modification:  string;
  date_expiration?:   string;
  versions:           VersionGlobalDoc[];
}

function encodeMeta(meta: GDocMeta): string {
  return `${GDOC_META_PREFIX}${JSON.stringify(meta)}`;
}

function decodeMeta(description: string | null | undefined): GDocMeta | null {
  if (!description?.startsWith(GDOC_META_PREFIX)) return null;
  try {
    return JSON.parse(description.slice(GDOC_META_PREFIX.length)) as GDocMeta;
  } catch {
    return null;
  }
}

// ── Status mapping ────────────────────────────────────────────────────────────
// Backend: BROUILLON | EN_VALIDATION | VALIDE | ARCHIVE
// Frontend: PUBLIE | BROUILLON | EN_VALIDATION | ARCHIVE | EXPIRE
// PUBLIE → VALIDE (BE),  EXPIRE → ARCHIVE (BE)

type BEStatus = 'BROUILLON' | 'EN_VALIDATION' | 'VALIDE' | 'ARCHIVE';

function beToFeStatut(be: BEStatus): StatutGlobalDoc {
  return be === 'VALIDE' ? 'PUBLIE' : (be as StatutGlobalDoc);
}

function feToBeStatut(fe: StatutGlobalDoc): BEStatus {
  if (fe === 'PUBLIE') return 'VALIDE';
  if (fe === 'EXPIRE') return 'ARCHIVE';
  return fe as BEStatus;
}

// ── Backend DTO ───────────────────────────────────────────────────────────────

interface GlobalDocumentDto {
  id:          string;
  projectId:   string;
  livrableId:  string | null;
  titre:       string;
  description: string | null;
  statut:      BEStatus;
  createdBy:   string | null;
  updatedBy:   string | null;
  createdAt:   string;
  updatedAt:   string;
}

// ── Adapter ───────────────────────────────────────────────────────────────────

function adaptGlobalDocument(dto: GlobalDocumentDto): DocumentGlobal {
  const meta    = decodeMeta(dto.description);
  const today   = dto.createdAt ? dto.createdAt.split('T')[0] : new Date().toISOString().split('T')[0];
  const updated = dto.updatedAt ? dto.updatedAt.split('T')[0] : today;

  return {
    id:                 dto.id,
    code_document:      meta?.code_document      ?? `GDOC-${dto.id.slice(0, 8).toUpperCase()}`,
    titre:              dto.titre,
    description:        meta ? '' : (dto.description ?? ''),
    categorie:          meta?.categorie           ?? 'Administration',
    type:               meta?.type                ?? 'Autre',
    statut:             meta?.feStatut            ?? beToFeStatut(dto.statut),
    version:            meta?.version             ?? '1.0',
    confidentialite:    meta?.confidentialite     ?? 'INTERNE',
    auteur:             meta?.auteur              ?? (dto.createdBy ?? ''),
    service:            meta?.service             ?? '',
    mots_cles:          meta?.mots_cles           ?? [],
    taille_ko:          meta?.taille_ko           ?? 0,
    nb_telechargements: meta?.nb_telechargements  ?? 0,
    date_creation:      meta?.date_creation       ?? today,
    date_modification:  meta?.date_modification   ?? updated,
    date_expiration:    meta?.date_expiration,
    nb_commentaires:    meta?.nb_commentaires     ?? 0,
    versions:           meta?.versions            ?? [],
    createdAt:          dto.createdAt,
    updatedAt:          dto.updatedAt,
  };
}

// ── Payload builder for update ────────────────────────────────────────────────

function buildUpdateMeta(
  changes: Partial<GDocMeta>,
  current: DocumentGlobal,
): GDocMeta {
  return {
    code_document:      changes.code_document      ?? current.code_document,
    categorie:          changes.categorie           ?? current.categorie,
    type:               changes.type               ?? current.type,
    version:            changes.version            ?? current.version,
    auteur:             changes.auteur             ?? current.auteur,
    service:            changes.service            ?? current.service,
    mots_cles:          changes.mots_cles          ?? current.mots_cles,
    confidentialite:    changes.confidentialite    ?? current.confidentialite,
    feStatut:           changes.feStatut           ?? current.statut,
    taille_ko:          changes.taille_ko          ?? current.taille_ko,
    nb_telechargements: changes.nb_telechargements ?? current.nb_telechargements,
    nb_commentaires:    changes.nb_commentaires    ?? current.nb_commentaires,
    date_creation:      changes.date_creation      ?? current.date_creation,
    date_modification:  changes.date_modification  ?? new Date().toISOString().split('T')[0],
    date_expiration:    changes.date_expiration    ?? current.date_expiration,
    versions:           changes.versions           ?? current.versions,
  };
}

// ── Fetch ─────────────────────────────────────────────────────────────────────

async function fetchGlobalDocuments(): Promise<DocumentGlobal[]> {
  const { data } = await api.get('/documents', { params: { limit: 100 } });
  const raw: unknown = data?.data?.data ?? data?.data ?? data;
  const dtos: GlobalDocumentDto[] = Array.isArray(raw) ? raw : [];
  return dtos.map(adaptGlobalDocument);
}

// ── Read hook ─────────────────────────────────────────────────────────────────

export function useGlobalDocuments() {
  return useQuery({
    queryKey: globalDocumentKeys.all(),
    queryFn:  fetchGlobalDocuments,

  });
}

// ── Public payload interface (maintained for DocumentsPage compatibility) ─────

export interface GlobalDocumentPayload {
  titre:           string;
  description:     string;
  categorie:       CategorieGlobalDoc;
  type:            TypeFichier;
  statut:          StatutGlobalDoc;
  version:         string;
  confidentialite: ConfidentialiteGlobalDoc;
  auteur:          string;
  service:         string;
  mots_cles:       string[];
  taille_ko:       number;
  date_creation:   string;
  date_modification: string;
  date_expiration?: string;
}

// ── Mutation hooks ────────────────────────────────────────────────────────────
// CREATE: backend requires projectId which is not available for global library
//   → returns a local-only object (won't persist across sessions)
// UPDATE / DELETE: fully connected to backend

export function useCreateGlobalDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (_payload: GlobalDocumentPayload): Promise<DocumentGlobal> => {
      // Global documents have no projectId — backend create is not supported.
      // The caller handles optimistic local state; we just resolve.
      return Promise.resolve({} as DocumentGlobal);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: globalDocumentKeys.all() });
    },
  });
}

export function useUpdateGlobalDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      changes,
      current,
    }: {
      id: string;
      changes: Partial<GDocMeta>;
      current: DocumentGlobal;
    }) => {
      const meta = buildUpdateMeta(changes, current);
      const { data: resp } = await api.patch(`/documents/${id}`, {
        titre:       current.titre,
        description: encodeMeta(meta),
        statut:      feToBeStatut(meta.feStatut),
      });
      return adaptGlobalDocument(resp?.data ?? resp);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: globalDocumentKeys.all() }),
    onError:   () => qc.invalidateQueries({ queryKey: globalDocumentKeys.all() }),
  });
}

export function useDeleteGlobalDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/documents/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: globalDocumentKeys.all() }),
    onError:   () => qc.invalidateQueries({ queryKey: globalDocumentKeys.all() }),
  });
}
