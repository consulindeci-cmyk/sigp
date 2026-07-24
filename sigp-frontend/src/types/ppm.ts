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

  // Relations d'intégrité — colonnes réelles avec FK dédiée (cf. migration
  // 20260828100000_ppm_marches_wbs_budget_methode_colonnes.sql). Le bailleur
  // n'est plus persisté sur la ligne : il est dérivé à la volée depuis la
  // ligne budgétaire rattachée (cf. PPMFormSlideOver).
  wbs_id: string;
  budget_ligne_id: string;

  // Description de l'achat
  reference_marche: string;
  description: string;
  categorie: CategorieAchat;
  methode: MethodePassation;
  type_revue: TypeRevue;

  // Montant estimé — toujours dans la devise du projet (une seule devise par
  // projet, cf. Section 4 "Montant Estimé" de PPMFormSlideOver ; plus de
  // devise/taux de change propres à la ligne).
  montant_estime_base: number;

  // Attribution — renseignés une fois le marché attribué/signé (colonnes
  // réelles ppm_marches.montant_signe/titulaire/date_fin_effective)
  montant_signe?: number;
  titulaire?: string;
  date_fin_effective?: string;

  // Chronogramme — seules 2 dates ont un usage réel dans le formulaire
  // (Section 3 "Calendrier & Jalons"), chacune adossée à une colonne réelle
  // de longue date (date_lancement_prevu, date_signature).
  dates_cles: {
    lancement_dao_prevue: string;     // Date Avis / Publication
    signature_contrat_prevue: string; // Date Signature du Contrat
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
