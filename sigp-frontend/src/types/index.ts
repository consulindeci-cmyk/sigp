// Types alignés avec le schéma Prisma SIGP Backend

export type Role =
  | 'SUPER_ADMIN' | 'ADMIN_PROJET' | 'COORDONNATEUR_PROJET'
  | 'RESPONSABLE_FINANCIER' | 'RESPONSABLE_TECHNIQUE'
  | 'RESPONSABLE_PASSATION_MARCHES' | 'RESPONSABLE_SUIVI_EVALUATION'
  | 'BAILLEUR' | 'AUDITEUR' | 'OBSERVATEUR';

export type StatutProjet = 'PREPARATION' | 'ACTIF' | 'SUSPENDU' | 'CLOTURE' | 'ANNULE';

export type StatutTache = 'A_FAIRE' | 'EN_COURS' | 'TERMINE' | 'ANNULE' | 'EN_ATTENTE';

export type NiveauRisque = 'FAIBLE' | 'MODERE' | 'ELEVE' | 'CRITIQUE';

export interface User {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  telephone?: string;
  role: Role;
  actif: boolean;
  createdAt: string;
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
  responsable?: string | null;
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
  categorie: string;
  probabilite: number;
  impact: number;
  criticite: number;
  niveau_criticite: NiveauRisque;
  statut: string;
  plan_mitigation?: string;
  createdAt: string;
}

export interface WBS {
  id: string;
  projet_id: string;
  code_wbs: string;
  nom_phase: string;
  niveau: number;
  parent_id?: string | null;
  ordre: number;
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
  niveau_intervention: 'IMPACT' | 'EFFET' | 'RESULTAT' | 'ACTIVITE';
  indicateur: string;
  valeur_reference?: string;
  cible?: string;
  source_verification?: string;
}

export interface PTBA {
  id: string;
  projet_id: string;
  code_activite: string;
  composante: string;
  activite: string;
  budget_prevu: string | number;
  q1: string | number;
  q2: string | number;
  q3: string | number;
  q4: string | number;
  statut: 'PLANIFIE' | 'EN_COURS' | 'TERMINE' | 'SUSPENDU';
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

