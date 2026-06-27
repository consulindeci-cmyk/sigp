export type StatutPPM = 'BROUILLON' | 'SOUMIS' | 'VALIDATION_N1' | 'VALIDATION_BAILLEUR' | 'APPROUVE' | 'CLOTURE';

export interface PPMVersion {
  id: string;
  projet_id: string;
  numero_version: string;
  statut: StatutPPM;
  
  date_creation: string;
  date_approbation?: string;
  
  cree_par: string;
  approuve_par?: string;
  
  budget_version_reference: string; 
  lignes: PPMLigne[];
}

export type MethodePassation = 'AOI' | 'AON' | 'CF' | 'ED' | 'QCBS' | 'LCS';
export type CategorieAchat = 'TRAVAUX' | 'BIENS' | 'SERVICES_NON_CONSULTANTS' | 'SERVICES_CONSULTANTS';
export type TypeRevue = 'PRIOR' | 'POST'; 
export type StatutLignePPM = 'PLANIFIE' | 'DAO_EN_PREPARATION' | 'DAO_LANCE' | 'OFFRES_RECUES' | 'EVALUATION' | 'ANO_EN_ATTENTE' | 'ANO_OBTENU' | 'ATTRIBUE' | 'CONTRAT_SIGNE' | 'EXECUTION' | 'CLOTURE' | 'ANNULE';

export interface PPMLigne {
  id: string;
  ppm_version_id: string;
  
  // Relations d'intégrité
  wbs_id: string;
  budget_ligne_id: string;
  bailleur_id: string;
  
  // Description de l'achat
  reference_marche: string;
  description: string;
  categorie: CategorieAchat;
  methode: MethodePassation;
  type_revue: TypeRevue;
  
  // Gestion Financière & Multi-devises
  montant_estime_devise: number;
  devise_code: string;
  taux_change_estime: number;
  montant_estime_base: number;
  
  // Gestion des Lots et Contrats (Relation 1..N)
  est_lot_unique: boolean;
  lots_enfants_ids?: string[]; 
  contrats_generes_ids?: string[]; // 1 Ligne PPM -> N Contrats
  
  // Timeline détaillée
  dates_cles: {
    preparation_dao_prevue: string;
    preparation_dao_reelle?: string;
    lancement_dao_prevue: string;
    lancement_dao_reelle?: string;
    remise_offres_prevue: string;
    remise_offres_reelle?: string;
    ouverture_evaluation_prevue: string;
    ouverture_evaluation_reelle?: string;
    avis_non_objection_prevue?: string; 
    avis_non_objection_reelle?: string;
    attribution_prevue: string;
    attribution_reelle?: string;
    signature_contrat_prevue: string;
    signature_contrat_reelle?: string;
    demarrage_prevue: string;
    demarrage_reelle?: string;
  };
  
  statut: StatutLignePPM;
  version_hash: string;
}

export interface PPMRevisionLog {
  id: string;
  ppm_ligne_id: string;
  ancien_montant: number;
  nouveau_montant: number;
  ancien_statut: StatutLignePPM;
  nouveau_statut: StatutLignePPM;
  utilisateur: string;
  commentaire: string;
  date: string;
}
