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

export type NiveauRisque = 'FAIBLE' | 'MODERE' | 'ELEVE' | 'CRITIQUE';

export type RisqueCategorie =
  | 'Technique' | 'Financier' | 'Opérationnel' | 'Juridique'
  | 'Environnemental' | 'Social' | 'Sécurité' | 'Institutionnel' | 'Gouvernance';

export type StatutRisque = 'OUVERT' | 'EN_COURS' | 'MAÎTRISÉ' | 'CLOS';

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
  statut: StatutRisque;
  responsable: string;
  responsableId?: string | null;
  strategie?: string | null;
  plan_mitigation?: string;
  date_identification: string;
  date_revision_prevue?: string;
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

// ─── Livrables ────────────────────────────────────────────────────────────────

export type LivrableCategorie =
  | 'Rapport' | 'Document' | 'Logiciel' | 'Formation'
  | 'Infrastructure' | 'Étude' | 'Manuel' | 'Audit' | 'Réception' | 'Autre';

export type StatutLivrable = 'A_FAIRE' | 'EN_COURS' | 'SOUMIS' | 'VALIDE' | 'REFUSE' | 'TERMINE';

export type PrioriteLivrable = 'FAIBLE' | 'MOYENNE' | 'HAUTE' | 'CRITIQUE';

export interface Livrable {
  id: string;
  projet_id: string;
  code_livrable: string;
  nom: string;
  description?: string;
  categorie: LivrableCategorie;
  composante?: string;        // Composante projet (ex. "Composante A")
  responsable: string;
  responsableId?: string | null;
  validateur?: string;
  validateurId?: string | null;
  wbsId?: string | null;
  date_prevue: string;        // ISO date
  date_reelle?: string;       // ISO date dérivée (validation, sinon soumission) — lecture seule
  date_soumission?: string;   // ISO date
  date_validation?: string;   // ISO date
  avancement: number;         // 0–100
  statut: StatutLivrable;
  priorite: PrioriteLivrable;
  createdAt: string;
  updatedAt: string;
}

// ─── Documents ────────────────────────────────────────────────────────────────

export type DocumentCategorie =
  | 'Contrat' | 'Rapport' | 'TDR' | "Dossier d'AO" | 'Compte-rendu'
  | 'Étude' | 'Audit' | 'Plan' | 'Procédure' | 'Autre';

export type TypeFichier = 'PDF' | 'Word' | 'Excel' | 'Image' | 'ZIP' | 'Autre';

export type StatutDocument = 'BROUILLON' | 'EN_VALIDATION' | 'VALIDE' | 'ARCHIVE';

export type ConfidentialiteDocument = 'PUBLIQUE' | 'INTERNE' | 'CONFIDENTIELLE';

export interface DocumentProjet {
  id: string;
  projet_id: string;
  code_document: string;
  titre: string;
  description?: string;
  categorie: DocumentCategorie;
  activite_liee?: string;
  version: string;
  auteur: string;
  responsable: string;
  date_creation: string;       // ISO date YYYY-MM-DD
  date_modification: string;   // ISO date YYYY-MM-DD (auto mis à jour à chaque save)
  statut: StatutDocument;
  taille_ko: number;           // taille en Ko
  type_fichier: TypeFichier;
  mots_cles: string[];
  confidentialite: ConfidentialiteDocument;
  createdAt: string;
  updatedAt: string;
}

// ─── Rapports ─────────────────────────────────────────────────────────────────

export type TypeRapport =
  | 'MENSUEL' | 'TRIMESTRIEL' | 'ANNUEL'
  | 'FINANCIER' | 'EVM' | 'RISQUES' | 'PTBA'
  | 'BAILLEUR' | 'AVANCEMENT' | 'FINAL';

export type StatutRapport = 'GENERE' | 'EN_ATTENTE' | 'VALIDE' | 'ARCHIVE';

export type FormatRapport = 'PDF' | 'Excel' | 'Word';

export interface RapportProjet {
  id: string;
  projet_id: string;
  code_rapport: string;
  titre: string;
  description?: string;
  type: TypeRapport;
  format: FormatRapport;
  statut: StatutRapport;
  periode: string;               // "T1 2026", "Janvier 2026", "Annuel 2025"
  date_generation: string;       // ISO date YYYY-MM-DD
  date_telechargement?: string;  // ISO date — dernier téléchargement
  version: string;
  auteur: string;
  taille_ko: number;
  nb_telechargements: number;
  commentaires?: string;
  documentId?: string | null;   // documents_projet.id du fichier réellement généré/stocké
  createdAt: string;
  updatedAt: string;
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

// ─── Documents globaux (bibliothèque centrale) ────────────────────────────────

export type CategorieGlobalDoc =
  | 'Administration' | 'Procédures' | 'Politiques' | 'Guides'
  | 'Manuels' | 'Modèles' | 'Contrats modèles' | 'Références'
  | 'Documentation technique' | 'Documentation fonctionnelle' | 'Archives';

export type StatutGlobalDoc = 'PUBLIE' | 'BROUILLON' | 'EN_VALIDATION' | 'ARCHIVE' | 'EXPIRE';

export type ConfidentialiteGlobalDoc = 'PUBLIQUE' | 'INTERNE' | 'CONFIDENTIELLE' | 'RESTREINTE';

export interface VersionGlobalDoc {
  version: string;
  date: string;
  auteur: string;
  changements: string;
}

export interface DocumentGlobal {
  id: string;
  code_document: string;
  titre: string;
  description: string;
  categorie: CategorieGlobalDoc;
  type: TypeFichier;
  statut: StatutGlobalDoc;
  version: string;
  confidentialite: ConfidentialiteGlobalDoc;
  auteur: string;
  service: string;
  mots_cles: string[];
  taille_ko: number;
  nb_telechargements: number;
  date_creation: string;
  date_modification: string;
  date_expiration?: string;
  nb_commentaires: number;
  versions: VersionGlobalDoc[];
  createdAt: string;
  updatedAt: string;
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

// ─── Commentaires ─────────────────────────────────────────────────────────────

export type TypeCommentaire =
  | 'QUESTION' | 'OBSERVATION' | 'SUGGESTION' | 'ALERTE'
  | 'DECISION' | 'ACTION' | 'INFORMATION';

export type StatutCommentaire = 'OUVERT' | 'EN_COURS' | 'RESOLU' | 'FERME' | 'EN_ATTENTE';

export type PrioriteCommentaire = 'FAIBLE' | 'NORMALE' | 'HAUTE' | 'URGENTE';

export type ModuleCommentaire =
  | 'Projet' | 'PTBA' | 'Activité' | 'Budget' | 'Source de financement'
  | 'Contrat' | 'Décaissement' | 'Risque' | 'Livrable' | 'Document' | 'Rapport';

export interface CommentaireProjet {
  id: string;
  projet_id: string;
  module: ModuleCommentaire;
  element_id: string;
  element_nom: string;
  auteurId: string | null;
  auteur: string;
  role: string;
  message: string;
  date_creation: string;       // YYYY-MM-DD
  date_modification: string;   // YYYY-MM-DD
  statut: StatutCommentaire;
  priorite: PrioriteCommentaire;
  parent_id?: string | null;
  pieceJointeDocumentId?: string | null;  // documents_projet.id du fichier réellement stocké
  mentionUserId?: string | null;          // users.id de l'utilisateur réellement mentionné
  mentionUserName?: string | null;        // résolu côté serveur pour affichage
  lu: boolean;
  createdAt: string;
  updatedAt: string;
}