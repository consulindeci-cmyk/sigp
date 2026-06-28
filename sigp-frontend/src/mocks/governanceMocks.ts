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
  nom: string;
  prenom: string;
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

// ==========================================
// MOCK: KEY ACTORS
// ==========================================

export const mockResponsableProjet: TeamMember = {
  id: 'rp1',
  nom: 'Diallo',
  prenom: 'Amadou',
  role: 'Responsable Projet',
  structure: 'Ministère du Développement Rural',
  email: 'a.diallo@mdr.gov.ne',
  telephone: '+227 90 12 34 56',
  status: 'Actif',
  dateDebut: '2023-03-01',
  initiales: 'AD',
};

export const mockSponsor: TeamMember = {
  id: 'sp1',
  nom: 'Maïga',
  prenom: 'Ibrahim',
  role: 'Sponsor',
  structure: 'Cabinet du Ministre',
  email: 'i.maiga@cabinet.gov.ne',
  telephone: '+227 96 78 90 12',
  status: 'Actif',
  dateDebut: '2023-01-15',
  initiales: 'IM',
};

// ==========================================
// MOCK: ÉQUIPE PROJET
// ==========================================

export const mockTeamMembers: TeamMember[] = [
  {
    id: 'tm1',
    nom: 'Diallo',
    prenom: 'Amadou',
    role: 'Responsable Projet',
    structure: 'Ministère du Développement Rural',
    email: 'a.diallo@mdr.gov.ne',
    telephone: '+227 90 12 34 56',
    status: 'Actif',
    dateDebut: '2023-03-01',
    initiales: 'AD',
  },
  {
    id: 'tm2',
    nom: 'Moussa',
    prenom: 'Fatoumata',
    role: 'Expert Financier',
    structure: 'UFG — Unité de Gestion du Projet',
    email: 'f.moussa@ugp.gov.ne',
    telephone: '+227 91 23 45 67',
    status: 'Actif',
    dateDebut: '2023-04-15',
    initiales: 'FM',
  },
  {
    id: 'tm3',
    nom: 'Issa',
    prenom: 'Boubacar',
    role: 'Chargé de Passation',
    structure: 'UFG — Unité de Gestion du Projet',
    email: 'b.issa@ugp.gov.ne',
    telephone: '+227 93 45 67 89',
    status: 'Actif',
    dateDebut: '2023-05-01',
    initiales: 'BI',
  },
  {
    id: 'tm4',
    nom: 'Koné',
    prenom: 'Aïchata',
    role: 'Expert Technique',
    structure: 'Direction Générale des Infrastructures',
    email: 'a.kone@dgi.gov.ne',
    telephone: '+227 94 56 78 90',
    status: 'Actif',
    dateDebut: '2023-06-01',
    initiales: 'AK',
  },
  {
    id: 'tm5',
    nom: 'Hamidou',
    prenom: 'Rabiou',
    role: 'Coordinateur',
    structure: 'UFG — Unité de Gestion du Projet',
    email: 'r.hamidou@ugp.gov.ne',
    telephone: '+227 95 67 89 01',
    status: 'Actif',
    dateDebut: '2023-07-15',
    initiales: 'RH',
  },
  {
    id: 'tm6',
    nom: 'Sani',
    prenom: 'Mariama',
    role: 'Assistant Administratif',
    structure: 'UFG — Unité de Gestion du Projet',
    email: 'm.sani@ugp.gov.ne',
    telephone: '+227 96 78 90 12',
    status: 'En congé',
    dateDebut: '2023-09-01',
    initiales: 'MS',
  },
  {
    id: 'tm7',
    nom: 'Traoré',
    prenom: 'Salif',
    role: 'Chef de Composante',
    structure: 'Direction Régionale Agriculture',
    email: 's.traore@dra.gov.ne',
    telephone: '+227 97 89 01 23',
    status: 'Actif',
    dateDebut: '2023-10-01',
    initiales: 'ST',
  },
];

// ==========================================
// MOCK: COMITÉ DE PILOTAGE
// ==========================================

export const mockCommitteeMembers: CommitteeMember[] = [
  {
    id: 'cm1',
    nom: 'Maïga',
    prenom: 'Ibrahim',
    fonction: 'Ministre du Développement Rural',
    organisation: 'Cabinet du Ministre',
    type: 'Comité de Pilotage',
    presidentRole: true,
    status: 'Actif',
  },
  {
    id: 'cm2',
    nom: 'Adamou',
    prenom: 'Tahir',
    fonction: 'Directeur Général',
    organisation: 'Agence Française de Développement',
    type: 'Comité de Pilotage',
    presidentRole: false,
    status: 'Actif',
  },
  {
    id: 'cm3',
    nom: 'Johnson',
    prenom: 'Sarah',
    fonction: 'Country Manager',
    organisation: 'Banque Mondiale — Niger',
    type: 'Comité de Pilotage',
    presidentRole: false,
    status: 'Actif',
  },
  {
    id: 'cm4',
    nom: 'Soumana',
    prenom: 'Abdou',
    fonction: 'Secrétaire Général',
    organisation: 'Ministère des Finances',
    type: 'Comité de Pilotage',
    presidentRole: false,
    status: 'Actif',
  },
  {
    id: 'cm5',
    nom: 'Diallo',
    prenom: 'Amadou',
    fonction: 'Responsable Projet',
    organisation: 'UFG',
    type: 'Comité de Pilotage',
    presidentRole: false,
    status: 'Actif',
  },
  {
    id: 'cm6',
    nom: 'Dupont',
    prenom: 'Claire',
    fonction: 'Chargée de Programme',
    organisation: 'Union Européenne — Délégation Niger',
    type: 'Comité Technique',
    presidentRole: false,
    status: 'Actif',
  },
  {
    id: 'cm7',
    nom: 'Karimu',
    prenom: 'Hassan',
    fonction: 'Représentant National',
    organisation: 'PNUD Niger',
    type: 'Comité Technique',
    presidentRole: false,
    status: 'Actif',
  },
];

// ==========================================
// MOCK: PARTIES PRENANTES
// ==========================================

export const mockStakeholders: Stakeholder[] = [
  {
    id: 'st1',
    organisation: 'Agence Française de Développement (AFD)',
    type: 'Bailleur',
    representant: 'Tahir Adamou',
    email: 't.adamou@afd.fr',
    telephone: '+227 20 73 23 00',
    niveauEngagement: 'Élevé',
    status: 'Actif',
  },
  {
    id: 'st2',
    organisation: 'Banque Mondiale',
    type: 'Bailleur',
    representant: 'Sarah Johnson',
    email: 's.johnson@worldbank.org',
    telephone: '+227 20 72 50 00',
    niveauEngagement: 'Élevé',
    status: 'Actif',
  },
  {
    id: 'st3',
    organisation: 'Ministère des Finances',
    type: 'Gouvernement',
    representant: 'Abdou Soumana',
    email: 'a.soumana@finances.gov.ne',
    telephone: '+227 20 72 24 02',
    niveauEngagement: 'Élevé',
    status: 'Actif',
  },
  {
    id: 'st4',
    organisation: 'CARE Niger',
    type: 'ONG Partenaire',
    representant: 'Kadiatou Bah',
    email: 'k.bah@care.org',
    telephone: '+227 20 75 40 41',
    niveauEngagement: 'Moyen',
    status: 'Actif',
  },
  {
    id: 'st5',
    organisation: 'Chambre de Commerce du Niger',
    type: 'Secteur Privé',
    representant: 'Moustafa Aliou',
    email: 'm.aliou@ccin.ne',
    telephone: '+227 20 73 22 10',
    niveauEngagement: 'Moyen',
    status: 'Actif',
  },
  {
    id: 'st6',
    organisation: 'ROTAB — Réseau Transparence',
    type: 'Société Civile',
    representant: 'Ali Idrissa',
    email: 'a.idrissa@rotab.org',
    telephone: '+227 20 36 00 00',
    niveauEngagement: 'Faible',
    status: 'Actif',
  },
  {
    id: 'st7',
    organisation: 'Communes Rurales Bénéficiaires',
    type: 'Bénéficiaire',
    representant: 'Conseil des Maires',
    email: 'conseil.maires@communes.gov.ne',
    telephone: '+227 20 73 00 00',
    niveauEngagement: 'Élevé',
    status: 'Actif',
  },
];

// ==========================================
// MOCK: CONTACTS D'URGENCE / ADMINISTRATIFS
// ==========================================

export const mockContacts: Contact[] = [
  {
    id: 'ct1',
    nom: 'Diallo',
    prenom: 'Amadou',
    organisation: 'UFG',
    email: 'a.diallo@ugp.gov.ne',
    telephone: '+227 90 12 34 56',
    fonction: 'Responsable Projet — Point focal principal',
    categorie: 'Urgence',
  },
  {
    id: 'ct2',
    nom: 'Moussa',
    prenom: 'Fatoumata',
    organisation: 'UFG',
    email: 'f.moussa@ugp.gov.ne',
    telephone: '+227 91 23 45 67',
    fonction: 'Expert Financier — Demandes de décaissement',
    categorie: 'Administratif',
  },
  {
    id: 'ct3',
    nom: 'Adamou',
    prenom: 'Tahir',
    organisation: 'AFD Niger',
    email: 't.adamou@afd.fr',
    telephone: '+227 20 73 23 01',
    fonction: 'Chargé de projet AFD — Questions de financement',
    categorie: 'Bailleur',
  },
  {
    id: 'ct4',
    nom: 'Koné',
    prenom: 'Aïchata',
    organisation: 'DGI',
    email: 'a.kone@dgi.gov.ne',
    telephone: '+227 94 56 78 90',
    fonction: 'Expert Technique — Questions techniques infrastructures',
    categorie: 'Technique',
  },
  {
    id: 'ct5',
    nom: 'Johnson',
    prenom: 'Sarah',
    organisation: 'Banque Mondiale',
    email: 's.johnson@worldbank.org',
    telephone: '+227 20 72 50 01',
    fonction: 'Country Manager — Escalade Banque Mondiale',
    categorie: 'Bailleur',
  },
];
