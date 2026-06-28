// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN_PROJET'
  | 'COORDONNATEUR_PROJET'
  | 'RESPONSABLE_FINANCIER'
  | 'RESPONSABLE_TECHNIQUE'
  | 'RESPONSABLE_PASSATION_MARCHES'
  | 'RESPONSABLE_SUIVI_EVALUATION'
  | 'BAILLEUR'
  | 'AUDITEUR'
  | 'OBSERVATEUR';

export type UserStatus = 'Actif' | 'Inactif' | 'En attente' | 'Suspendu';

export interface UserPermissions {
  projets:       boolean;
  budget:        boolean;
  marches:       boolean;
  rapports:      boolean;
  utilisateurs:  boolean;
  parametres:    boolean;
  export:        boolean;
  audit:         boolean;
}

export interface MockUser {
  id:              string;
  prenom:          string;
  nom:             string;
  initiales:       string;
  email:           string;
  telephone:       string;
  role:            UserRole;
  roleLabel:       string;
  fonction:        string;
  statut:          UserStatus;
  actif:           boolean;
  createdAt:       string;
  lastConnexion:   string;
  projetsAffecter: string[];
  permissions:     UserPermissions;
}

export interface UsersKPIs {
  total:         number;
  actifs:        number;
  inactifs:      number;
  enAttente:     number;
  administrateurs: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN:                    'Super Admin',
  ADMIN_PROJET:                   'Admin Projet',
  COORDONNATEUR_PROJET:           'Coordonnateur',
  RESPONSABLE_FINANCIER:          'Resp. Financier',
  RESPONSABLE_TECHNIQUE:          'Resp. Technique',
  RESPONSABLE_PASSATION_MARCHES:  'Resp. Marchés',
  RESPONSABLE_SUIVI_EVALUATION:   'Resp. S&E',
  BAILLEUR:                       'Bailleur',
  AUDITEUR:                       'Auditeur',
  OBSERVATEUR:                    'Observateur',
};

// Permission par défaut selon le rôle
function defaultPermissions(role: UserRole): UserPermissions {
  const all:    UserPermissions = { projets: true, budget: true, marches: true, rapports: true, utilisateurs: true, parametres: true, export: true, audit: true };
  const admin:  UserPermissions = { projets: true, budget: true, marches: true, rapports: true, utilisateurs: true, parametres: false, export: true, audit: false };
  const cp:     UserPermissions = { projets: true, budget: true, marches: false, rapports: true, utilisateurs: false, parametres: false, export: true, audit: false };
  const fin:    UserPermissions = { projets: true, budget: true, marches: false, rapports: true, utilisateurs: false, parametres: false, export: true, audit: false };
  const tech:   UserPermissions = { projets: true, budget: false, marches: false, rapports: true, utilisateurs: false, parametres: false, export: true, audit: false };
  const march:  UserPermissions = { projets: true, budget: false, marches: true, rapports: true, utilisateurs: false, parametres: false, export: true, audit: false };
  const se:     UserPermissions = { projets: true, budget: false, marches: false, rapports: true, utilisateurs: false, parametres: false, export: true, audit: true };
  const bail:   UserPermissions = { projets: false, budget: false, marches: false, rapports: true, utilisateurs: false, parametres: false, export: true, audit: false };
  const audit:  UserPermissions = { projets: false, budget: false, marches: false, rapports: true, utilisateurs: false, parametres: false, export: false, audit: true };
  const obs:    UserPermissions = { projets: false, budget: false, marches: false, rapports: true, utilisateurs: false, parametres: false, export: false, audit: false };
  switch (role) {
    case 'SUPER_ADMIN':                    return all;
    case 'ADMIN_PROJET':                   return admin;
    case 'COORDONNATEUR_PROJET':           return cp;
    case 'RESPONSABLE_FINANCIER':          return fin;
    case 'RESPONSABLE_TECHNIQUE':          return tech;
    case 'RESPONSABLE_PASSATION_MARCHES':  return march;
    case 'RESPONSABLE_SUIVI_EVALUATION':   return se;
    case 'BAILLEUR':                       return bail;
    case 'AUDITEUR':                       return audit;
    case 'OBSERVATEUR':                    return obs;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock data — 20 utilisateurs
// ─────────────────────────────────────────────────────────────────────────────

export const mockUsers: MockUser[] = [
  {
    id: 'u1', prenom: 'Amadou', nom: 'Diallo', initiales: 'AD',
    email: 'amadou.diallo@sigp.ne', telephone: '+227 90 11 22 33',
    role: 'SUPER_ADMIN', roleLabel: ROLE_LABELS['SUPER_ADMIN'],
    fonction: 'Administrateur Système',
    statut: 'Actif', actif: true,
    createdAt: '2023-01-10', lastConnexion: '2026-06-28 08:15',
    projetsAffecter: ['Électrification Solaire Zones Rurales', 'Gouvernance Locale et Décentralisation'],
    permissions: defaultPermissions('SUPER_ADMIN'),
  },
  {
    id: 'u2', prenom: 'Fatoumata', nom: 'Koné', initiales: 'FK',
    email: 'f.kone@sigp.ne', telephone: '+223 76 44 55 66',
    role: 'ADMIN_PROJET', roleLabel: ROLE_LABELS['ADMIN_PROJET'],
    fonction: 'Administratrice de Projets',
    statut: 'Actif', actif: true,
    createdAt: '2023-02-14', lastConnexion: '2026-06-27 16:42',
    projetsAffecter: ['Accès Eau Potable et Assainissement Rural', 'Formation Professionnelle et Emploi Jeunes', 'Résilience Climatique Sahel'],
    permissions: defaultPermissions('ADMIN_PROJET'),
  },
  {
    id: 'u3', prenom: 'Ibrahim', nom: 'Maïga', initiales: 'IM',
    email: 'i.maiga@sigp.ne', telephone: '+227 96 22 33 44',
    role: 'COORDONNATEUR_PROJET', roleLabel: ROLE_LABELS['COORDONNATEUR_PROJET'],
    fonction: 'Chef de Projet Senior',
    statut: 'Actif', actif: true,
    createdAt: '2023-03-01', lastConnexion: '2026-06-28 09:30',
    projetsAffecter: ['Électrification Solaire Zones Rurales', 'Gouvernance Locale et Décentralisation', 'Santé Communautaire Élargie'],
    permissions: defaultPermissions('COORDONNATEUR_PROJET'),
  },
  {
    id: 'u4', prenom: 'Aissatou', nom: 'Diop', initiales: 'AD',
    email: 'a.diop@sigp.sn', telephone: '+221 77 88 99 10',
    role: 'COORDONNATEUR_PROJET', roleLabel: ROLE_LABELS['COORDONNATEUR_PROJET'],
    fonction: 'Chef de Projet',
    statut: 'Actif', actif: true,
    createdAt: '2023-04-15', lastConnexion: '2026-06-26 14:05',
    projetsAffecter: ['Santé Maternelle et Infantile', 'Inclusion Financière Numérique'],
    permissions: defaultPermissions('COORDONNATEUR_PROJET'),
  },
  {
    id: 'u5', prenom: 'Moussa', nom: 'Traoré', initiales: 'MT',
    email: 'm.traore@sigp.ml', telephone: '+223 65 77 88 99',
    role: 'RESPONSABLE_FINANCIER', roleLabel: ROLE_LABELS['RESPONSABLE_FINANCIER'],
    fonction: 'Responsable Financier Senior',
    statut: 'Actif', actif: true,
    createdAt: '2023-01-20', lastConnexion: '2026-06-28 11:00',
    projetsAffecter: ['Accès Eau Potable et Assainissement Rural', 'Hydraulique Pastorale et Agropastorale', 'Formation Professionnelle et Emploi Jeunes'],
    permissions: defaultPermissions('RESPONSABLE_FINANCIER'),
  },
  {
    id: 'u6', prenom: 'Kadiatou', nom: 'Barry', initiales: 'KB',
    email: 'k.barry@sigp.gn', telephone: '+224 62 55 66 77',
    role: 'RESPONSABLE_FINANCIER', roleLabel: ROLE_LABELS['RESPONSABLE_FINANCIER'],
    fonction: 'Comptable de Projet',
    statut: 'Actif', actif: true,
    createdAt: '2023-05-10', lastConnexion: '2026-06-25 10:20',
    projetsAffecter: ['Appui à la Filière Agricole Nord', 'Résilience Climatique Sahel'],
    permissions: defaultPermissions('RESPONSABLE_FINANCIER'),
  },
  {
    id: 'u7', prenom: 'Hassan', nom: 'Soumaré', initiales: 'HS',
    email: 'h.soumare@sigp.ne', telephone: '+227 91 33 44 55',
    role: 'RESPONSABLE_TECHNIQUE', roleLabel: ROLE_LABELS['RESPONSABLE_TECHNIQUE'],
    fonction: 'Ingénieur Génie Civil',
    statut: 'Actif', actif: true,
    createdAt: '2023-06-01', lastConnexion: '2026-06-27 08:45',
    projetsAffecter: ['Réhabilitation Routes Rurales', 'Électrification Solaire Zones Rurales'],
    permissions: defaultPermissions('RESPONSABLE_TECHNIQUE'),
  },
  {
    id: 'u8', prenom: 'Mariama', nom: 'Coulibaly', initiales: 'MC',
    email: 'm.coulibaly@sigp.ml', telephone: '+223 73 66 77 88',
    role: 'RESPONSABLE_TECHNIQUE', roleLabel: ROLE_LABELS['RESPONSABLE_TECHNIQUE'],
    fonction: 'Architecte',
    statut: 'Inactif', actif: false,
    createdAt: '2023-07-12', lastConnexion: '2025-11-15 14:30',
    projetsAffecter: ['Éducation Pour Tous — Phase III'],
    permissions: defaultPermissions('RESPONSABLE_TECHNIQUE'),
  },
  {
    id: 'u9', prenom: 'Oumar', nom: 'Sanogo', initiales: 'OS',
    email: 'o.sanogo@sigp.ml', telephone: '+223 69 88 99 00',
    role: 'RESPONSABLE_PASSATION_MARCHES', roleLabel: ROLE_LABELS['RESPONSABLE_PASSATION_MARCHES'],
    fonction: 'Spécialiste Passation Marchés',
    statut: 'Actif', actif: true,
    createdAt: '2023-03-20', lastConnexion: '2026-06-28 10:15',
    projetsAffecter: ['Accès Eau Potable et Assainissement Rural', 'Réhabilitation Routes Rurales', 'Hydraulique Pastorale et Agropastorale'],
    permissions: defaultPermissions('RESPONSABLE_PASSATION_MARCHES'),
  },
  {
    id: 'u10', prenom: 'Aminata', nom: 'Cissé', initiales: 'AC',
    email: 'a.cisse@sigp.bf', telephone: '+226 70 11 22 33',
    role: 'RESPONSABLE_SUIVI_EVALUATION', roleLabel: ROLE_LABELS['RESPONSABLE_SUIVI_EVALUATION'],
    fonction: 'Spécialiste Suivi-Évaluation',
    statut: 'Actif', actif: true,
    createdAt: '2023-04-05', lastConnexion: '2026-06-27 15:30',
    projetsAffecter: ['Appui à la Filière Agricole Nord', 'Résilience Climatique Sahel', 'Gouvernance Locale et Décentralisation'],
    permissions: defaultPermissions('RESPONSABLE_SUIVI_EVALUATION'),
  },
  {
    id: 'u11', prenom: 'Jean-Claude', nom: 'Gnamba', initiales: 'JG',
    email: 'jc.gnamba@sigp.ci', telephone: '+225 07 44 55 66',
    role: 'RESPONSABLE_SUIVI_EVALUATION', roleLabel: ROLE_LABELS['RESPONSABLE_SUIVI_EVALUATION'],
    fonction: 'Assistant Suivi-Évaluation',
    statut: 'Inactif', actif: false,
    createdAt: '2023-08-01', lastConnexion: '2025-12-20 09:00',
    projetsAffecter: ['Éducation Pour Tous — Phase III', 'Réhabilitation Routes Rurales'],
    permissions: defaultPermissions('RESPONSABLE_SUIVI_EVALUATION'),
  },
  {
    id: 'u12', prenom: 'Souleymane', nom: 'Bah', initiales: 'SB',
    email: 's.bah@afd.fr', telephone: '+33 1 53 44 31 31',
    role: 'BAILLEUR', roleLabel: ROLE_LABELS['BAILLEUR'],
    fonction: 'Représentant AFD',
    statut: 'Actif', actif: true,
    createdAt: '2023-02-28', lastConnexion: '2026-06-20 11:45',
    projetsAffecter: ['Électrification Solaire Zones Rurales', 'Formation Professionnelle et Emploi Jeunes'],
    permissions: defaultPermissions('BAILLEUR'),
  },
  {
    id: 'u13', prenom: 'Clémentine', nom: 'Yao', initiales: 'CY',
    email: 'c.yao@ec.europa.eu', telephone: '+32 2 299 11 11',
    role: 'BAILLEUR', roleLabel: ROLE_LABELS['BAILLEUR'],
    fonction: 'Chargée de Programme UE',
    statut: 'Actif', actif: true,
    createdAt: '2023-05-15', lastConnexion: '2026-06-22 14:00',
    projetsAffecter: ['Santé Maternelle et Infantile', 'Résilience Climatique Sahel'],
    permissions: defaultPermissions('BAILLEUR'),
  },
  {
    id: 'u14', prenom: 'Boubacar', nom: 'Keïta', initiales: 'BK',
    email: 'b.keita@audit.ne', telephone: '+227 94 55 66 77',
    role: 'AUDITEUR', roleLabel: ROLE_LABELS['AUDITEUR'],
    fonction: 'Auditeur Interne',
    statut: 'Actif', actif: true,
    createdAt: '2023-06-10', lastConnexion: '2026-06-28 07:30',
    projetsAffecter: ['Accès Eau Potable et Assainissement Rural', 'Gouvernance Locale et Décentralisation', 'Santé Communautaire Élargie'],
    permissions: defaultPermissions('AUDITEUR'),
  },
  {
    id: 'u15', prenom: 'Zeinabou', nom: 'Moussa', initiales: 'ZM',
    email: 'z.moussa@cabinet-audit.ne', telephone: '+227 98 77 88 99',
    role: 'AUDITEUR', roleLabel: ROLE_LABELS['AUDITEUR'],
    fonction: 'Auditeur Externe',
    statut: 'En attente', actif: false,
    createdAt: '2026-05-20', lastConnexion: '—',
    projetsAffecter: [],
    permissions: defaultPermissions('AUDITEUR'),
  },
  {
    id: 'u16', prenom: 'Pierre', nom: 'Konan', initiales: 'PK',
    email: 'p.konan@worldbank.org', telephone: '+1 202 473 1000',
    role: 'OBSERVATEUR', roleLabel: ROLE_LABELS['OBSERVATEUR'],
    fonction: 'Consultant Banque Mondiale',
    statut: 'Actif', actif: true,
    createdAt: '2024-01-08', lastConnexion: '2026-06-15 10:00',
    projetsAffecter: ['Accès Eau Potable et Assainissement Rural', 'Inclusion Financière Numérique'],
    permissions: defaultPermissions('OBSERVATEUR'),
  },
  {
    id: 'u17', prenom: 'Sarah', nom: 'Dembélé', initiales: 'SD',
    email: 's.dembele@undp.org', telephone: '+1 212 906 5000',
    role: 'OBSERVATEUR', roleLabel: ROLE_LABELS['OBSERVATEUR'],
    fonction: 'Coordinatrice PNUD',
    statut: 'En attente', actif: false,
    createdAt: '2026-04-10', lastConnexion: '—',
    projetsAffecter: [],
    permissions: defaultPermissions('OBSERVATEUR'),
  },
  {
    id: 'u18', prenom: 'Nathalie', nom: 'Coulibaly', initiales: 'NC',
    email: 'n.coulibaly@usaid.gov', telephone: '+1 202 712 0000',
    role: 'OBSERVATEUR', roleLabel: ROLE_LABELS['OBSERVATEUR'],
    fonction: 'Observatrice USAID',
    statut: 'Suspendu', actif: false,
    createdAt: '2023-11-01', lastConnexion: '2026-01-05 09:00',
    projetsAffecter: ['Appui à la Filière Agricole Nord'],
    permissions: defaultPermissions('OBSERVATEUR'),
  },
  {
    id: 'u19', prenom: 'Ali', nom: 'Ouattara', initiales: 'AO',
    email: 'a.ouattara@sigp.bf', telephone: '+226 71 22 33 44',
    role: 'COORDONNATEUR_PROJET', roleLabel: ROLE_LABELS['COORDONNATEUR_PROJET'],
    fonction: 'Chef de Projet Junior',
    statut: 'En attente', actif: false,
    createdAt: '2026-06-01', lastConnexion: '—',
    projetsAffecter: [],
    permissions: defaultPermissions('COORDONNATEUR_PROJET'),
  },
  {
    id: 'u20', prenom: 'Hawa', nom: 'Kouyaté', initiales: 'HK',
    email: 'h.kouyate@sigp.ne', telephone: '+227 93 44 55 66',
    role: 'RESPONSABLE_FINANCIER', roleLabel: ROLE_LABELS['RESPONSABLE_FINANCIER'],
    fonction: 'Comptable Junior',
    statut: 'En attente', actif: false,
    createdAt: '2026-06-15', lastConnexion: '—',
    projetsAffecter: [],
    permissions: defaultPermissions('RESPONSABLE_FINANCIER'),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// KPIs
// ─────────────────────────────────────────────────────────────────────────────

export const mockUsersKPIs: UsersKPIs = {
  total:           20,
  actifs:          13,
  inactifs:         3, // Inactif + Suspendu
  enAttente:        4,
  administrateurs:  2, // SUPER_ADMIN + ADMIN_PROJET
};

// ─────────────────────────────────────────────────────────────────────────────
// Filter helpers
// ─────────────────────────────────────────────────────────────────────────────

export const PERMISSION_LABELS: Record<keyof UserPermissions, string> = {
  projets:      'Projets',
  budget:       'Budget',
  marches:      'Marchés',
  rapports:     'Rapports',
  utilisateurs: 'Utilisateurs',
  parametres:   'Paramètres',
  export:       'Export',
  audit:        'Audit',
};
