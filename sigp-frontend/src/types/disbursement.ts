export interface Disbursement {
  id: string
  // budget_ligne_id/budget_version_id sont de vraies colonnes, désormais
  // obligatoires à la création (fixées ensuite, non modifiables) : sans
  // elles, un décaissement ne déclenchait jamais recalc_budget_ligne_montants
  // côté montant_paye, laissant l'AC de l'EVM et la colonne "Décaissé" du
  // Budget figés à zéro (cf. audit Décaissements). Statut/Source de
  // financement/Contrat ont été retirés du formulaire, des types et des
  // payloads (cf. simplification) — tout décaissement créé désormais
  // représente un paiement déjà effectué (statut 'DECAISSE' fixé côté
  // serveur), plus un cycle de vie Planifié/Demandé/Approuvé.
  budgetLigneId: string | null
  budgetVersionId: string | null
  montant: number
  devise: string
  // Date unique du décaissement (fusionne les anciennes colonnes
  // date_prevue/date_reelle, écrites avec la même valeur des deux côtés par
  // l'Edge Function) — lue ici avec repli date_reelle ?? date_prevue pour
  // les enregistrements créés avant cette fusion.
  date: string | null
  reference: string | null
  description: string | null
}
