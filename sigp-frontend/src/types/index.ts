// Types alignés avec le schéma Prisma SIGP Backend
export * from './ptba';
// Valeurs réelles de l'enum UserRole (Prisma/Postgres) — celles utilisées par
// authStore, les RLS et les Edge Functions Supabase.
export type BackendRole = 'ADMIN' | 'COORDINATEUR' | 'CHARGE_PROGRAMME' | 'FINANCIER' | 'AUDITEUR' | 'VIEWER';

// Les 7 rôles réellement vivants du système (RLS + Edge Functions + IHM) —
// cf. audit Rôles : les anciennes valeurs (ADMIN_PROJET, COORDONNATEUR_PROJET,
// RESPONSABLE_*, BAILLEUR, OBSERVATEUR) n'existaient dans aucune policy RLS
// ni aucun requireRole, retirées pour aligner ce type sur la réalité du
// système (même liste que UserRole dans lib/userAdapter.ts).
export type Role = BackendRole | 'SUPER_ADMIN';

export type StatutProjet = 'PREPARATION' | 'ACTIF' | 'SUSPENDU' | 'CLOTURE' | 'ANNULE';

export type StatutTache = 'A_FAIRE' | 'EN_COURS' | 'TERMINE' | 'ANNULE' | 'EN_ATTENTE';

// Matrice 3×3 stricte (Probabilité 1-3 × Impact 1-3, score 1-9) — remplace
// l'ancien modèle à 4 paliers (FAIBLE/MODERE/ELEVE/CRITIQUE).
export type NiveauRisque = 'FAIBLE' | 'MOYEN' | 'ELEVE';

export type RisqueCategorie =
  | 'Technique' | 'Financier' | 'Opérationnel' | 'Juridique'
  | 'Environnemental' | 'Social' | 'Sécurité' | 'Institutionnel' | 'Gouvernance'
  | 'Politique' | 'Ressources Humaines';

export interface User {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  telephone?: string;
  poste?: string;
  bio?: string;
  role: Role;
  actif: boolean;
  createdAt: string;
  // Absent pour SUPER_ADMIN (rôle plateforme, aucune organisation propre).
  organisationId?: string | null;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface Projet {
  id: string;
  code_projet: string;
  nom_projet: string;
  description?: string;
  bailleur_principal: string;
  date_debut: string;
  date_fin: string;
  budget_total: string;
  devise: string;
  statut: StatutProjet;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { taches: number; marches: number; risques: number; documents: number };
}

export interface Tache {
  id: string;
  projet_id: string;
  wbs_id?: string | null;
  code_tache: string;
  description: string;
  // responsable : nom affiché, résolu côté serveur depuis users (lecture
  // seule) ; responsableId : le véritable UUID (ptba_activites.responsable_id),
  // à renvoyer pour créer/modifier — cf. useTasks.ts.
  responsable?: string | null;
  responsableId?: string | null;
  date_debut?: string | null;
  date_fin?: string | null;
  cout_prevu: string;
  cout_reel: string;
  avancement: number;
  statut: StatutTache;
  createdAt: string;
  updatedAt: string;
}

export interface EvmIndicateurs {
  bac: number;
  pv: number;
  ev: number;
  ac: number;
  cv: number;
  sv: number;
  cpi: number;
  spi: number;
  eac: number;
  vac: number;
  statut_cpi: 'VERT' | 'ORANGE' | 'ROUGE';
  statut_spi: 'VERT' | 'ORANGE' | 'ROUGE';
  projet_id: string;
  date_controle: string;
}

export interface EvmTache {
  tache_id: string;
  code_tache: string;
  description: string;
  wbs?: string;
  statut: StatutTache;
  avancement: number;
  bac: number;
  pv: number;
  ev: number;
  ac: number;
  cv: number;
  sv: number;
  cpi: number;
  spi: number;
  eac: number;
  statut_cpi: 'VERT' | 'ORANGE' | 'ROUGE';
  statut_spi: 'VERT' | 'ORANGE' | 'ROUGE';
}

export interface ProjetSummary {
  projet_id: string;
  code_projet: string;
  nom_projet: string;
  budget_total: number;
  montant_engage: number;
  montant_decaisse: number;
  solde_disponible: number;
  taux_consommation_pct: number;
}

export interface DashboardGlobal {
  projets: { total: number; actifs: number; en_retard: number };
  budget: { total: number; engage: number; decaisse: number };
  evm_global: { cpi: number; spi: number; eac: number };
  alertes: Array<{ type: string; message: string; projet_id?: string }>;
}

export interface Risque {
  id: string;
  projet_id: string;
  code_risque: string;
  description: string;
  categorie: RisqueCategorie;
  probabilite: 1 | 2 | 3;
  impact: 1 | 2 | 3;
  criticite: number;         // calculée = probabilite × impact (1–9)
  niveau_criticite: NiveauRisque;
  // Stratégie d'atténuation — champ texte libre simple (remplace l'ancienne
  // liste fermée Éviter/Réduire/Transférer/Accepter, et fusionne l'ancien
  // plan_mitigation, supprimé).
  strategie?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WBS {
  id: string;
  projet_id: string;
  parent_id?: string | null;
  code_wbs: string;
  titre: string;
  description?: string;
  niveau: number;
  responsable?: string;
  // Tiers externe sans compte système (ex: "Entreprise de construction XYZ")
  // — affiché à la place de responsable (l'id) quand renseigné.
  responsable_externe?: string | null;
  date_debut_prevue?: string;
  date_fin_prevue?: string;
  budget_alloue?: number;
  progression_physique?: number;
  // Plafond bailleur pour l'ensemble de la composante (composantes racine
  // uniquement) — saisie manuelle réelle, distincte de budget_alloue (rollup
  // automatique en lecture seule des activités PTBA rattachées).
  enveloppe_cible?: number | null;
  ordre: number;
  logframe_ref_id?: string | null;
  children?: WBS[];
}

export interface LigneBudgetaire {
  id: string;
  projet_id: string;
  code_ligne: string;
  designation: string;
  montant_prevu: string;
  montant_engage: string;
  montant_decaisse: string;
  categorie: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CadreLogique {
  id: string;
  projet_id: string;
  parent_id?: string | null;
  niveau_intervention: 'IMPACT' | 'OBJECTIF' | 'RESULTAT' | 'PRODUIT' | 'ACTIVITE';
  // Logique d'intervention / intitulé de l'élément (logframe_objectives.libelle).
  description: string;
  // Texte propre à l'Indicateur Objectivement Vérifiable (IOV) — persisté sur
  // la ligne dédiée de logframe_indicators (identifiée par indicator_id),
  // distinct de `description`. Absent pour ACTIVITE (pas d'indicateur).
  indicateur?: string;
  indicator_id?: string | null;
  valeur_reference?: number | null;
  cible?: number | null;
  unite?: string | null;
  source_verification?: string;
  hypotheses?: string;
  risques?: string;
  commentaires?: string;
  children?: CadreLogique[];
}


export interface LigneBudgetaireDetail {
  id: string;
  projet_id: string;
  code_budget: string;
  rubrique: string;
  unite?: string;
  quantite: number;
  cout_unitaire: string | number;
  cout_total: string | number;
}

export interface Marche {
  id: string;
  projet_id: string;
  description_marche: string;
  type_marche: 'TRAVAUX' | 'FOURNITURES' | 'SERVICES' | 'CONSULTANTS';
  methode: 'AOI' | 'AON' | 'DEMANDE_COTATION' | 'SFQC' | 'SMC' | 'GRE_A_GRE';
  date_prevue?: string;
  montant_estime: string | number;
  statut: 'PLANIFIE' | 'EN_COURS' | 'ADJUGE' | 'SIGNE' | 'RESILIE' | 'ANNULE';
}

export * from './budget';
export * from './ppm';

// ─── EVM — données par période (moteur de calcul local) ──────────────────────

export interface EvmPeriode {
  id: string;
  label: string;
  dateControle: string; // YYYY-MM
  bac: number;
  pv: number;
  ev: number;
  ac: number;
  cv: number;
  sv: number;
  cvPct: number;
  svPct: number;
  cpi: number;
  spi: number;
  eac: number;        // primary = eac_cpi
  eac_cpi: number;   // BAC/CPI
  eac_budget: number;    // AC + (BAC−EV) au taux budget
  eac_composite: number; // AC + (BAC−EV)/(CPI×SPI)
  etc: number;
  vac: number;
  tcpi: number;
  pctComplete: number;
  commentaire: string;
}

// ─── Historique (Audit Trail) ─────────────────────────────────────────────────

export type TypeActionHistorique =
  | 'CREATION' | 'MODIFICATION' | 'SUPPRESSION' | 'VALIDATION' | 'REJET'
  | 'CONNEXION' | 'DECONNEXION' | 'TELECHARGEMENT' | 'IMPORT' | 'EXPORT'
  | 'ARCHIVAGE' | 'RESTAURATION';

export type NiveauHistorique = 'INFO' | 'AVERTISSEMENT' | 'CRITIQUE';

export type ModuleHistorique =
  | 'Projet' | 'PTBA' | 'Activités' | 'Budget' | 'Sources'
  | 'PPM' | 'Contrats' | 'Décaissements' | 'EVM' | 'Risques'
  | 'Livrables' | 'Documents' | 'Rapports' | 'Paramètres';

export interface HistoriqueProjet {
  id: string;
  projet_id: string;
  date: string;           // YYYY-MM-DD
  heure: string;          // HH:MM:SS
  utilisateur: string;
  role: string;
  module: ModuleHistorique;
  element: string;        // "Risque R-007", "Contrat CTR-002", …
  action: TypeActionHistorique;
  description: string;
  niveau: NiveauHistorique;
  // Aucune Edge Function ne renseigne jamais ip_address/user_agent en base —
  // toujours vides en pratique, jamais "simulées" malgré l'ancien commentaire.
  ip: string;
  navigateur: string;
  // Snapshots bruts capturés par les Edge Functions (historique.avant/apres) —
  // utilisés par HistorySlideOver pour afficher ce qui a réellement changé.
  avant: Record<string, unknown> | null;
  apres: Record<string, unknown> | null;
  createdAt: string;      // ISO datetime
  // id de la ligne concernée (historique.enregistrement_id) — permet de
  // filtrer l'historique d'un élément précis (ex: une ligne budgétaire),
  // pas seulement le journal global d'un projet.
  enregistrement_id: string | null;
}

// ─── Paramètres ───────────────────────────────────────────────────────────────

export type CategorieParametre =
  | 'Général' | 'Organisation' | 'Notifications' | 'Validation'
  | 'Sécurité' | 'Affichage' | 'Archivage';

export type StatutParametre = 'ACTIF' | 'INACTIF' | 'EN_ATTENTE' | 'OBSOLETE';

export interface ConfigurationProjet {
  id: string;
  projet_id: string;
  code_param: string;
  categorie: CategorieParametre;
  nom: string;
  description: string;
  valeur: string;
  valeur_defaut: string;
  type_valeur: 'TEXTE' | 'NOMBRE' | 'BOOLEEN' | 'DATE' | 'LISTE' | 'JSON';
  requis: boolean;
  modifiable: boolean;
  statut: StatutParametre;
  date_modification: string;
  modifie_par: string;
  createdAt: string;
  updatedAt: string;
}

