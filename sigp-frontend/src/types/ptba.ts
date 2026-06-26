// ============================================================================
// TYPES PTBA (Plan de Travail et Budget Annuel)
// Master Architecture - Phase 4
// ============================================================================

export type StatutPTBA = 
  | 'BROUILLON' 
  | 'EN_PREPARATION' 
  | 'SOUMIS' 
  | 'EN_REVISION' 
  | 'APPROUVE' 
  | 'REJETE' 
  | 'ARCHIVE'
  | 'SUSPENDU'
  | 'CLOTURE';

export interface PTBA {
  id: string;
  projet_id: string;
  annee: number;
  statut: StatutPTBA;
  
  // Versionnement
  version_majeure: number;
  version_mineure: number;
  nom_version: string;
  version_precedente_id?: string | null;
  
  // Audit Trail global
  cree_par: string;
  date_creation: string;
  modifie_par?: string;
  date_modification?: string;
  approuve_par?: string;
  date_approbation?: string;
  commentaire_approbation?: string;
  
  // Totaux
  budget_total: number;
  
  // Relations
  lignes?: PTBALigne[];
  historique_workflow?: PTBAWorkflowLog[];
}

export interface PTBALigne {
  id: string;
  ptba_id: string;
  
  // ==========================================
  // DIMENSIONS ANALYTIQUES
  // ==========================================
  
  // 1. Projet & WBS
  wbs_id: string; 
  logframe_ref_id?: string | null;
  composante_id?: string | null;
  activite_nom: string;
  
  // 2. Organisation
  responsable_id?: string | null;
  partenaire_execution_id?: string | null;
  centre_cout_id?: string | null;
  
  // 3. Géographie
  zone_geographique_id?: string | null;
  
  // 4. Finances
  bailleur_id?: string | null;
  source_financement_id?: string | null;
  categorie_budgetaire_id?: string | null;
  devise: string; // Ex: 'XOF'
  taux_change_ref: number; // Ex: 1 pour XOF, 655.957 pour EUR
  
  // ==========================================
  // PASSATION DES MARCHES
  // ==========================================
  is_procurement: boolean;
  type_marche?: 'TRAVAUX' | 'FOURNITURES' | 'SERVICES' | 'CONSULTANTS' | null;
  methode_passation_id?: string | null;
  
  // ==========================================
  // CALCUL ET VENTILATION BUDGETAIRE
  // ==========================================
  quantite: number;
  unite_mesure: string;
  cout_unitaire: number;
  montant_total: number; // = quantite * cout_unitaire
  
  // Ventilation Mensuelle (M1 = Janvier)
  m1_montant: number; m2_montant: number; m3_montant: number;
  m4_montant: number; m5_montant: number; m6_montant: number;
  m7_montant: number; m8_montant: number; m9_montant: number;
  m10_montant: number; m11_montant: number; m12_montant: number;
  
  // Trimestriels (Calculés: Q1 = M1+M2+M3)
  q1_montant: number; q2_montant: number; q3_montant: number; q4_montant: number;
  
  // ==========================================
  // PLANIFICATION PHYSIQUE
  // ==========================================
  cibles_physiques: string; 
  m1_cible: boolean; m2_cible: boolean; m3_cible: boolean;
  m4_cible: boolean; m5_cible: boolean; m6_cible: boolean;
  m7_cible: boolean; m8_cible: boolean; m9_cible: boolean;
  m10_cible: boolean; m11_cible: boolean; m12_cible: boolean;
  
  // ==========================================
  // SUIVI D'EXECUTION (Alimenté par l'ERP)
  // ==========================================
  montant_engage: number;
  montant_decaisse: number;
  progression_physique: number;
}

export interface PTBAWorkflowLog {
  id: string;
  ptba_id: string;
  action: 'CREATION' | 'SOUMISSION' | 'REVISION_DEMANDEE' | 'APPROBATION' | 'REJET' | 'ARCHIVAGE';
  statut_precedent: StatutPTBA;
  nouveau_statut: StatutPTBA;
  user_id: string;
  commentaire?: string | null;
  date_action: string;
}
