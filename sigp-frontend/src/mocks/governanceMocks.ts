// ==========================================
// TYPES
// ==========================================

export type ActorRole =
  | 'Responsable Projet'
  | 'Sponsor'
  | 'Chef de Composante'
  | 'Expert Technique'
  | 'Expert Financier'
  | 'Coordinateur'
  | 'Chargé de Passation'
  | 'Assistant Administratif'
  | 'Représentant Bailleur'
  | 'Auditeur Externe'
  | 'Membre';

export type ActorStatus = 'Actif' | 'Inactif' | 'En congé';

export type StakeholderType =
  | 'Bailleur'
  | 'Gouvernement'
  | 'ONG Partenaire'
  | 'Secteur Privé'
  | 'Société Civile'
  | 'Bénéficiaire';

export type CommitteeType = 'Comité de Pilotage' | 'Comité Technique' | 'Comité de Coordination';

export interface TeamMember {
  id: string;
  // Toujours rattaché à un utilisateur réel de l'organisation (sélecteur, cf.
  // useOrganisationMembersForPicker) — userId permet de re-sélectionner la
  // personne en édition ; nom/prenom sont l'instantané copié côté serveur,
  // isPending signale un profil invité qui n'a pas encore renseigné son identité.
  userId: string;
  nom: string;
  prenom: string;
  isPending: boolean;
  role: ActorRole;
  structure: string;
  email: string;
  telephone: string;
  status: ActorStatus;
  dateDebut: string;
  initiales: string;
}

export interface Stakeholder {
  id: string;
  organisation: string;
  type: StakeholderType;
  representant: string;
  email: string;
  telephone: string;
  niveauEngagement: 'Élevé' | 'Moyen' | 'Faible';
  status: ActorStatus;
}

export interface CommitteeMember {
  id: string;
  nom: string;
  prenom: string;
  fonction: string;
  organisation: string;
  email: string;
  telephone: string;
  type: CommitteeType;
  presidentRole: boolean;
  status: ActorStatus;
}

export interface Contact {
  id: string;
  nom: string;
  prenom: string;
  organisation: string;
  email: string;
  telephone: string;
  fonction: string;
  categorie: 'Urgence' | 'Technique' | 'Administratif' | 'Bailleur';
}
