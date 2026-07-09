import type { Project, ProjectSector, ProjectStatus } from '@/mocks/projectsMocks';

// Mirrors ProjectResponseDto from sigp-backend-v1
export interface ProjectApiDto {
  id: string;
  code: string;
  nom: string;
  description: string | null;
  statut: string;
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
  createdAt: string;
  updatedAt: string;
}

export function statutToStatus(statut: string): ProjectStatus {
  switch (statut) {
    case 'EN_COURS':        return 'En bonne voie';
    case 'SUSPENDU':        return 'À risque';
    case 'CLOTURE':         return 'Clôturé';
    case 'ANNULE':          return 'Clôturé';
    case 'EN_PREPARATION':  return 'En préparation';
    default:                return 'En préparation';
  }
}

export function formatBudget(amount: number | null, devise: string): string {
  if (!amount) return `0 ${devise}`;
  if (amount >= 1_000_000)
    return `${(amount / 1_000_000).toFixed(1).replace('.', ',')} M ${devise}`;
  return `${amount.toLocaleString('fr-FR')} ${devise}`;
}

export function adaptProjectDto(raw: ProjectApiDto): Project {
  const managerName = [raw.managerPrenom, raw.managerNom].filter(Boolean).join(' ');
  const budgetTotal = raw.budgetTotal ?? 0;
  const devise = raw.devise ?? 'XOF';
  return {
    id: raw.id,
    code: raw.code,
    name: raw.nom,
    description: raw.description ?? '',
    donor: raw.bailleurPrincipal ?? '',
    sector: (raw.secteur ?? 'Infrastructure') as ProjectSector,
    country: raw.pays ?? '',
    manager: managerName || raw.managerId || '',
    initialesManager: raw.managerPrenom && raw.managerNom
      ? (raw.managerPrenom[0] + raw.managerNom[0]).toUpperCase()
      : '??',
    startDate: raw.dateDebut ? new Date(raw.dateDebut).toISOString().slice(0, 10) : '',
    endDate: raw.dateFinPrevue ? new Date(raw.dateFinPrevue).toISOString().slice(0, 10) : '',
    budgetTotal,
    devise,
    budgetDisplay: formatBudget(raw.budgetTotal, devise),
    status: statutToStatus(raw.statut),
    profileScore: 0,
    progressScore: 0,
    tauxDecaissement: 0,
    composantes: 0,
    activites: 0,
    livrables: 0,
  };
}
