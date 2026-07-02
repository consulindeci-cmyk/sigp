import type { Risque, NiveauRisque, RisqueCategorie, StatutRisque } from '@/types';

export const RISK_CATEGORIES: RisqueCategorie[] = [
  'Technique', 'Financier', 'Opérationnel', 'Juridique',
  'Environnemental', 'Social', 'Sécurité', 'Institutionnel', 'Gouvernance',
];

export const STATUT_RISQUE_OPTIONS: { value: StatutRisque; label: string }[] = [
  { value: 'OUVERT',    label: 'Ouvert'    },
  { value: 'EN_COURS',  label: 'En cours'  },
  { value: 'MAÎTRISÉ',  label: 'Maîtrisé'  },
  { value: 'CLOS',      label: 'Clos'      },
];

function getNiveauCriticite(criticite: number): NiveauRisque {
  if (criticite >= 9) return 'CRITIQUE';
  if (criticite >= 6) return 'ELEVE';
  if (criticite >= 3) return 'MODERE';
  return 'FAIBLE';
}

function r(
  id: string, code: string, description: string,
  categorie: RisqueCategorie, p: 1 | 2 | 3, i: 1 | 2 | 3,
  statut: StatutRisque, responsable: string, plan: string,
  dateId: string, dateRev?: string,
): Risque {
  const criticite = p * i;
  return {
    id, projet_id: 'mock-proj-01', code_risque: code, description,
    categorie, probabilite: p, impact: i, criticite,
    niveau_criticite: getNiveauCriticite(criticite),
    statut, responsable, plan_mitigation: plan,
    date_identification: dateId, date_revision_prevue: dateRev,
    createdAt: dateId + 'T08:00:00.000Z',
    updatedAt: dateId + 'T08:00:00.000Z',
  };
}

export const MOCK_RISQUES: Risque[] = [
  r('r-001', 'RSQ-001',
    'Retard dans la passation des marchés de travaux',
    'Technique', 2, 3, 'EN_COURS',
    'Amadou Diallo',
    'Renforcement de la cellule de passation ; recrutement d\'un expert en procurement ; suivi hebdomadaire des dossiers.',
    '2026-01-15', '2026-07-15'),
  r('r-002', 'RSQ-002',
    'Dépassement budgétaire de la composante A (génie civil)',
    'Financier', 3, 3, 'EN_COURS',
    'Fatoumata Koné',
    'Révision du devis estimatif ; sélection de matériaux alternatifs ; gel des postes secondaires en attente d\'arbitrage.',
    '2026-01-20', '2026-06-30'),
  r('r-003', 'RSQ-003',
    'Instabilité sécuritaire dans les zones d\'intervention',
    'Sécurité', 2, 3, 'OUVERT',
    'Ibrahima Souaré',
    'Protocole de sécurité validé par l\'UNDSS ; points focaux sécurité par zone ; reports d\'activités si alerte.',
    '2026-02-01', '2026-08-01'),
  r('r-004', 'RSQ-004',
    'Rotation élevée du personnel technique clé',
    'Opérationnel', 3, 2, 'EN_COURS',
    'Mariam Camara',
    'Clauses de rétention dans les contrats ; plan de relève documenté ; transfert de connaissances formalisé.',
    '2026-01-10', '2026-06-10'),
  r('r-005', 'RSQ-005',
    'Non-obtention des permis de construire dans les délais',
    'Juridique', 2, 2, 'EN_COURS',
    'Sékou Touré',
    'Engagement précoce des autorités locales ; constitution des dossiers en parallèle avec l\'étude technique.',
    '2026-02-15', '2026-07-15'),
  r('r-006', 'RSQ-006',
    'Résistance des communautés aux travaux d\'infrastructure',
    'Social', 1, 3, 'OUVERT',
    'Aissatou Barry',
    'Consultations communautaires élargies ; mécanismes de plainte opérationnels ; implication des chefs locaux.',
    '2026-03-01', '2026-09-01'),
  r('r-007', 'RSQ-007',
    'Fluctuation défavorable des taux de change EUR/XOF',
    'Financier', 3, 3, 'OUVERT',
    'Fatoumata Koné',
    'Clause de révision des prix dans les contrats ; couverture de change si disponible ; fonds de réserve activé.',
    '2026-01-05', '2026-07-05'),
  r('r-008', 'RSQ-008',
    'Défaillance du fournisseur principal de matériaux',
    'Opérationnel', 2, 2, 'MAÎTRISÉ',
    'Amadou Diallo',
    'Liste de fournisseurs alternatifs pré-qualifiés ; stocks tampons de 30 jours ; clauses pénales contractuelles.',
    '2026-02-20', '2026-05-20'),
  r('r-009', 'RSQ-009',
    'Incidents environnementaux lors des travaux de terrassement',
    'Environnemental', 1, 2, 'OUVERT',
    'Ibrahima Souaré',
    'PGES mis en œuvre ; superviseur environnement sur site ; rapports mensuels transmis au bailleur.',
    '2026-03-10', '2026-09-10'),
  r('r-010', 'RSQ-010',
    'Retard dans l\'approbation des décaissements par le bailleur',
    'Institutionnel', 2, 3, 'EN_COURS',
    'Mariam Camara',
    'Soumission anticipée des DRF (J-15) ; point mensuel avec la délégation ; assistance technique à la préparation.',
    '2026-01-25', '2026-07-25'),
  r('r-011', 'RSQ-011',
    'Risque de fraude ou détournement interne',
    'Gouvernance', 1, 3, 'OUVERT',
    'Sékou Touré',
    'Contrôle interne renforcé ; séparation des fonctions d\'ordonnancement et de paiement ; audit trimestriel.',
    '2026-04-01', '2026-10-01'),
  r('r-012', 'RSQ-012',
    'Pannes répétées des équipements de chantier',
    'Technique', 2, 1, 'MAÎTRISÉ',
    'Amadou Diallo',
    'Contrat de maintenance préventive ; stock de pièces critiques ; équipement de remplacement identifié.',
    '2026-03-15', '2026-06-15'),
  r('r-013', 'RSQ-013',
    'Gel ou suspension du projet par décision gouvernementale',
    'Institutionnel', 1, 3, 'OUVERT',
    'Fatoumata Koné',
    'Dialogue politique continu ; rapport de coordination semestriel avec le comité de pilotage national.',
    '2026-04-15', '2026-10-15'),
  r('r-014', 'RSQ-014',
    'Surcoûts logistiques dus à l\'enclavement des zones de travaux',
    'Opérationnel', 3, 1, 'EN_COURS',
    'Ibrahima Souaré',
    'Cartographie logistique préalable ; groupage des livraisons ; négociation de tarifs groupés avec transporteurs.',
    '2026-02-10', '2026-08-10'),
];

export interface RiskEvolutionPoint {
  mois: string;
  critique: number;
  eleve: number;
  modere: number;
  faible: number;
}

export const MOCK_RISK_EVOLUTION: RiskEvolutionPoint[] = [
  { mois: 'Jan.', critique: 1, eleve: 2, modere: 4, faible: 3 },
  { mois: 'Fév.', critique: 2, eleve: 3, modere: 5, faible: 2 },
  { mois: 'Mar.', critique: 2, eleve: 4, modere: 5, faible: 3 },
  { mois: 'Avr.', critique: 2, eleve: 4, modere: 6, faible: 2 },
  { mois: 'Mai',  critique: 2, eleve: 4, modere: 6, faible: 2 },
  { mois: 'Juin', critique: 2, eleve: 4, modere: 6, faible: 2 },
];
