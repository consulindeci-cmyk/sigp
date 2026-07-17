// ─────────────────────────────────────────────────────────────────────────────
// Project Adapter & Unified Types — 100% Synchronized with Backend DTOs
// Phase 19.5 : Harmonisation finale (dateFinEffective, initialesManager
//              centralisés, suppression hardcodes, UpdateProjectPayload enrichi)
// ─────────────────────────────────────────────────────────────────────────────

export type ProjectStatus =
  | 'En bonne voie'
  | 'À risque'
  | 'En retard'
  | 'Clôturé'
  | 'En préparation'
  | 'Annulé'
  | 'Suspendu';

export type ProjectSector =
  | 'Eau & Assainissement'
  | 'Agriculture'
  | 'Santé'
  | 'Éducation'
  | 'Infrastructure'
  | 'Énergie'
  | 'Gouvernance'
  | string;

export type ProjectStatusBackend =
  | 'EN_PREPARATION'
  | 'EN_COURS'
  | 'SUSPENDU'
  | 'CLOTURE'
  | 'ANNULE';

// Mirrors ProjectResponseDto exactly from sigp-backend-v1
export interface ProjectApiDto {
  id: string;
  code: string;
  nom: string;
  description: string | null;
  statut: string; // Prisma enum string: EN_PREPARATION, EN_COURS, SUSPENDU, CLOTURE, ANNULE
  bailleurPrincipal: string | null;
  secteur: string | null;
  pays: string | null;
  managerId: string | null;
  managerNom: string | null;
  managerPrenom: string | null;
  programmeId: string | null;
  budgetTotal: number | null;
  devise: string;
  dateDebut: string | null;
  dateFinPrevue: string | null;
  dateFinEffective: string | null;
  dateClotureEffective: string | null;
  progressScore: number;
  profileScore: number;
  tauxDecaissement: number;
  composantes: number;
  activites: number;
  livrables: number;
  createdAt: string;
  updatedAt: string;
  // SUPER_ADMIN uniquement — nom de l'organisation propriétaire du projet
  // (résolu en batch via programme_organisations_batch(), voir useProjects.ts).
  organisationNom?: string | null;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  description: string;
  donor: string;
  sector: ProjectSector;
  country: string;
  manager: string;
  initialesManager: string;
  startDate: string;
  endDate: string;
  /** ISO date string (YYYY-MM-DD) ou vide, champ de clôture */
  dateFinEffective: string;
  /** ISO date string (YYYY-MM-DD) ou vide, champ de clôture administrative */
  dateClotureEffective: string;
  budgetTotal: number;
  devise: string;
  budgetDisplay: string;
  status: ProjectStatus; // Translated French label for UI display
  statut: string;        // Exact backend enum string for API payloads
  managerId: string | null;
  programmeId?: string | null;
  profileScore: number;
  progressScore: number;
  tauxDecaissement: number;
  composantes: number;
  activites: number;
  livrables: number;
}

export type ProjectRow = Project & {
  programmeId?: string | null;
  rawManagerId?: string | null;
  organisationNom?: string | null;
};

export interface CreateProjectPayload {
  code?: string;
  nom?: string;
  description?: string;
  bailleurPrincipal?: string;
  secteur?: string;
  pays?: string;
  managerId?: string;
  dateDebut?: string;
  dateFinPrevue?: string;
  dateFinEffective?: string;
  dateClotureEffective?: string;
  budgetTotal?: number;
  devise?: string;
  statut?: string; // Exact backend enum
  programmeId?: string;
}

/** Payload PATCH — note: le champ `code` est IMMUABLE côté backend et est
 *  intentionnellement absent de ce type afin d'éviter un envoi accidentel. */
export interface UpdateProjectPayload {
  nom?: string;
  description?: string;
  bailleurPrincipal?: string;
  secteur?: string;
  pays?: string;
  managerId?: string;
  dateDebut?: string;
  dateFinPrevue?: string;
  dateFinEffective?: string;
  dateClotureEffective?: string;
  budgetTotal?: number;
  devise?: string;
  statut?: string;
  programmeId?: string;
}

export interface ProjectsKPIs {
  total: number;
  enBonneVoie: number;
  aRisque: number;
  enRetard: number;
  clotured: number;
  budgetPortefeuille: string;
}

// Convert DB/API Enum status to UI French label
export function statutToStatus(statut?: string): ProjectStatus {
  switch (statut) {
    case 'EN_COURS':
      return 'En bonne voie';
    case 'SUSPENDU':
      return 'À risque';
    case 'CLOTURE':
      return 'Clôturé';
    case 'ANNULE':
      return 'Annulé';
    case 'EN_PREPARATION':
    default:
      return 'En préparation';
  }
}

// Convert UI French label to DB/API Enum status
export function statusToStatut(status?: string): string {
  switch (status) {
    case 'En bonne voie':
      return 'EN_COURS';
    case 'À risque':
      return 'SUSPENDU';
    case 'Clôturé':
      return 'CLOTURE';
    case 'Annulé':
      return 'ANNULE';
    case 'En retard':
      return 'EN_COURS'; // En retard is still active EN_COURS with delayed dates
    case 'En préparation':
    default:
      return 'EN_PREPARATION';
  }
}

export function formatBudget(amount: number | null | undefined, devise = 'XOF'): string {
  const val = Number(amount ?? 0);
  const sym = devise === 'EUR' ? '€' : devise === 'XOF' ? ' FCFA' : '$';
  if (val >= 1_000_000) {
    return `${(val / 1_000_000).toFixed(1)}M${sym}`;
  }
  return `${val.toLocaleString('fr-FR')}${sym}`;
}

/**
 * Calcule les initiales du chef de projet depuis son prénom et nom.
 * Centralisé ici pour éliminer les duplications dans ProjectSlideOver, etc.
 */
export function computeInitiales(prenom: string | null | undefined, nom: string | null | undefined): string {
  const parts = [prenom, nom].filter(Boolean).join(' ').trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ''}${parts[parts.length - 1]?.[0] ?? ''}`.toUpperCase();
  }
  return (parts[0]?.[0] ?? 'N').toUpperCase();
}

/**
 * Mappe le DTO API backend vers l'objet ProjectRow enrichi pour l'UI.
 * Aucune valeur n'est codée en dur — les champs nuls sont représentés
 * comme chaînes vides ou 0 pour garantir un rendu propre.
 */
export function adaptProjectDto(raw: ProjectApiDto): ProjectRow {
  const managerName = raw.managerPrenom && raw.managerNom
    ? `${raw.managerPrenom} ${raw.managerNom}`.trim()
    : (raw.managerNom || raw.managerPrenom || '');

  const initialesManager = computeInitiales(raw.managerPrenom, raw.managerNom);

  const devise = raw.devise || 'XOF';
  const budgetTotal = Number(raw.budgetTotal ?? 0);

  return {
    id: raw.id,
    code: raw.code,
    name: raw.nom,
    description: raw.description || '',
    donor: raw.bailleurPrincipal || '',
    sector: raw.secteur || '',
    country: raw.pays || '',
    manager: managerName,
    initialesManager,
    startDate: raw.dateDebut ? new Date(raw.dateDebut).toISOString().slice(0, 10) : '',
    endDate: raw.dateFinPrevue ? new Date(raw.dateFinPrevue).toISOString().slice(0, 10) : '',
    dateFinEffective: raw.dateFinEffective ? new Date(raw.dateFinEffective).toISOString().slice(0, 10) : '',
    dateClotureEffective: raw.dateClotureEffective ? new Date(raw.dateClotureEffective).toISOString().slice(0, 10) : '',
    budgetTotal,
    devise,
    budgetDisplay: formatBudget(raw.budgetTotal, devise),
    status: statutToStatus(raw.statut),
    statut: raw.statut,
    managerId: raw.managerId,
    programmeId: raw.programmeId,
    rawManagerId: raw.managerId,
    profileScore: raw.profileScore ?? 0,
    progressScore: raw.progressScore ?? 0,
    tauxDecaissement: raw.tauxDecaissement ?? 0,
    composantes: raw.composantes ?? 0,
    activites: raw.activites ?? 0,
    livrables: raw.livrables ?? 0,
    organisationNom: raw.organisationNom ?? undefined,
  };
}

export function adaptToRow(raw: ProjectApiDto): ProjectRow {
  return adaptProjectDto(raw);
}
