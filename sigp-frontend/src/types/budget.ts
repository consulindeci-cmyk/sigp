export enum StatutBudget {
  BROUILLON = 'BROUILLON',
  SOUMIS = 'SOUMIS',
  EN_REVISION = 'EN_REVISION',
  APPROUVE = 'APPROUVE',
  ARCHIVE = 'ARCHIVE'
}

export enum TypeRevision {
  AJOUT_FONDS = 'AJOUT_FONDS',
  RETRAIT_FONDS = 'RETRAIT_FONDS',
  TRANSFERT_INTER_CATEGORIE = 'TRANSFERT_INTER_CATEGORIE',
  TRANSFERT_INTER_COMPOSANTE = 'TRANSFERT_INTER_COMPOSANTE'
}

export interface Budget {
  id: string;
  projet_id: string;
  devise_ref_id: string;
  cree_par: string;
  cree_le: string;
  
  version_active_id: string;
  versions?: BudgetVersion[];
}

export interface BudgetVersion {
  id: string;
  budget_id: string;
  numero_version: string;
  statut: StatutBudget;
  montant_total_initial: number;
  montant_total_revise: number;
  
  cree_le: string;
  approuve_le?: string;
  approuve_par?: string;
  
  lignes?: BudgetLigne[];
  revisions?: BudgetRevision[];
}

export interface BudgetLigne {
  id: string;
  budget_version_id: string;
  version: number;
  
  wbs_id: string;
  bailleur_id: string;
  source_financement_id: string;
  categorie_id: string;
  compte_comptable_id?: string;
  centre_cout_id?: string;
  zone_geo_id?: string;
  responsable_id?: string;
  
  montant_initial: number;
  montant_revise: number;
  
  montant_pre_engage: number;
  montant_engage: number;
  montant_liquide: number;
  montant_decaisse: number;
  
  solde_disponible: number;
  reste_a_payer: number;
  
  // For UI presentation only (Optional relations)
  wbs_nom?: string;
  bailleur_nom?: string;
}

export interface BudgetRevision {
  id: string;
  budget_version_id: string;
  type: TypeRevision;
  titre: string;
  justification: string;
  statut: 'SOUMIS' | 'VALIDATION_N1' | 'VALIDATION_BAILLEUR' | 'APPROUVE' | 'REJETE';
  document_reference?: string;
  
  mouvements?: MouvementRevision[];
}

export interface MouvementRevision {
  id: string;
  revision_id: string;
  ligne_source_id?: string;
  ligne_cible_id: string;
  montant: number;
}

export interface WorkflowLog {
  id: string;
  entite_id: string; // ID of the Revision or BudgetVersion
  entite_type: 'BUDGET_VERSION' | 'BUDGET_REVISION';
  action: string;
  statut_precedent: string;
  statut_nouveau: string;
  utilisateur_id: string;
  commentaire?: string;
  cree_le: string;
}
