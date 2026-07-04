import type { Livrable, LivrableCategorie, StatutLivrable, PrioriteLivrable } from '@/types';

// ─── Constants ───────────────────────────────────────────────────────────────

export const LIVRABLE_CATEGORIES: LivrableCategorie[] = [
  'Rapport', 'Document', 'Logiciel', 'Formation',
  'Infrastructure', 'Étude', 'Manuel', 'Audit', 'Réception', 'Autre',
];

export const STATUT_LIVRABLE_OPTIONS: { value: StatutLivrable; label: string }[] = [
  { value: 'A_FAIRE',  label: 'À faire'  },
  { value: 'EN_COURS', label: 'En cours' },
  { value: 'SOUMIS',   label: 'Soumis'   },
  { value: 'VALIDE',   label: 'Validé'   },
  { value: 'REFUSE',   label: 'Refusé'   },
  { value: 'TERMINE',  label: 'Terminé'  },
];

export const PRIORITE_LIVRABLE_OPTIONS: { value: PrioriteLivrable; label: string }[] = [
  { value: 'FAIBLE',    label: 'Faible'    },
  { value: 'MOYENNE',   label: 'Moyenne'   },
  { value: 'HAUTE',     label: 'Haute'     },
  { value: 'CRITIQUE',  label: 'Critique'  },
];

// ─── Helper ──────────────────────────────────────────────────────────────────

function l(
  id: string, code: string, nom: string, desc: string,
  cat: LivrableCategorie, composante: string,
  resp: string, prevue: string, reelle: string | undefined,
  avancement: number, statut: StatutLivrable, priorite: PrioriteLivrable,
): Livrable {
  const now = reelle ?? prevue;
  return {
    id, projet_id: 'mock-proj-01', code_livrable: code,
    nom, description: desc, categorie: cat, composante, responsable: resp,
    date_prevue: prevue, date_reelle: reelle,
    avancement, statut, priorite,
    createdAt: '2026-01-05T08:00:00.000Z',
    updatedAt:  now + 'T10:00:00.000Z',
  };
}

// ─── Mock data (22 livrables) ─────────────────────────────────────────────────

export const MOCK_LIVRABLES: Livrable[] = [
  l('lv-001', 'LIV-001',
    'Rapport de démarrage du projet',
    'Document officiel marquant le démarrage des activités, incluant le plan de mise en œuvre initial.',
    'Rapport', 'Composante D — Suivi & Évaluation',
    'Amadou Diallo', '2026-01-20', '2026-01-20', 100, 'VALIDE', 'HAUTE'),

  l('lv-002', 'LIV-002',
    'Plan de travail annuel 2026',
    'Plan détaillé des activités, budgets et responsabilités pour l\'exercice 2026.',
    'Document', 'Composante D — Suivi & Évaluation',
    'Fatoumata Koné', '2026-01-31', '2026-01-30', 100, 'TERMINE', 'HAUTE'),

  l('lv-003', 'LIV-003',
    'Cahier des charges technique — Composante A',
    'Spécifications techniques complètes pour les travaux d\'infrastructure de la composante A.',
    'Document', 'Composante A — Infrastructures',
    'Ibrahima Souaré', '2026-02-15', '2026-02-16', 100, 'VALIDE', 'CRITIQUE'),

  l('lv-004', 'LIV-004',
    'Étude de faisabilité technique et économique',
    'Analyse de faisabilité couvrant les aspects techniques, financiers et socioéconomiques.',
    'Étude', 'Composante A — Infrastructures',
    'Mariam Camara', '2026-02-28', '2026-02-25', 100, 'TERMINE', 'HAUTE'),

  l('lv-005', 'LIV-005',
    'Manuel des procédures administratives et financières',
    'Manuel de référence pour toutes les procédures de gestion administrative et financière du projet.',
    'Manuel', 'Composante D — Suivi & Évaluation',
    'Sékou Touré', '2026-08-31', undefined, 65, 'EN_COURS', 'HAUTE'),

  l('lv-006', 'LIV-006',
    'Application de gestion des bénéficiaires (SIGB)',
    'Plateforme numérique de suivi des bénéficiaires, collecte des données et reporting automatisé.',
    'Logiciel', 'Composante B — Renforcement des Capacités',
    'Amadou Diallo', '2026-09-30', undefined, 40, 'EN_COURS', 'CRITIQUE'),

  l('lv-007', 'LIV-007',
    'Formation initiale des agents de terrain (Lot 1)',
    'Formation de 48 agents sur les protocoles opérationnels, collecte de données et éthique.',
    'Formation', 'Composante B — Renforcement des Capacités',
    'Fatoumata Koné', '2026-03-25', '2026-03-22', 100, 'VALIDE', 'HAUTE'),

  l('lv-008', 'LIV-008',
    'Infrastructure réseau eau potable — Zone nord',
    'Forage de 8 puits, installation réseau de distribution et formation des comités de gestion.',
    'Infrastructure', 'Composante A — Infrastructures',
    'Ibrahima Souaré', '2026-10-31', undefined, 55, 'EN_COURS', 'CRITIQUE'),

  l('lv-009', 'LIV-009',
    'Rapport trimestriel T1 2026 — Bailleur IDA',
    'Rapport narratif et financier du 1er trimestre transmis à la Banque Mondiale.',
    'Rapport', 'Composante D — Suivi & Évaluation',
    'Amadou Diallo', '2026-04-01', '2026-03-31', 100, 'VALIDE', 'HAUTE'),

  l('lv-010', 'LIV-010',
    'Rapport trimestriel T2 2026 — Bailleur IDA',
    'Rapport narratif et financier du 2e trimestre transmis à la Banque Mondiale.',
    'Rapport', 'Composante D — Suivi & Évaluation',
    'Amadou Diallo', '2026-06-30', undefined, 25, 'EN_COURS', 'HAUTE'),

  l('lv-011', 'LIV-011',
    'Audit de performance mi-parcours',
    'Audit indépendant d\'évaluation de la performance à mi-parcours du projet.',
    'Audit', 'Composante D — Suivi & Évaluation',
    'Sékou Touré', '2026-07-01', undefined, 0, 'A_FAIRE', 'CRITIQUE'),

  l('lv-012', 'LIV-012',
    'Étude d\'impact environnemental et social (EIES)',
    'Étude conforme aux standards IDA/Banque Mondiale ; cadre de gestion environnementale inclus.',
    'Étude', 'Composante A — Infrastructures',
    'Ibrahima Souaré', '2026-06-30', undefined, 90, 'SOUMIS', 'HAUTE'),

  l('lv-013', 'LIV-013',
    'Manuel utilisateur SIGB v1.0',
    'Documentation utilisateur de l\'application de gestion des bénéficiaires.',
    'Manuel', 'Composante B — Renforcement des Capacités',
    'Amadou Diallo', '2026-05-31', undefined, 0, 'A_FAIRE', 'MOYENNE'),

  l('lv-014', 'LIV-014',
    'Formation des superviseurs régionaux',
    'Formation avancée de 12 superviseurs régionaux sur les outils de S&E et leadership.',
    'Formation', 'Composante B — Renforcement des Capacités',
    'Fatoumata Koné', '2026-04-20', '2026-04-18', 100, 'TERMINE', 'HAUTE'),

  l('lv-015', 'LIV-015',
    'Site web institutionnel du projet',
    'Portail public du projet incluant actualités, rapports, et indicateurs clés.',
    'Logiciel', 'Composante D — Suivi & Évaluation',
    'Mariam Camara', '2026-05-31', undefined, 100, 'REFUSE', 'MOYENNE'),

  l('lv-016', 'LIV-016',
    'PV de réception provisoire — Travaux civils lot 1',
    'Procès-verbal de réception provisoire des travaux civils du lot 1 de la composante A.',
    'Réception', 'Composante A — Infrastructures',
    'Ibrahima Souaré', '2026-06-15', undefined, 0, 'A_FAIRE', 'CRITIQUE'),

  l('lv-017', 'LIV-017',
    'Rapport annuel 2026',
    'Rapport annuel complet incluant résultats, finances, difficultés et perspectives 2027.',
    'Rapport', 'Composante D — Suivi & Évaluation',
    'Amadou Diallo', '2026-12-31', undefined, 0, 'A_FAIRE', 'HAUTE'),

  l('lv-018', 'LIV-018',
    'Étude de marché — Produits agricoles ciblés',
    'Analyse des marchés locaux et régionaux pour les filières agricoles soutenues par le projet.',
    'Étude', 'Composante C — Développement Rural',
    'Mariam Camara', '2026-07-31', undefined, 50, 'EN_COURS', 'MOYENNE'),

  l('lv-019', 'LIV-019',
    'Formation des formateurs — Techniques agricoles',
    'Formation de 20 formateurs locaux sur les bonnes pratiques agricoles et gestion de l\'eau.',
    'Formation', 'Composante C — Développement Rural',
    'Fatoumata Koné', '2026-05-25', '2026-05-22', 100, 'VALIDE', 'MOYENNE'),

  l('lv-020', 'LIV-020',
    'Rapport final du projet',
    'Rapport de clôture présentant les résultats, leçons apprises et recommandations.',
    'Rapport', 'Composante D — Suivi & Évaluation',
    'Amadou Diallo', '2026-12-15', undefined, 0, 'A_FAIRE', 'CRITIQUE'),

  l('lv-021', 'LIV-021',
    'Audit financier annuel 2026',
    'Audit annuel des comptes du projet par un cabinet indépendant agréé par le bailleur.',
    'Audit', 'Composante D — Suivi & Évaluation',
    'Sékou Touré', '2026-10-31', undefined, 0, 'A_FAIRE', 'HAUTE'),

  l('lv-022', 'LIV-022',
    'PV de réception définitive et clôture technique',
    'Procès-verbal final de réception de l\'ensemble des ouvrages et clôture technique du projet.',
    'Réception', 'Composante A — Infrastructures',
    'Ibrahima Souaré', '2026-12-20', undefined, 0, 'A_FAIRE', 'CRITIQUE'),
];
