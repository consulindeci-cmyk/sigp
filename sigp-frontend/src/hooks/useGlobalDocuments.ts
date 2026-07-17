import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { invokeEdgeFunction } from '@/lib/supabaseFunctions';
import type {
  DocumentGlobal, CategorieGlobalDoc, StatutGlobalDoc,
  ConfidentialiteGlobalDoc, TypeFichier, VersionGlobalDoc, PaginatedResponse,
} from '@/types';

// ── Cache key ─────────────────────────────────────────────────────────────────

export const globalDocumentKeys = {
  all: ['global-documents'] as const,
  list: (params?: object) => [...globalDocumentKeys.all, 'list', params] as const,
  kpis: (params?: object) => [...globalDocumentKeys.all, 'kpis', params] as const,
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
// Pas de filtre project_id explicite : "bibliothèque globale" = tous les
// documents visibles pour l'utilisateur (RLS org-scope déjà), tous projets
// confondus — fidèle au comportement d'origine (GET /documents sans
// projectId). organisationId (SUPER_ADMIN uniquement) est le seul filtre
// inter-organisations, résolu via organisation_project_ids().
//
// categorie/type/confidentialite/auteur restent des filtres CLIENT-SIDE
// (DocumentsPage.tsx) : ces champs sont encodés dans le JSON `description`
// (__GDOC_META__), pas des colonnes réelles — impossible de les filtrer côté
// serveur sans changement de schéma. Seuls titre (recherche) et statut (vraie
// colonne) + organisationId sont résolus ici.

export interface GlobalDocumentsParams {
  page?: number;
  limit?: number;
  search?: string;
  statut?: StatutGlobalDoc;
  organisationId?: string;
}

async function fetchGlobalDocumentsPage(params: GlobalDocumentsParams): Promise<PaginatedResponse<DocumentGlobal>> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase.from('documents_projet').select(DOCUMENT_SELECT, { count: 'exact' }).is('deleted_at', null);

  if (params.search) {
    query = query.ilike('titre', `%${params.search}%`);
  }
  if (params.statut) {
    query = query.eq('statut', feToBeStatut(params.statut));
  }
  if (params.organisationId) {
    const { data: projectIds, error: projectIdsError } = await supabase.rpc('organisation_project_ids', {
      p_organisation_id: params.organisationId,
    });
    if (projectIdsError) throw projectIdsError;
    // Organisation sans aucun projet (ou id refusé par la fonction) : aucun
    // document ne doit matcher plutôt que de renvoyer toute la bibliothèque.
    query = query.in('project_id', (projectIds ?? []).length > 0 ? projectIds : ['00000000-0000-0000-0000-000000000000']);
  }

  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  const list = (data as unknown as DocumentRow[]).map(adaptGlobalDocument);
  const total = count ?? list.length;
  return {
    data: list,
    meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

// ── Read hook (table paginée) ──────────────────────────────────────────────────

export function useGlobalDocuments(params?: GlobalDocumentsParams) {
  return useQuery({
    queryKey: globalDocumentKeys.list(params),
    queryFn: () => fetchGlobalDocumentsPage(params ?? {}),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

// ── KPI/graphiques (agrégat séparé, pas de pagination) ─────────────────────────
// Même logique que useUsersKPIs/useProjectsKPIs : un jeu de données propre,
// découplé de la page affichée dans le tableau. Les champs meta-encodés
// (categorie notamment, utilisée par les graphiques) ne pouvant pas être
// agrégés côté SQL, ce hook reste un fetch borné (500 lignes) plutôt qu'un
// vrai agrégat serveur — respecte les mêmes filtres (recherche/statut/
// organisation) que la liste, pour rester cohérent avec ce qui est affiché.

export function useGlobalDocumentsKPIs(params?: Omit<GlobalDocumentsParams, 'page' | 'limit'>) {
  return useQuery({
    queryKey: globalDocumentKeys.kpis(params),
    queryFn: async () => {
      const page = await fetchGlobalDocumentsPage({ ...params, page: 1, limit: 500 });
      return page.data;
    },
    staleTime: 60_000,
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
      qc.invalidateQueries({ queryKey: globalDocumentKeys.all });
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
    onSuccess: () => qc.invalidateQueries({ queryKey: globalDocumentKeys.all }),
    onError:   () => qc.invalidateQueries({ queryKey: globalDocumentKeys.all }),
  });
}

export function useDeleteGlobalDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await invokeEdgeFunction<{ message: string }>('documents-delete', { id });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: globalDocumentKeys.all }),
    onError:   () => qc.invalidateQueries({ queryKey: globalDocumentKeys.all }),
  });
}
