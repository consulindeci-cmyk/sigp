export type DisbursementStatut = 'PLANIFIE' | 'DEMANDE' | 'APPROUVE' | 'DECAISSE' | 'REJETE'

export interface Disbursement {
  id: string
  fundingSourceId: string | null
  fundingSourceNom: string | null
  // budget_ligne_id/contract_id/budget_version_id sont de vraies colonnes,
  // fixées à la création uniquement (disbursements-update ne les accepte
  // pas — cf. useUpdateDisbursement) : sans elles, un décaissement ne
  // déclenchait jamais recalc_budget_ligne_montants côté montant_paye,
  // laissant l'AC de l'EVM et la colonne "Décaissé" du Budget figés à zéro
  // (cf. audit Décaissements).
  budgetLigneId: string | null
  contractId: string | null
  budgetVersionId: string | null
  statut: DisbursementStatut
  montant: number
  // Devise réelle du décaissement (colonne disbursements.devise, calculée
  // côté serveur — défaut = devise de l'organisation du projet résolu).
  devise: string
  datePrevue: string | null
  dateReelle: string | null
  reference: string | null
  description: string | null
}
