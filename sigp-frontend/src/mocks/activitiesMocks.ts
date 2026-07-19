export type ActivityStatus = 'Non démarré' | 'En cours' | 'Terminé' | 'En retard' | 'Suspendu';
export type ActivityPriority = 'Critique' | 'Haute' | 'Moyenne' | 'Faible';

export interface Activity {
  id: string;
  code: string;
  libelle: string;
  // responsable : nom affiché (résolu depuis users via l'embed de useTasks) ;
  // responsableId : le véritable UUID stocké dans ptba_activites.responsable_id,
  // nécessaire pour pré-remplir le sélecteur en édition.
  responsable: string;
  responsableId?: string | null;
  initialesResponsable: string;
  dateDebut: string;
  dateFin: string;
  avancement: number;
  priorite: ActivityPriority;
  statut: ActivityStatus;
  composante: string;
  description: string;
  budgetAlloue: number;
  budgetRealise: number;
  // Nœud WBS terminal auquel cette activité est rattachée (ptba_activites.wbs_id)
  // — permet l'agrégation automatique du budget/avancement du WBS (cf. useWBS.ts).
  wbsNodeId?: string | null;
}

