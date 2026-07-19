import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { invokeEdgeFunction } from '@/lib/supabaseFunctions';
import type {
  PPMLigne,
  CategorieAchat,
  MethodePassation,
  StatutLignePPM,
  TypeRevue,
} from '@/types';

// ─── Ligne Supabase (colonnes snake_case de la table `ppm_marches`) ───────────

export interface PpmMarcheDto {
  id:                  string;
  projectId:           string;
  code:                string;
  intitule:            string;
  type:                string; // PpmTypeMarche: FOURNITURES | TRAVAUX | SERVICES | CONSULTANTS
  statut:              string; // PpmMarcheStatus: EN_PREPARATION | LANCE | SOUMISSION | EVALUATION | ATTRIBUTION | SIGNE | RESILIE | CLOTURE
  montantEstime:       number | null;
  montantSigne:        number | null;
  dateLancementPrevu:  string | null;
  dateSoumissionPrevu: string | null;
  dateAttribution:     string | null;
  dateSignature:       string | null;
  dateFinPrevue:       string | null;
  dateFinEffective:    string | null;
  titulaire:           string | null;
  notes:               string | null;
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
  montant_signe: number | null;
  date_lancement_prevu: string | null;
  date_soumission_prevu: string | null;
  date_attribution: string | null;
  date_signature: string | null;
  date_fin_prevue: string | null;
  date_fin_effective: string | null;
  titulaire: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const PPM_MARCHE_SELECT = `
  id, project_id, code, intitule, type, statut, montant_estime, montant_signe,
  date_lancement_prevu, date_soumission_prevu, date_attribution, date_signature,
  date_fin_prevue, date_fin_effective, titulaire, notes, created_at, updated_at
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
    montantSigne: row.montant_signe,
    dateLancementPrevu: row.date_lancement_prevu,
    dateSoumissionPrevu: row.date_soumission_prevu,
    dateAttribution: row.date_attribution,
    dateSignature: row.date_signature,
    dateFinPrevue: row.date_fin_prevue,
    dateFinEffective: row.date_fin_effective,
    titulaire: row.titulaire,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── Extra metadata: fields the backend doesn't have, serialized into `notes` ─
// (inchangé, indépendant du backend — même colonne `notes` côté Supabase)

const PPM_META = '__PPM_META__';

interface PPMExtraMeta {
  methode:               MethodePassation;
  type_revue:            TypeRevue;
  wbs_id:                string;
  budget_ligne_id:       string;
  bailleur_id:           string;
  devise_code:           string;
  taux_change_estime:    number;
  montant_estime_devise: number;
  est_lot_unique:        boolean;
  d_prep_dao_p:          string;
  d_prep_dao_r:          string;
  d_lanc_dao_r:          string;
  d_remise_r:            string;
  d_eval_p:              string;
  d_eval_r:              string;
  d_ano_p:               string;
  d_ano_r:               string;
  d_attr_r:              string;
  d_sign_r:              string;
  d_dema_r:              string;
}

function defaultExtra(): PPMExtraMeta {
  return {
    methode: 'AOI', type_revue: 'POST',
    wbs_id: '', budget_ligne_id: '', bailleur_id: '',
    devise_code: 'XOF', taux_change_estime: 1, montant_estime_devise: 0,
    est_lot_unique: true,
    d_prep_dao_p: '', d_prep_dao_r: '', d_lanc_dao_r: '', d_remise_r: '',
    d_eval_p: '', d_eval_r: '', d_ano_p: '', d_ano_r: '',
    d_attr_r: '', d_sign_r: '', d_dema_r: '',
  };
}

function parseNotes(notes: string | null): PPMExtraMeta {
  if (!notes?.startsWith(`${PPM_META}:`)) return defaultExtra();
  try { return { ...defaultExtra(), ...JSON.parse(notes.slice(PPM_META.length + 1)) }; }
  catch { return defaultExtra(); }
}

function serializeNotes(extra: PPMExtraMeta): string {
  return `${PPM_META}:${JSON.stringify(extra)}`;
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

function beStatutToFe(s: string): StatutLignePPM {
  switch (s) {
    case 'EN_PREPARATION': return 'PLANIFIE';
    case 'LANCE':          return 'DAO_LANCE';
    case 'SOUMISSION':     return 'OFFRES_RECUES';
    case 'EVALUATION':     return 'EVALUATION';
    case 'ATTRIBUTION':    return 'ATTRIBUE';
    case 'SIGNE':          return 'CONTRAT_SIGNE';
    case 'RESILIE':        return 'ANNULE';
    case 'CLOTURE':        return 'CLOTURE';
    default:               return 'PLANIFIE';
  }
}

function feStatutToBe(s: StatutLignePPM): string {
  switch (s) {
    case 'DAO_LANCE':                    return 'LANCE';
    case 'OFFRES_RECUES':                return 'SOUMISSION';
    case 'EVALUATION':
    case 'ANO_EN_ATTENTE':
    case 'ANO_OBTENU':                   return 'EVALUATION';
    case 'ATTRIBUE':                     return 'ATTRIBUTION';
    case 'CONTRAT_SIGNE':
    case 'EXECUTION':                    return 'SIGNE';
    case 'CLOTURE':                      return 'CLOTURE';
    case 'ANNULE':                       return 'RESILIE';
    default:                             return 'EN_PREPARATION';
  }
}

function d(val: string | Date | null | undefined): string {
  if (!val) return '';
  const s = typeof val === 'string' ? val : (val as Date).toISOString();
  return s.slice(0, 10);
}

// ─── Adapters ─────────────────────────────────────────────────────────────────

function adaptMarche(dto: PpmMarcheDto, versionId: string): PPMLigne {
  const x = parseNotes(dto.notes);
  const base = dto.montantEstime ?? 0;
  return {
    id:                   dto.id,
    ppm_version_id:       versionId,
    wbs_id:               x.wbs_id,
    budget_ligne_id:      x.budget_ligne_id,
    bailleur_id:          x.bailleur_id,
    reference_marche:     dto.code,
    description:          dto.intitule,
    categorie:            typeToCategorie(dto.type),
    methode:              x.methode,
    type_revue:           x.type_revue,
    montant_estime_devise: x.montant_estime_devise || base,
    devise_code:          x.devise_code,
    taux_change_estime:   x.taux_change_estime,
    montant_estime_base:  base,
    est_lot_unique:       x.est_lot_unique,
    montant_signe:        dto.montantSigne ?? undefined,
    titulaire:            dto.titulaire ?? undefined,
    date_fin_effective:   d(dto.dateFinEffective) || undefined,
    dates_cles: {
      preparation_dao_prevue:       x.d_prep_dao_p,
      preparation_dao_reelle:       x.d_prep_dao_r || undefined,
      lancement_dao_prevue:         d(dto.dateLancementPrevu),
      lancement_dao_reelle:         x.d_lanc_dao_r || undefined,
      remise_offres_prevue:         d(dto.dateSoumissionPrevu),
      remise_offres_reelle:         x.d_remise_r || undefined,
      ouverture_evaluation_prevue:  x.d_eval_p,
      ouverture_evaluation_reelle:  x.d_eval_r || undefined,
      avis_non_objection_prevue:    x.d_ano_p || undefined,
      avis_non_objection_reelle:    x.d_ano_r || undefined,
      attribution_prevue:           d(dto.dateAttribution),
      attribution_reelle:           x.d_attr_r || undefined,
      signature_contrat_prevue:     d(dto.dateSignature),
      signature_contrat_reelle:     x.d_sign_r || undefined,
      demarrage_prevue:             d(dto.dateFinPrevue),
      demarrage_reelle:             x.d_dema_r || undefined,
    },
    statut:       beStatutToFe(dto.statut),
    version_hash: dto.updatedAt,
  };
}

type LigneInput = Omit<PPMLigne, 'id' | 'version_hash' | 'ppm_version_id'>;

function ligneToCreatePayload(projectId: string, l: LigneInput) {
  const extra: PPMExtraMeta = {
    methode:               l.methode,
    type_revue:            l.type_revue,
    wbs_id:                l.wbs_id,
    budget_ligne_id:       l.budget_ligne_id,
    bailleur_id:           l.bailleur_id,
    devise_code:           l.devise_code,
    taux_change_estime:    l.taux_change_estime,
    montant_estime_devise: l.montant_estime_devise,
    est_lot_unique:        l.est_lot_unique,
    d_prep_dao_p: l.dates_cles.preparation_dao_prevue      || '',
    d_prep_dao_r: l.dates_cles.preparation_dao_reelle      || '',
    d_lanc_dao_r: l.dates_cles.lancement_dao_reelle        || '',
    d_remise_r:   l.dates_cles.remise_offres_reelle        || '',
    d_eval_p:     l.dates_cles.ouverture_evaluation_prevue || '',
    d_eval_r:     l.dates_cles.ouverture_evaluation_reelle || '',
    d_ano_p:      l.dates_cles.avis_non_objection_prevue   || '',
    d_ano_r:      l.dates_cles.avis_non_objection_reelle   || '',
    d_attr_r:     l.dates_cles.attribution_reelle          || '',
    d_sign_r:     l.dates_cles.signature_contrat_reelle    || '',
    d_dema_r:     l.dates_cles.demarrage_reelle            || '',
  };
  return {
    projectId,
    code:                 l.reference_marche,
    intitule:             l.description,
    type:                 categorieToType(l.categorie),
    statut:               l.statut ? feStatutToBe(l.statut as StatutLignePPM) : undefined,
    montantEstime:        l.montant_estime_base || undefined,
    montantSigne:         l.montant_signe || undefined,
    titulaire:            l.titulaire || undefined,
    dateFinEffective:     l.date_fin_effective || undefined,
    dateLancementPrevu:   l.dates_cles.lancement_dao_prevue    || undefined,
    dateSoumissionPrevu:  l.dates_cles.remise_offres_prevue    || undefined,
    dateAttribution:      l.dates_cles.attribution_prevue      || undefined,
    dateSignature:        l.dates_cles.signature_contrat_prevue || undefined,
    dateFinPrevue:        l.dates_cles.demarrage_prevue        || undefined,
    notes:                serializeNotes(extra),
  };
}

function ligneToUpdatePayload(l: Partial<PPMLigne>, existing: PPMLigne) {
  const merged = { ...existing, ...l };
  const extra: PPMExtraMeta = {
    methode:               merged.methode,
    type_revue:            merged.type_revue,
    wbs_id:                merged.wbs_id,
    budget_ligne_id:       merged.budget_ligne_id,
    bailleur_id:           merged.bailleur_id,
    devise_code:           merged.devise_code,
    taux_change_estime:    merged.taux_change_estime,
    montant_estime_devise: merged.montant_estime_devise,
    est_lot_unique:        merged.est_lot_unique,
    d_prep_dao_p: merged.dates_cles.preparation_dao_prevue      || '',
    d_prep_dao_r: merged.dates_cles.preparation_dao_reelle      || '',
    d_lanc_dao_r: merged.dates_cles.lancement_dao_reelle        || '',
    d_remise_r:   merged.dates_cles.remise_offres_reelle        || '',
    d_eval_p:     merged.dates_cles.ouverture_evaluation_prevue || '',
    d_eval_r:     merged.dates_cles.ouverture_evaluation_reelle || '',
    d_ano_p:      merged.dates_cles.avis_non_objection_prevue   || '',
    d_ano_r:      merged.dates_cles.avis_non_objection_reelle   || '',
    d_attr_r:     merged.dates_cles.attribution_reelle          || '',
    d_sign_r:     merged.dates_cles.signature_contrat_reelle    || '',
    d_dema_r:     merged.dates_cles.demarrage_reelle            || '',
  };
  return {
    code:                 merged.reference_marche,
    intitule:             merged.description,
    type:                 categorieToType(merged.categorie),
    statut:               merged.statut ? feStatutToBe(merged.statut as StatutLignePPM) : undefined,
    montantEstime:        merged.montant_estime_base || undefined,
    montantSigne:         merged.montant_signe || undefined,
    titulaire:            merged.titulaire || undefined,
    dateFinEffective:     merged.date_fin_effective || undefined,
    dateLancementPrevu:   merged.dates_cles.lancement_dao_prevue    || undefined,
    dateSoumissionPrevu:  merged.dates_cles.remise_offres_prevue    || undefined,
    dateAttribution:      merged.dates_cles.attribution_prevue      || undefined,
    dateSignature:        merged.dates_cles.signature_contrat_prevue || undefined,
    dateFinPrevue:        merged.dates_cles.demarrage_prevue        || undefined,
    notes:                serializeNotes(extra),
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
    .order('created_at', { ascending: false })
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
