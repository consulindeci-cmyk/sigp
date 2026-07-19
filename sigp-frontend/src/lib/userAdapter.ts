// ─────────────────────────────────────────────────────────────────────────────
// User Adapter & Unified Types — 100% Synchronized with Backend DTOs
// Phase 20.1 : Harmonisation Enterprise du module Users (/users)
// ─────────────────────────────────────────────────────────────────────────────

export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'COORDINATEUR'
  | 'CHARGE_PROGRAMME'
  | 'FINANCIER'
  | 'AUDITEUR'
  | 'VIEWER';

// SUPER_ADMIN volontairement absent de USER_ROLE_OPTIONS ci-dessous : non
// assignable via le formulaire standard "Nouvel utilisateur"/"Modifier" —
// uniquement provisionné via l'onboarding d'une organisation
// (organisations-create) ou une promotion manuelle en base.
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Administrateur',
  ADMIN: 'Administrateur',
  COORDINATEUR: 'Coordinateur Projet',
  CHARGE_PROGRAMME: 'Chargé de Programme',
  FINANCIER: 'Responsable Financier',
  AUDITEUR: 'Auditeur',
  VIEWER: 'Observateur / Lecteur',
};

export const USER_ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'ADMIN', label: USER_ROLE_LABELS.ADMIN },
  { value: 'COORDINATEUR', label: USER_ROLE_LABELS.COORDINATEUR },
  { value: 'CHARGE_PROGRAMME', label: USER_ROLE_LABELS.CHARGE_PROGRAMME },
  { value: 'FINANCIER', label: USER_ROLE_LABELS.FINANCIER },
  { value: 'AUDITEUR', label: USER_ROLE_LABELS.AUDITEUR },
  { value: 'VIEWER', label: USER_ROLE_LABELS.VIEWER },
];

// Mirrors UserResponseDto exactly from sigp-backend-v1
export interface UserApiDto {
  id: string;
  // Nullable : un profil "email d'abord" (statut PENDING, cf. isPending
  // dérivé de derniereConnexion) n'a pas encore d'identité — l'utilisateur
  // la renseigne lui-même à sa première connexion.
  nom: string | null;
  prenom: string | null;
  email: string;
  role: UserRole;
  actif: boolean;
  telephone: string | null;
  languePreference: string;
  avatarUrl: string | null;
  derniereConnexion: string | null;
  createdAt: string;
  updatedAt: string;
  // SUPER_ADMIN uniquement — organisation de rattachement (vue plateforme).
  organisationId?: string | null;
  organisationNom?: string | null;
}

export interface User {
  id: string;
  nom: string | null;
  prenom: string | null;
  fullName: string;
  initiales: string;
  email: string;
  role: UserRole;
  roleLabel: string;
  actif: boolean;
  // Un profil invité (email d'abord) n'a jamais complété sa première
  // connexion — dérivé de derniereConnexion, aucune colonne dédiée.
  isPending: boolean;
  statutLabel: 'Actif' | 'Désactivé' | 'Invité';
  telephone: string | null;
  languePreference: string;
  avatarUrl: string | null;
  derniereConnexion: string | null;
  derniereConnexionDisplay: string;
  createdAt: string;
  createdAtDisplay: string;
  updatedAt: string;
  organisationId: string | null;
  organisationNom: string | null;
}

export type UserRow = User;

export interface CreateUserPayload {
  // Optionnels : flux "email d'abord" — un profil PENDING peut être créé
  // avec seulement un email, l'identité est renseignée par l'utilisateur
  // lui-même à sa première connexion.
  nom?: string;
  prenom?: string;
  email: string;
  // Aucun mot de passe côté client : le compte est toujours créé par
  // invitation (inviteUserByEmail), le destinataire définit le sien via le
  // lien reçu par e-mail — SUPER_ADMIN comme flux d'invitation d'équipe.
  role?: UserRole;
  telephone?: string;
  // SUPER_ADMIN uniquement — organisation de rattachement obligatoire pour
  // le nouvel administrateur d'organisation créé (cf. users-create).
  organisationId?: string;
  // Flux "email d'abord" — présent uniquement quand la vérification email a
  // trouvé un profil orphelin (organisation_id NULL) à rattacher : dans ce
  // cas la soumission n'appelle pas users-create mais users-update
  // (organisationId + role), cf. useUserActions.handleSaveCreate.
  existingUserId?: string;
}

export interface UpdateUserPayload {
  nom?: string;
  prenom?: string;
  telephone?: string;
  role?: UserRole;
  actif?: boolean;
  // SUPER_ADMIN uniquement — rattache un profil "orphelin" (organisation_id
  // actuellement NULL) à une organisation. Refusé côté serveur si l'utilisateur
  // appartient déjà à une organisation (pas de réaffectation cross-org).
  organisationId?: string;
}

export interface UsersKPIs {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  administrators: number;
  superAdmins: number;
  coordinators: number;
  financiers: number;
  auditors: number;
  viewers: number;
}

/**
 * Adapter: transforme un UserApiDto (backend) en UserRow (frontend) enrichi
 * avec initiales, libellés français et dates formatées.
 */
export function adaptUserDto(dto: UserApiDto): UserRow {
  // Jamais connecté depuis l'invitation = profil "email d'abord" toujours en
  // attente que la personne définisse son identité et son mot de passe.
  const isPending = dto.derniereConnexion === null;
  const initiales = isPending ? '…' : `${dto.prenom?.[0] ?? '?'}${dto.nom?.[0] ?? '?'}`.toUpperCase();
  const fullName = dto.nom || dto.prenom ? `${dto.prenom ?? ''} ${dto.nom ?? ''}`.trim() : dto.email;
  const roleLabel = USER_ROLE_LABELS[dto.role] ?? dto.role;
  const statutLabel = !dto.actif ? 'Désactivé' : isPending ? 'Invité' : 'Actif';

  let derniereConnexionDisplay = '—';
  if (dto.derniereConnexion) {
    try {
      derniereConnexionDisplay = new Date(dto.derniereConnexion).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      derniereConnexionDisplay = dto.derniereConnexion;
    }
  }

  let createdAtDisplay = '';
  if (dto.createdAt) {
    try {
      createdAtDisplay = new Date(dto.createdAt).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      createdAtDisplay = dto.createdAt.split('T')[0] ?? '';
    }
  }

  return {
    id: dto.id,
    nom: dto.nom,
    prenom: dto.prenom,
    fullName,
    initiales,
    email: dto.email,
    role: dto.role,
    roleLabel,
    actif: dto.actif,
    isPending,
    statutLabel,
    telephone: dto.telephone,
    languePreference: dto.languePreference ?? 'fr',
    avatarUrl: dto.avatarUrl,
    derniereConnexion: dto.derniereConnexion,
    derniereConnexionDisplay,
    createdAt: dto.createdAt,
    createdAtDisplay,
    updatedAt: dto.updatedAt,
    organisationId: dto.organisationId ?? null,
    organisationNom: dto.organisationNom ?? null,
  };
}
