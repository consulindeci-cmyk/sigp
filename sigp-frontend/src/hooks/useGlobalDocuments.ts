import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { invokeEdgeFunction } from '@/lib/supabaseFunctions';
import type {
  DocumentGlobal, CategorieGlobalDoc, StatutGlobalDoc,
  ConfidentialiteGlobalDoc, TypeFichier, VersionGlobalDoc,
} from '@/types';

// ── Cache key ─────────────────────────────────────────────────────────────────

export const globalDocumentKeys = {
  all: () => ['global-documents'] as const,
};

// ── Meta encoding (description field) — inchangé, même colonne côté Supabase ─

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

// ── Status mapping (inchangé) ─────────────────────────────────────────────────

type BEStatus = 'BROUILLON' | 'EN_VALIDATION' | 'VALIDE' | 'ARCHIVE';

function beToFeStatut(be: BEStatus): StatutGlobalDoc {
  return be === 'VALIDE' ? 'PUBLIE' : (be as StatutGlobalDoc);
}

function feToBeStatut(fe: StatutGlobalDoc): BEStatus {
  if (fe === 'PUBLIE') return 'VALIDE';
  if (fe === 'EXPIRE') return 'ARCHIVE';
  return fe as BEStatus;
}

// ── Ligne Supabase (table `documents_projet`, sans filtre de projet ici) ─────

interface DocumentRow {
  id: string;
  description: string | null;
  titre: string;
  statut: BEStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

const DOCUMENT_SELECT = 'id, titre, description, statut, created_by, created_at, updated_at';

// ── Adapter ───────────────────────────────────────────────────────────────────

function adaptGlobalDocument(row: DocumentRow): DocumentGlobal {
  const meta    = decodeMeta(row.description);
  const today   = row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0];
  const updated = row.updated_at ? row.updated_at.split('T')[0] : today;

  return {
    id:                 row.id,
    code_document:      meta?.code_document      ?? `GDOC-${row.id.slice(0, 8).toUpperCase()}`,
    titre:              row.titre,
    description:        meta ? '' : (row.description ?? ''),
    categorie:          meta?.categorie           ?? 'Administration',
    type:               meta?.type                ?? 'Autre',
    statut:             meta?.feStatut            ?? beToFeStatut(row.statut),
    version:            meta?.version             ?? '1.0',
    confidentialite:    meta?.confidentialite     ?? 'INTERNE',
    auteur:             meta?.auteur              ?? (row.created_by ?? ''),
    service:            meta?.service             ?? '',
    mots_cles:          meta?.mots_cles           ?? [],
    taille_ko:          meta?.taille_ko           ?? 0,
    nb_telechargements: meta?.nb_telechargements  ?? 0,
    date_creation:      meta?.date_creation       ?? today,
    date_modification:  meta?.date_modification   ?? updated,
    date_expiration:    meta?.date_expiration,
    nb_commentaires:    meta?.nb_commentaires     ?? 0,
    versions:           meta?.versions            ?? [],
    createdAt:          row.created_at,
    updatedAt:          row.updated_at,
  };
}

// ── Payload builder for update (inchangé) ─────────────────────────────────────

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
    service:            changes.service             ?? current.service,
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
// Pas de filtre project_id : "bibliothèque globale" = tous les documents
// visibles pour l'utilisateur (RLS org-scope déjà), tous projets confondus —
// fidèle au comportement d'origine (GET /documents sans projectId).

async function fetchGlobalDocuments(): Promise<DocumentGlobal[]> {
  const { data, error } = await supabase
    .from('documents_projet')
    .select(DOCUMENT_SELECT)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data as unknown as DocumentRow[]).map(adaptGlobalDocument);
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
// CREATE : la table `documents_projet` exige un project_id NOT NULL — un
// document "global" (sans projet) ne peut littéralement pas y être inséré.
// Comportement d'origine fidèlement conservé : stub local, ne persiste jamais
// réellement (déjà le cas côté NestJS, pas une régression introduite ici).
// UPDATE / DELETE : réellement connectés (documents-update/delete existants).

export function useCreateGlobalDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (_payload: GlobalDocumentPayload): Promise<DocumentGlobal> => {
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
      titre,
    }: {
      id: string;
      changes: Partial<GDocMeta>;
      current: DocumentGlobal;
      /** titre est une vraie colonne (hors du blob meta) — sans ce paramètre,
       * un changement de titre ne serait jamais persisté. */
      titre?: string;
    }) => {
      const meta = buildUpdateMeta(changes, current);
      const { data: resp } = await invokeEdgeFunction<{ data: DocumentRow }>('documents-update', {
        id,
        titre:       titre ?? current.titre,
        description: encodeMeta(meta),
        statut:      feToBeStatut(meta.feStatut),
      });
      return adaptGlobalDocument(resp);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: globalDocumentKeys.all() }),
    onError:   () => qc.invalidateQueries({ queryKey: globalDocumentKeys.all() }),
  });
}

export function useDeleteGlobalDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await invokeEdgeFunction<{ message: string }>('documents-delete', { id });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: globalDocumentKeys.all() }),
    onError:   () => qc.invalidateQueries({ queryKey: globalDocumentKeys.all() }),
  });
}
