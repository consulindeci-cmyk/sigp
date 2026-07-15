import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { invokeEdgeFunction } from '@/lib/supabaseFunctions';
import type { Contract, ContractStatus } from '@/types/contract';

// ── Cache keys ────────────────────────────────────────────────────────────────

export const contractKeys = {
  all: (projectId: string) => ['contracts', projectId] as const,
};

// ── Ligne Supabase (colonnes snake_case de la table `contracts`) ──────────────

interface ContractRow {
  id: string;
  project_id: string;
  numero: string;
  intitule: string;
  statut: 'ACTIF' | 'SUSPENDU' | 'CLOTURE' | 'RESILIE';
  titulaire: string;
  montant: number;
  devise: string;
  date_signature: string | null;
  date_debut: string | null;
  date_fin: string | null;
  notes: string | null;
  updated_at: string;
}

const CONTRACT_SELECT = 'id, project_id, numero, intitule, statut, titulaire, montant, devise, date_signature, date_debut, date_fin, notes, updated_at';

// ── Meta encoding (notes field) ───────────────────────────────────────────────
// Frontend-only fields stored in backend.notes as JSON — inchangé, indépendant
// du backend (NestJS ou Supabase partagent la même colonne `notes`).

const CONTRACT_META_PREFIX = '__CONTRACT_META__:';

interface ContractMeta {
  feStatut: ContractStatus;
  wbs_id?: string;
  budget_ligne_id?: string;
  ppm_ligne_id?: string;
  bailleur_id?: string;
  taux_change_contractuel?: number;
  montant_initial_base?: number;
  date_ordre_service?: string;
  debut_reel?: string;
  fin_reelle?: string;
  reception_provisoire?: string;
  reception_definitive?: string;
  garantie_bonne_execution_taux?: number;
  garantie_avance_taux?: number;
  retenue_garantie_taux?: number;
  date_expiration_garantie?: string;
}

function encodeMeta(meta: ContractMeta): string {
  return `${CONTRACT_META_PREFIX}${JSON.stringify(meta)}`;
}

function decodeMeta(notes: string | null | undefined): ContractMeta | null {
  if (!notes?.startsWith(CONTRACT_META_PREFIX)) return null;
  try {
    return JSON.parse(notes.slice(CONTRACT_META_PREFIX.length)) as ContractMeta;
  } catch {
    return null;
  }
}

// ── Status mapping ─────────────────────────────────────────────────────────────
// Backend: ACTIF | SUSPENDU | CLOTURE | RESILIE
// Frontend: BROUILLON | SIGNE | EN_EXECUTION | SUSPENDU | RESILIE | TERMINE | CLOTURE

function feToBeStatus(fe: ContractStatus): 'ACTIF' | 'SUSPENDU' | 'CLOTURE' | 'RESILIE' {
  switch (fe) {
    case 'BROUILLON':
    case 'SIGNE':
    case 'EN_EXECUTION': return 'ACTIF';
    case 'SUSPENDU':     return 'SUSPENDU';
    case 'RESILIE':      return 'RESILIE';
    case 'TERMINE':
    case 'CLOTURE':      return 'CLOTURE';
    default:             return 'ACTIF';
  }
}

function beToFeStatus(be: string): ContractStatus {
  switch (be) {
    case 'SUSPENDU': return 'SUSPENDU';
    case 'CLOTURE':  return 'CLOTURE';
    case 'RESILIE':  return 'RESILIE';
    default:         return 'EN_EXECUTION'; // ACTIF → EN_EXECUTION
  }
}

// ── Adapter: ligne Supabase → frontend Contract ───────────────────────────────

function toIsoDate(val: string | null | undefined): string | undefined {
  if (!val) return undefined;
  return val.split('T')[0]; // strip time component
}

function adaptContract(row: ContractRow): Contract {
  const meta = decodeMeta(row.notes);
  const feStatut: ContractStatus = meta?.feStatut ?? beToFeStatus(row.statut);
  const montantDevise = Number(row.montant);
  const taux = meta?.taux_change_contractuel ?? 1;
  const montantBase = meta?.montant_initial_base ?? montantDevise;

  return {
    id:                        row.id,
    projet_id:                 row.project_id,
    wbs_id:                    meta?.wbs_id           ?? '',
    budget_ligne_id:           meta?.budget_ligne_id   ?? '',
    ppm_ligne_id:              meta?.ppm_ligne_id      ?? '',
    bailleur_id:               meta?.bailleur_id       ?? '',
    fournisseur_id:            row.titulaire,
    reference:                 row.numero,
    intitule:                  row.intitule,
    statut:                    feStatut,
    devise_code:               row.devise,
    taux_change_contractuel:   taux,
    montant_initial_devise:    montantDevise,
    montant_initial_base:      montantBase,
    date_signature:            toIsoDate(row.date_signature),
    date_ordre_service:        meta?.date_ordre_service,
    debut_prevu:               toIsoDate(row.date_debut),
    debut_reel:                meta?.debut_reel,
    fin_prevue:                toIsoDate(row.date_fin),
    fin_reelle:                meta?.fin_reelle,
    reception_provisoire:      meta?.reception_provisoire,
    reception_definitive:      meta?.reception_definitive,
    garantie_bonne_execution_taux: meta?.garantie_bonne_execution_taux,
    garantie_avance_taux:      meta?.garantie_avance_taux,
    retenue_garantie_taux:     meta?.retenue_garantie_taux,
    date_expiration_garantie:  meta?.date_expiration_garantie,
    version_hash:              row.updated_at,
  };
}

// ── Payload builders ──────────────────────────────────────────────────────────

type ContractFormData = Omit<Contract, 'id' | 'version_hash' | 'projet_id'>;

function buildCreatePayload(projectId: string, data: ContractFormData) {
  const meta: ContractMeta = {
    feStatut:                 data.statut,
    wbs_id:                   data.wbs_id        || undefined,
    budget_ligne_id:          data.budget_ligne_id || undefined,
    ppm_ligne_id:             data.ppm_ligne_id   || undefined,
    bailleur_id:              data.bailleur_id    || undefined,
    taux_change_contractuel:  data.taux_change_contractuel,
    montant_initial_base:     data.montant_initial_base,
    date_ordre_service:       data.date_ordre_service,
    debut_reel:               data.debut_reel,
    fin_reelle:               data.fin_reelle,
    reception_provisoire:     data.reception_provisoire,
    reception_definitive:     data.reception_definitive,
    garantie_bonne_execution_taux: data.garantie_bonne_execution_taux,
    garantie_avance_taux:     data.garantie_avance_taux,
    retenue_garantie_taux:    data.retenue_garantie_taux,
    date_expiration_garantie: data.date_expiration_garantie,
  };

  return {
    projectId,
    numero:   data.reference,
    intitule: data.intitule,
    titulaire: data.fournisseur_id || '',
    montant:  data.montant_initial_devise,
    devise:   data.devise_code || 'XOF',
    statut:   feToBeStatus(data.statut),
    dateSignature: data.date_signature || undefined,
    dateDebut:     data.debut_prevu   || undefined,
    dateFin:       data.fin_prevue    || undefined,
    notes: encodeMeta(meta),
  };
}

function buildUpdatePayload(data: Partial<Contract>) {
  const meta: Partial<ContractMeta> = {};
  if (data.statut                     !== undefined) meta.feStatut                 = data.statut;
  if (data.wbs_id                     !== undefined) meta.wbs_id                   = data.wbs_id        || undefined;
  if (data.budget_ligne_id            !== undefined) meta.budget_ligne_id           = data.budget_ligne_id || undefined;
  if (data.ppm_ligne_id               !== undefined) meta.ppm_ligne_id              = data.ppm_ligne_id   || undefined;
  if (data.bailleur_id                !== undefined) meta.bailleur_id               = data.bailleur_id    || undefined;
  if (data.taux_change_contractuel    !== undefined) meta.taux_change_contractuel   = data.taux_change_contractuel;
  if (data.montant_initial_base       !== undefined) meta.montant_initial_base       = data.montant_initial_base;
  if (data.date_ordre_service         !== undefined) meta.date_ordre_service         = data.date_ordre_service;
  if (data.debut_reel                 !== undefined) meta.debut_reel                 = data.debut_reel;
  if (data.fin_reelle                 !== undefined) meta.fin_reelle                 = data.fin_reelle;
  if (data.reception_provisoire       !== undefined) meta.reception_provisoire       = data.reception_provisoire;
  if (data.reception_definitive       !== undefined) meta.reception_definitive       = data.reception_definitive;
  if (data.garantie_bonne_execution_taux !== undefined) meta.garantie_bonne_execution_taux = data.garantie_bonne_execution_taux;
  if (data.garantie_avance_taux       !== undefined) meta.garantie_avance_taux       = data.garantie_avance_taux;
  if (data.retenue_garantie_taux      !== undefined) meta.retenue_garantie_taux      = data.retenue_garantie_taux;
  if (data.date_expiration_garantie   !== undefined) meta.date_expiration_garantie   = data.date_expiration_garantie;

  return {
    numero:    data.reference            ?? undefined,
    intitule:  data.intitule             ?? undefined,
    titulaire: data.fournisseur_id       ?? undefined,
    montant:   data.montant_initial_devise ?? undefined,
    devise:    data.devise_code          ?? undefined,
    statut:    data.statut ? feToBeStatus(data.statut) : undefined,
    dateSignature: data.date_signature   ?? undefined,
    dateDebut:     data.debut_prevu      ?? undefined,
    dateFin:       data.fin_prevue       ?? undefined,
    notes: Object.keys(meta).length
      ? encodeMeta(meta as ContractMeta)
      : undefined,
  };
}

// ── Fetch ─────────────────────────────────────────────────────────────────────

async function fetchContracts(projectId: string): Promise<Contract[]> {
  const { data, error } = await supabase
    .from('contracts')
    .select(CONTRACT_SELECT)
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data as unknown as ContractRow[]).map(adaptContract);
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useContracts(projectId: string) {
  return useQuery({
    queryKey: contractKeys.all(projectId),
    queryFn: () => fetchContracts(projectId),
    enabled: !!projectId,
  });
}

export function useCreateContract(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: ContractFormData): Promise<Contract> => {
      const payload = buildCreatePayload(projectId, data);
      const { data: resp } = await invokeEdgeFunction<{ data: ContractRow }>('contracts-create', payload);
      return adaptContract(resp);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: contractKeys.all(projectId) }),
    onError:   () => qc.invalidateQueries({ queryKey: contractKeys.all(projectId) }),
  });
}

export function useUpdateContract(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Contract> }) => {
      const payload = buildUpdatePayload(data);
      const { data: resp } = await invokeEdgeFunction<{ data: ContractRow }>('contracts-update', { id, ...payload });
      return adaptContract(resp);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: contractKeys.all(projectId) }),
    onError:   () => qc.invalidateQueries({ queryKey: contractKeys.all(projectId) }),
  });
}

export function useDeleteContract(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (contractId: string) => {
      await invokeEdgeFunction<{ message: string }>('contracts-delete', { id: contractId });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: contractKeys.all(projectId) }),
    onError:   () => qc.invalidateQueries({ queryKey: contractKeys.all(projectId) }),
  });
}
