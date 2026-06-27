export type ContractStatus = 
  | 'BROUILLON' 
  | 'SIGNE' 
  | 'EN_EXECUTION' 
  | 'SUSPENDU' 
  | 'RESILIE' 
  | 'TERMINE' 
  | 'CLOTURE';

export interface ContractDeliverable {
  id: string;
  contract_id: string;
  titre: string;
  description?: string;
  date_prevue: string;
  date_reelle?: string;
  statut: 'EN_ATTENTE' | 'SOUMIS' | 'VALIDE' | 'REJETE';
  montant_associe?: number;
}

export interface ContractAmendment {
  id: string;
  contract_id: string;
  reference: string;
  motif: string;
  date_signature: string;
  impact_montant_devise: number;
  impact_montant_base: number;
  impact_delai_jours: number;
  statut: 'BROUILLON' | 'SIGNE' | 'ANNULE';
}

export interface Contract {
  id: string;
  projet_id: string;
  wbs_id: string;
  budget_ligne_id: string;
  ppm_ligne_id: string;
  bailleur_id: string;
  fournisseur_id: string;
  
  reference: string;
  intitule: string;
  statut: ContractStatus;
  
  // Multi-devises
  devise_code: string;
  taux_change_contractuel: number;
  montant_initial_devise: number;
  montant_initial_base: number;
  
  // Dates contractuelles
  date_signature?: string;
  date_ordre_service?: string;
  debut_prevu?: string;
  debut_reel?: string;
  fin_prevue?: string;
  fin_reelle?: string;
  reception_provisoire?: string;
  reception_definitive?: string;
  
  // Garanties
  garantie_bonne_execution_taux?: number;
  garantie_avance_taux?: number;
  retenue_garantie_taux?: number;
  date_expiration_garantie?: string;
  
  // Optimistic Locking
  version_hash: string;
}

export interface ContractVersion {
  id: string;
  contract_id: string;
  numero_version: string;
  statut: ContractStatus;
  cree_le: string;
  cree_par: string;
  donnees: Partial<Contract>;
}

export interface ContractRevisionLog {
  id: string;
  contract_id: string;
  date_modification: string;
  auteur: string;
  champ_modifie: string;
  ancienne_valeur: any;
  nouvelle_valeur: any;
}

export interface ContractWorkflowLog {
  id: string;
  contract_id: string;
  date_transition: string;
  auteur: string;
  statut_precedent: ContractStatus;
  nouveau_statut: ContractStatus;
  commentaire?: string;
}
