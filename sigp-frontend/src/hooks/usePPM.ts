import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { invokeEdgeFunction } from '@/lib/supabaseFunctions';
import type {
  PPMLigne,
  CategorieAchat,
  MethodePassation,
  TypeRevue,
} from '@/types';

// ─── Ligne Supabase (colonnes snake_case de la table `ppm_marches`) ───────────
// wbs_id/budget_ligne_id/methode/type_revue sont désormais de vraies
// colonnes (cf. migration 20260828100000) — fin du JSON __PPM_META__ planqué
// dans `notes` (parseNotes/serializeNotes supprimés).

// statut est conservé ici en lecture seule : usePPMVersions.ts en dérive le
// statut d'ensemble de la version PPM (deriveVersionStatut). Il n'est en
// revanche plus exposé sur PPMLigne ni modifiable via le formulaire — le
// suivi d'exécution par marché (statut/titulaire/montant signé/date fin
// effective) n'est plus géré par ce module (cf. suppression de ces champs
// du formulaire et des Edge Functions ppm-create/ppm-update).

export interface PpmMarcheDto {
  id:                  string;
  projectId:           string;
  code:                string;
  intitule:            string;
  type:                string; // PpmTypeMarche: FOURNITURES | TRAVAUX | SERVICES | CONSULTANTS
  statut:              string; // PpmMarcheStatus: EN_PREPARATION | LANCE | SOUMISSION | EVALUATION | ATTRIBUTION | SIGNE | RESILIE | CLOTURE
  montantEstime:       number | null;
  dateLancementPrevu:  string | null;
  dateSignature:       string | null;
  wbsId:               string | null;
  budgetLigneId:       string | null;
  methode:             string | null;
  typeRevue:           string | null;
  createdAt:           string;
  updatedAt:           string;
}

interface PpmMarcheRow {
  id: string;
  project_id: string;
  code: string;
  intitule: string;
  type: string;
  statut: string;
  montant_estime: number | null;
  date_lancement_prevu: string | null;
  date_signature: string | null;
  wbs_id: string | null;
  budget_ligne_id: string | null;
  methode: string | null;
  type_revue: string | null;
  created_at: string;
  updated_at: string;
}

const PPM_MARCHE_SELECT = `
  id, project_id, code, intitule, type, statut, montant_estime,
  date_lancement_prevu, date_signature,
  wbs_id, budget_ligne_id, methode, type_revue, created_at, updated_at
`;

function rowToDto(row: PpmMarcheRow): PpmMarcheDto {
  return {
    id: row.id,
    projectId: row.project_id,
    code: row.code,
    intitule: row.intitule,
    type: row.type,
    statut: row.statut,
    montantEstime: row.montant_estime,
    dateLancementPrevu: row.date_lancement_prevu,
    dateSignature: row.date_signature,
    wbsId: row.wbs_id,
    budgetLigneId: row.budget_ligne_id,
    methode: row.methode,
    typeRevue: row.type_revue,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── Enum mappings (inchangés) ────────────────────────────────────────────────

function typeToCategorie(type: string): CategorieAchat {
  switch (type) {
    case 'FOURNITURES': return 'BIENS';
    case 'TRAVAUX':     return 'TRAVAUX';
    case 'CONSULTANTS': return 'SERVICES_CONSULTANTS';
    default:            return 'SERVICES_NON_CONSULTANTS';
  }
}

function categorieToType(cat: CategorieAchat): string {
  switch (cat) {
    case 'BIENS':                return 'FOURNITURES';
    case 'TRAVAUX':              return 'TRAVAUX';
    case 'SERVICES_CONSULTANTS': return 'CONSULTANTS';
    default:                     return 'SERVICES';
  }
}

function d(val: string | Date | null | undefined): string {
  if (!val) return '';
  const s = typeof val === 'string' ? val : (val as Date).toISOString();
  return s.slice(0, 10);
}

// ─── Adapters ─────────────────────────────────────────────────────────────────

function adaptMarche(dto: PpmMarcheDto, versionId: string): PPMLigne {
  return {
    id:                  dto.id,
    ppm_version_id:      versionId,
    wbs_id:              dto.wbsId ?? '',
    budget_ligne_id:     dto.budgetLigneId ?? '',
    reference_marche:    dto.code,
    description:         dto.intitule,
    categorie:           typeToCategorie(dto.type),
    methode:             (dto.methode as MethodePassation) || 'AOI',
    type_revue:          (dto.typeRevue as TypeRevue) || 'POST',
    montant_estime_base: dto.montantEstime ?? 0,
    dates_cles: {
      lancement_dao_prevue:     d(dto.dateLancementPrevu),
      signature_contrat_prevue: d(dto.dateSignature),
    },
    version_hash: dto.updatedAt,
  };
}

type LigneInput = Omit<PPMLigne, 'id' | 'version_hash' | 'ppm_version_id'>;

function ligneToCreatePayload(projectId: string, l: LigneInput) {
  return {
    projectId,
    code:              l.reference_marche,
    intitule:          l.description,
    type:              categorieToType(l.categorie),
    montantEstime:     l.montant_estime_base || undefined,
    dateLancementPrevu: l.dates_cles.lancement_dao_prevue     || undefined,
    dateSignature:      l.dates_cles.signature_contrat_prevue || undefined,
    wbsId:             l.wbs_id || undefined,
    budgetLigneId:     l.budget_ligne_id || undefined,
    methode:           l.methode,
    typeRevue:         l.type_revue,
  };
}

function ligneToUpdatePayload(l: Partial<PPMLigne>, existing: PPMLigne) {
  const merged = { ...existing, ...l };
  return {
    code:              merged.reference_marche,
    intitule:          merged.description,
    type:              categorieToType(merged.categorie),
    montantEstime:     merged.montant_estime_base || undefined,
    dateLancementPrevu: merged.dates_cles.lancement_dao_prevue     || undefined,
    dateSignature:      merged.dates_cles.signature_contrat_prevue || undefined,
    wbsId:             merged.wbs_id || undefined,
    budgetLigneId:     merged.budget_ligne_id || undefined,
    methode:           merged.methode,
    typeRevue:         merged.type_revue,
  };
}

// ─── Query keys ───────────────────────────────────────────────────────────────

export const ppmKeys = {
  list:   (projectId: string) => ['ppm', projectId] as const,
  marche: (id: string)        => ['ppm-marche', id] as const,
};

// Shared queryFn used by both usePPM and usePPMVersions (same queryKey → deduped)
export async function fetchPpmMarcheList(projectId: string): Promise<PpmMarcheDto[]> {
  const { data, error } = await supabase
    .from('ppm_marches')
    .select(PPM_MARCHE_SELECT)
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .order('code', { ascending: true })
    .limit(100);
  if (error) throw error;
  return (data as unknown as PpmMarcheRow[]).map(rowToDto);
}

// ─── usePPM ───────────────────────────────────────────────────────────────────

export function usePPM(projectId: string, versionId?: string) {
  const qc = useQueryClient();
  const syntheticVersionId = versionId || `${projectId}-ppm-v1`;

  const query = useQuery({
    queryKey: ppmKeys.list(projectId),
    queryFn: () => fetchPpmMarcheList(projectId),
    enabled: !!projectId,
  });

  const dtos: PpmMarcheDto[] = query.data ?? [];

  const lignes = useMemo(
    () => dtos.map(dto => adaptMarche(dto, syntheticVersionId)),
    [dtos, syntheticVersionId],
  );

  const totalEstimeBase = useMemo(
    () => lignes.reduce((s, l) => s + l.montant_estime_base, 0),
    [lignes],
  );

  // ── Mutations ──────────────────────────────────────────────────────────────

  const addMutation = useMutation({
    mutationFn: async (payload: Omit<PPMLigne, 'id' | 'version_hash' | 'ppm_version_id'>) => {
      const body = ligneToCreatePayload(projectId, payload as LigneInput);
      const { data } = await invokeEdgeFunction<{ data: PpmMarcheRow }>('ppm-create', body);
      return rowToDto(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ppmKeys.list(projectId) }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PPMLigne> }) => {
      const cachedDtos = qc.getQueryData<PpmMarcheDto[]>(ppmKeys.list(projectId)) ?? [];
      const existingDto = cachedDtos.find(d => d.id === id);
      const existingLigne = existingDto ? adaptMarche(existingDto, syntheticVersionId) : null;
      const body = existingLigne
        ? ligneToUpdatePayload(updates, existingLigne)
        : ligneToUpdatePayload(updates, updates as PPMLigne);
      const { data } = await invokeEdgeFunction<{ data: PpmMarcheRow }>('ppm-update', { id, ...body });
      return rowToDto(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ppmKeys.list(projectId) }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await invokeEdgeFunction<{ message: string }>('ppm-delete', { id });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ppmKeys.list(projectId) }),
  });

  // ── Stable async wrappers (same interface as the old hook) ────────────────

  const addLigne = async (
    payload: Omit<PPMLigne, 'id' | 'version_hash' | 'ppm_version_id'>,
  ) => addMutation.mutateAsync(payload);

  const updateLigne = async (id: string, updates: Partial<PPMLigne>) =>
    updateMutation.mutateAsync({ id, updates });

  const deleteLigne = async (id: string) => deleteMutation.mutateAsync(id);

  return {
    lignes,
    isLoading:  query.isLoading,
    totalEstimeBase,
    addLigne,
    updateLigne,
    deleteLigne,
    error:      query.error,
    isAdding:   addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

// ─── Liaison PTBA ⟷ Marchés (many-to-many, ptba_activite_marches) ─────────────

export interface PpmActiviteLink {
  id: string;
  code: string;
  libelle: string;
}

interface PtbaActiviteMarcheRow {
  activite_id: string;
  activite: { id: string; code: string; libelle: string } | { id: string; code: string; libelle: string }[] | null;
}

export function usePpmMarcheActivites(marcheId: string) {
  return useQuery({
    queryKey: ['ppm-marche-activites', marcheId],
    queryFn: async (): Promise<PpmActiviteLink[]> => {
      const { data, error } = await supabase
        .from('ptba_activite_marches')
        .select('activite_id, activite:ptba_activites(id, code, libelle)')
        .eq('marche_id', marcheId);
      if (error) throw error;
      return (data as unknown as PtbaActiviteMarcheRow[]).map((row) => {
        const a = Array.isArray(row.activite) ? row.activite[0] : row.activite;
        return { id: row.activite_id, code: a?.code ?? '', libelle: a?.libelle ?? '' };
      });
    },
    enabled: !!marcheId,
  });
}

export function useSetPpmMarcheActivites() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ marcheId, activiteIds }: { marcheId: string; activiteIds: string[] }) => {
      const { data } = await invokeEdgeFunction<{ data: { marcheId: string; activiteIds: string[] } }>(
        'ppm-activites-set',
        { marcheId, activiteIds },
      );
      return data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['ppm-marche-activites', variables.marcheId] });
    },
  });
}
