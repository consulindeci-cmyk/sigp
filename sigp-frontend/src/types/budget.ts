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

  // Identifiant propre à la ligne budgétaire (code_ligne de la table
  // budget_lignes) — distinct de wbs_id/code_wbs ci-dessous, le vrai
  // rattachement à un nœud wbs_nodes (cf. audit Budget : migration
  // 20260823100000_budget_lignes_wbs_valorisation).
  code_ligne: string;
  // Rattachement réel à un nœud WBS (composante ou sous-élément) — code_wbs/
  // wbs_libelle sont résolus depuis ce nœud pour l'affichage, avec repli sur
  // code_ligne/libelle si la ligne n'est pas (encore) rattachée.
  wbs_id?: string | null;
  code_wbs?: string;

  // Valorisation façon Excel : Coût Total (montant_revise) = Quantité × Coût
  // Unitaire quand les deux sont renseignés.
  unite?: string | null;
  quantite?: number | null;
  cout_unitaire?: number | null;

  // Bailleur réel (funding_sources.id) — rattachement en base uniquement,
  // jamais affiché tel quel dans la colonne "Financement Bailleur" de la
  // Matrice (remplacé par montant_bailleur ci-dessous, cf. correction).
  bailleur_id: string;
  bailleur_nom?: string;
  // Montant réellement financé par ce bailleur sur cette ligne (peut différer
  // du Coût Total en cofinancement) — c'est cette valeur, pas le nom du
  // bailleur, qui s'affiche dans la colonne "Financement Bailleur".
  montant_bailleur?: number | null;

  montant_initial: number;
  montant_revise: number;

  // Calculé côté serveur (montant_revise − montant_engage, cf. useBudget.ts) —
  // montant_engage lui-même n'est plus exposé sur ce type depuis le nettoyage
  // BudgetMatrix (Engagements retiré de la table), mais solde_disponible reste
  // consommé ailleurs (ProjectDisbursementTab : alerte de dépassement à la
  // saisie d'un décaissement contre une ligne budgétaire).
  solde_disponible: number;

  // For UI presentation only (Optional relations)
  libelle?: string;
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
