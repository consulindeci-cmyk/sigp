// ─────────────────────────────────────────────────────────────────────────────
// Organisation Adapter — Page Super Admin "Organisations"
// Source : Edge Function organisations-list, elle-même appuyée sur la
// fonction SQL organisation_overview() (comptages agrégés côté base).
// ─────────────────────────────────────────────────────────────────────────────

export type OrganisationStatut = 'ACTIVE' | 'SUSPENDUE';
export type DeviseOrganisation = 'XOF' | 'EUR' | 'USD';
export const DEVISE_OPTIONS: { value: DeviseOrganisation; label: string }[] = [
  { value: 'XOF', label: 'XOF — Franc CFA (BCEAO)' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'USD', label: 'USD — Dollar américain' },
];

// Ligne brute renvoyée par organisation_overview() (snake_case Postgres).
export interface OrganisationOverviewRow {
  id: string;
  nom: string | null;
  adresse: string | null;
  ville: string | null;
  pays: string | null;
  telephone: string | null;
  email: string | null;
  site_web: string | null;
  devise_defaut: string | null;
  identifiant_fiscal: string | null;
  statut: string;
  created_at: string;
  org_admin_id: string | null;
  org_admin_nom: string | null;
  org_admin_prenom: string | null;
  org_admin_email: string | null;
  org_admin_count: number;
  projets_actifs_count: number;
  budget_total_actif: number;
  utilisateurs_count: number;
}

export interface OrganisationRow {
  id: string;
  nom: string;
  adresse: string;
  ville: string;
  pays: string;
  telephone: string;
  email: string;
  siteWeb: string;
  deviseDefaut: DeviseOrganisation;
  identifiantFiscal: string;
  statut: OrganisationStatut;
  statutLabel: 'Actif' | 'Suspendu';
  createdAt: string;
  createdAtDisplay: string;
  orgAdminId: string | null;
  orgAdminNom: string;
  orgAdminEmail: string;
  orgAdminCount: number;
  projetsActifsCount: number;
  budgetTotalActif: number;
  utilisateursCount: number;
}

export function adaptOrganisationRow(row: OrganisationOverviewRow): OrganisationRow {
  const statut: OrganisationStatut = row.statut === 'SUSPENDUE' ? 'SUSPENDUE' : 'ACTIVE';

  let createdAtDisplay = '—';
  if (row.created_at) {
    try {
      createdAtDisplay = new Date(row.created_at).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      createdAtDisplay = row.created_at.split('T')[0] ?? '';
    }
  }

  const orgAdminNom = row.org_admin_prenom || row.org_admin_nom
    ? `${row.org_admin_prenom ?? ''} ${row.org_admin_nom ?? ''}`.trim()
    : '—';

  return {
    id: row.id,
    nom: row.nom ?? 'Organisation sans nom',
    adresse: row.adresse ?? '',
    ville: row.ville ?? '',
    pays: row.pays ?? '',
    telephone: row.telephone ?? '',
    email: row.email ?? '',
    siteWeb: row.site_web ?? '',
    deviseDefaut: (row.devise_defaut as DeviseOrganisation) || 'XOF',
    identifiantFiscal: row.identifiant_fiscal ?? '',
    statut,
    statutLabel: statut === 'SUSPENDUE' ? 'Suspendu' : 'Actif',
    createdAt: row.created_at,
    createdAtDisplay,
    orgAdminId: row.org_admin_id,
    orgAdminNom,
    orgAdminEmail: row.org_admin_email ?? '—',
    orgAdminCount: row.org_admin_count ?? 0,
    projetsActifsCount: row.projets_actifs_count ?? 0,
    budgetTotalActif: Number(row.budget_total_actif ?? 0),
    utilisateursCount: row.utilisateurs_count ?? 0,
  };
}

export interface OrganisationsKPIs {
  total: number;
  actives: number;
  suspendues: number;
  utilisateursTotal: number;
}

export function computeOrganisationsKPIs(rows: OrganisationRow[]): OrganisationsKPIs {
  return rows.reduce<OrganisationsKPIs>(
    (acc, row) => {
      acc.total += 1;
      if (row.statut === 'SUSPENDUE') acc.suspendues += 1;
      else acc.actives += 1;
      acc.utilisateursTotal += row.utilisateursCount;
      return acc;
    },
    { total: 0, actives: 0, suspendues: 0, utilisateursTotal: 0 }
  );
}

// ── Payloads mutations ────────────────────────────────────────────────────────

export interface UpdateOrganisationAdminPayload {
  organisationId: string;
  nom?: string;
  adresse?: string;
  ville?: string;
  pays?: string;
  telephone?: string;
  email?: string;
  siteWeb?: string;
  deviseDefaut?: DeviseOrganisation;
  identifiantFiscal?: string;
  statut?: OrganisationStatut;
}

export interface CreateOrganisationAdminPayload {
  nom: string;
  adresse?: string;
  ville?: string;
  pays?: string;
  telephone?: string;
  email?: string;
  siteWeb?: string;
  deviseDefaut?: DeviseOrganisation;
  identifiantFiscal?: string;
  adminNom: string;
  adminPrenom: string;
  adminEmail: string;
  adminTelephone?: string;
}
