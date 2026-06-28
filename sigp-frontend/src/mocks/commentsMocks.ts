export interface CommentReply {
  id: string;
  auteur: string;
  initialesAuteur: string;
  date: string;
  message: string;
}

export interface ProjectComment {
  id: string;
  auteur: string;
  initialesAuteur: string;
  date: string;
  message: string;
  pieceJointe: string | null;
  reponses: CommentReply[];
}

export const mockComments: ProjectComment[] = [
  {
    id: 'c1',
    auteur: 'Amadou Diallo',
    initialesAuteur: 'AD',
    date: '2026-06-28T14:32:00',
    message:
      "Suite à la réunion du comité de pilotage d'hier, j'ai mis à jour le budget de la composante C. L'avenant #4 a été validé. Merci de vérifier les nouveaux plafonds avant le prochain rapport mensuel.",
    pieceJointe: 'Avenant_4_Budget_CompC.pdf',
    reponses: [
      {
        id: 'r1-1',
        auteur: 'Fatoumata Moussa',
        initialesAuteur: 'FM',
        date: '2026-06-28T16:10:00',
        message: "Reçu. J'ai pris connaissance du document et mis à jour les tableaux de suivi budgétaire. Tout est cohérent avec les nouvelles lignes.",
      },
      {
        id: 'r1-2',
        auteur: 'Boubacar Issa',
        initialesAuteur: 'BI',
        date: '2026-06-28T17:45:00',
        message: "Parfait. J'ai également informé l'équipe terrain des nouveaux plafonds pour les achats locaux.",
      },
    ],
  },
  {
    id: 'c2',
    auteur: 'Aïchata Koné',
    initialesAuteur: 'AK',
    date: '2026-06-27T09:15:00',
    message:
      "Attention : l'EIES v2 a été soumise aux bailleurs hier. Nous attendons leurs retours sous 15 jours. En attendant, les travaux de la composante A doivent continuer selon le plan approuvé v1.",
    pieceJointe: 'EIES_v2_final.pdf',
    reponses: [
      {
        id: 'r2-1',
        auteur: 'Rabiou Hamidou',
        initialesAuteur: 'RH',
        date: '2026-06-27T11:00:00',
        message: "Entendu. L'équipe de formation continuera sur le programme actuel en attendant les retours bailleurs.",
      },
    ],
  },
  {
    id: 'c3',
    auteur: 'Rabiou Hamidou',
    initialesAuteur: 'RH',
    date: '2026-06-26T15:30:00',
    message:
      "Formation ACT-B-001 clôturée avec succès — 42/42 agents certifiés. Les attestations ont été transmises à l'UFG pour archivage. Le rapport de formation sera disponible en fin de semaine.",
    pieceJointe: null,
    reponses: [
      {
        id: 'r3-1',
        auteur: 'Amadou Diallo',
        initialesAuteur: 'AD',
        date: '2026-06-26T16:00:00',
        message: "Excellent résultat ! Merci à toute l'équipe formation. J'ai mis l'avancement à 100% dans le système.",
      },
    ],
  },
  {
    id: 'c4',
    auteur: 'Salif Traoré',
    initialesAuteur: 'ST',
    date: '2026-06-25T10:45:00',
    message:
      "Point urgent — Lot 2 solaires : le fournisseur Solartech annonce un retard de 6 semaines sur les livraisons. Deux options : (1) chercher un fournisseur alternatif, (2) réviser le calendrier ACT-C-003. Besoin d'une décision avant vendredi.",
    pieceJointe: 'Courrier_Solartech_retard.pdf',
    reponses: [
      {
        id: 'r4-1',
        auteur: 'Amadou Diallo',
        initialesAuteur: 'AD',
        date: '2026-06-25T13:20:00',
        message: "J'escalade au comité de pilotage pour décision. En attendant, j'ai mis le statut ACT-C-003 à 'En retard' et alerté les bailleurs.",
      },
      {
        id: 'r4-2',
        auteur: 'Fatoumata Moussa',
        initialesAuteur: 'FM',
        date: '2026-06-25T14:00:00',
        message: "Option 1 risquée pour les délais de passation — je recommande option 2 avec révision du calendrier d'exécution.",
      },
      {
        id: 'r4-3',
        auteur: 'Boubacar Issa',
        initialesAuteur: 'BI',
        date: '2026-06-25T15:10:00',
        message: "D'accord avec Fatoumata. J'ai déjà identifié 2 fournisseurs locaux en backup si la décision change.",
      },
    ],
  },
  {
    id: 'c5',
    auteur: 'Boubacar Issa',
    initialesAuteur: 'BI',
    date: '2026-06-24T08:30:00',
    message:
      "Piste Commune B — les travaux avancent malgré les pluies. Nous avons 4,2 km sur 12 km réalisés. Un avenant pour les travaux de drainage supplémentaire sera nécessaire.",
    pieceJointe: 'Photos_chantier_Commune_B_juin2026.zip',
    reponses: [],
  },
  {
    id: 'c6',
    auteur: 'Fatoumata Moussa',
    initialesAuteur: 'FM',
    date: '2026-06-22T16:20:00',
    message:
      "Rappel : le rapport semestriel est attendu par AFD le 15 juillet. Il faut que chaque responsable de composante transmette ses données chiffrées avant le 8 juillet. Merci de confirmer.",
    pieceJointe: null,
    reponses: [
      {
        id: 'r6-1',
        auteur: 'Aïchata Koné',
        initialesAuteur: 'AK',
        date: '2026-06-22T17:00:00',
        message: "Confirmé pour composante A — données disponibles le 5 juillet.",
      },
      {
        id: 'r6-2',
        auteur: 'Rabiou Hamidou',
        initialesAuteur: 'RH',
        date: '2026-06-23T08:15:00',
        message: "OK pour composante B — je transmets le 6 juillet.",
      },
      {
        id: 'r6-3',
        auteur: 'Boubacar Issa',
        initialesAuteur: 'BI',
        date: '2026-06-23T09:00:00',
        message: "Composante C confirmée pour le 7 juillet — rapport photos inclus.",
      },
    ],
  },
];
