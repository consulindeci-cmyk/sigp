import type {
  HistoriqueProjet, TypeActionHistorique, NiveauHistorique, ModuleHistorique,
} from '@/types';

// ─── Listes normalisées ───────────────────────────────────────────────────────

export const MODULES_HISTORIQUE: ModuleHistorique[] = [
  'Projet', 'PTBA', 'Activités', 'Budget', 'Sources', 'PPM',
  'Contrats', 'Décaissements', 'EVM', 'Risques', 'Livrables',
  'Documents', 'Rapports', 'Paramètres',
];

export const ACTION_LABEL: Record<TypeActionHistorique, string> = {
  CREATION:      'Création',
  MODIFICATION:  'Modification',
  SUPPRESSION:   'Suppression',
  VALIDATION:    'Validation',
  REJET:         'Rejet',
  CONNEXION:     'Connexion',
  DECONNEXION:   'Déconnexion',
  TELECHARGEMENT:'Téléchargement',
  IMPORT:        'Import',
  EXPORT:        'Export',
  ARCHIVAGE:     'Archivage',
  RESTAURATION:  'Restauration',
};

export const ACTION_OPTIONS: { value: TypeActionHistorique; label: string }[] = [
  { value: 'CREATION',       label: 'Création'       },
  { value: 'MODIFICATION',   label: 'Modification'   },
  { value: 'SUPPRESSION',    label: 'Suppression'    },
  { value: 'VALIDATION',     label: 'Validation'     },
  { value: 'REJET',          label: 'Rejet'          },
  { value: 'CONNEXION',      label: 'Connexion'      },
  { value: 'DECONNEXION',    label: 'Déconnexion'    },
  { value: 'TELECHARGEMENT', label: 'Téléchargement' },
  { value: 'IMPORT',         label: 'Import'         },
  { value: 'EXPORT',         label: 'Export'         },
  { value: 'ARCHIVAGE',      label: 'Archivage'      },
  { value: 'RESTAURATION',   label: 'Restauration'   },
];

export const NIVEAU_OPTIONS: { value: NiveauHistorique; label: string }[] = [
  { value: 'INFO',         label: 'Info'         },
  { value: 'AVERTISSEMENT',label: 'Avertissement'},
  { value: 'CRITIQUE',     label: 'Critique'     },
];

// ─── Helper ───────────────────────────────────────────────────────────────────

function h(
  id: string, date: string, heure: string,
  utilisateur: string, role: string,
  module: ModuleHistorique, element: string,
  action: TypeActionHistorique, description: string,
  niveau: NiveauHistorique, ip: string, navigateur: string,
): HistoriqueProjet {
  return {
    id, projet_id: 'mock-proj-01', date, heure,
    utilisateur, role, module, element, action, description,
    niveau, ip, navigateur,
    createdAt: `${date}T${heure}.000Z`,
  };
}

// ─── 150 événements — janvier à juillet 2026 ─────────────────────────────────

export const MOCK_HISTORIQUE: HistoriqueProjet[] = [

  // ── Janvier 2026 ─────────────────────────────────────────────────────────

  h('evt-001', '2026-01-03', '08:12:05', 'Amadou Diallo', 'Coordonnateur', 'Projet', 'SIGP-2026', 'CONNEXION', 'Connexion au système en début de journée.', 'INFO', '192.168.1.10', 'Chrome 120 / Windows 11'),
  h('evt-002', '2026-01-03', '08:15:22', 'Amadou Diallo', 'Coordonnateur', 'Paramètres', 'Paramètres généraux', 'MODIFICATION', 'Mise à jour de la date de clôture de l\'exercice 2026 (31/12 → 30/06/2027).', 'AVERTISSEMENT', '192.168.1.10', 'Chrome 120 / Windows 11'),
  h('evt-003', '2026-01-05', '09:00:11', 'Fatoumata Koné', 'Resp. Financier', 'Budget', 'Ligne BUD-001 — Consultants', 'CREATION', 'Création de la ligne budgétaire Consultants pour la composante A.', 'INFO', '10.0.0.22', 'Firefox 121 / macOS'),
  h('evt-004', '2026-01-05', '09:45:33', 'Fatoumata Koné', 'Resp. Financier', 'Budget', 'Ligne BUD-002 — Équipements', 'CREATION', 'Création de la ligne budgétaire Équipements, composante B.', 'INFO', '10.0.0.22', 'Firefox 121 / macOS'),
  h('evt-005', '2026-01-06', '10:20:00', 'Ibrahima Souaré', 'Resp. Technique', 'PTBA', 'PTBA-2026', 'CREATION', 'Initialisation du Plan de Travail et Budget Annuel 2026.', 'INFO', '192.168.1.15', 'Chrome 120 / Windows 11'),
  h('evt-006', '2026-01-06', '11:05:18', 'Ibrahima Souaré', 'Resp. Technique', 'Activités', 'ACT-A-001 — Forage puits P-01', 'CREATION', 'Création de l\'activité de forage du puits P-01, zone nord.', 'INFO', '192.168.1.15', 'Chrome 120 / Windows 11'),
  h('evt-007', '2026-01-06', '11:30:42', 'Ibrahima Souaré', 'Resp. Technique', 'Activités', 'ACT-A-002 — Forage puits P-02', 'CREATION', 'Création de l\'activité de forage du puits P-02, zone nord.', 'INFO', '192.168.1.15', 'Chrome 120 / Windows 11'),
  h('evt-008', '2026-01-07', '14:10:55', 'Mariam Camara', 'Resp. S&E', 'Risques', 'Risque R-001 — Délais fournisseurs', 'CREATION', 'Identification d\'un risque de retard lié aux délais de livraison des équipements.', 'INFO', '10.0.0.31', 'Edge 120 / Windows 10'),
  h('evt-009', '2026-01-08', '09:22:17', 'Sékou Touré', 'Admin Projet', 'PPM', 'Marché MRC-001 — Travaux civils lot 1', 'CREATION', 'Création du marché de travaux civils lot 1 dans le PPM 2026.', 'INFO', '10.0.0.44', 'Chrome 120 / Windows 11'),
  h('evt-010', '2026-01-08', '10:00:00', 'Sékou Touré', 'Admin Projet', 'Contrats', 'Contrat CTR-001 — SETEC', 'CREATION', 'Enregistrement du contrat de prestation de services SETEC, montant 450 000 USD.', 'INFO', '10.0.0.44', 'Chrome 120 / Windows 11'),
  h('evt-011', '2026-01-10', '16:45:30', 'Amadou Diallo', 'Coordonnateur', 'Documents', 'DOC-001 — Contrat SETEC', 'CREATION', 'Dépôt du contrat SETEC dans le gestionnaire documentaire (PDF, v1.0).', 'INFO', '192.168.1.10', 'Chrome 120 / Windows 11'),
  h('evt-012', '2026-01-10', '17:00:00', 'Amadou Diallo', 'Coordonnateur', 'Projet', 'SIGP-2026', 'DECONNEXION', 'Déconnexion en fin de journée.', 'INFO', '192.168.1.10', 'Chrome 120 / Windows 11'),
  h('evt-013', '2026-01-12', '08:30:00', 'Fatoumata Koné', 'Resp. Financier', 'Sources', 'Source FIN-001 — IDA', 'CREATION', 'Enregistrement de la source de financement IDA — Banque Mondiale, enveloppe 5 M USD.', 'INFO', '10.0.0.22', 'Firefox 121 / macOS'),
  h('evt-014', '2026-01-12', '08:55:00', 'Fatoumata Koné', 'Resp. Financier', 'Sources', 'Source FIN-002 — Gouvernement', 'CREATION', 'Enregistrement de la contrepartie nationale, enveloppe 800 000 USD.', 'INFO', '10.0.0.22', 'Firefox 121 / macOS'),
  h('evt-015', '2026-01-14', '11:15:44', 'Ibrahima Souaré', 'Resp. Technique', 'Activités', 'ACT-A-001 — Forage puits P-01', 'MODIFICATION', 'Mise à jour de l\'avancement de 0 % à 15 % suite démarrage des travaux.', 'INFO', '192.168.1.15', 'Chrome 120 / Windows 11'),
  h('evt-016', '2026-01-15', '14:00:22', 'Mariam Camara', 'Resp. S&E', 'Livrables', 'LIV-001 — Rapport démarrage', 'CREATION', 'Création du livrable Rapport de démarrage, responsable Mariam Camara.', 'INFO', '10.0.0.31', 'Edge 120 / Windows 10'),
  h('evt-017', '2026-01-15', '15:30:00', 'Amadou Diallo', 'Coordonnateur', 'Rapports', 'RPT-002 — Rapport mensuel janvier 2026', 'CREATION', 'Génération du rapport mensuel de janvier 2026 au format PDF.', 'INFO', '192.168.1.10', 'Chrome 120 / Windows 11'),
  h('evt-018', '2026-01-18', '09:45:00', 'Sékou Touré', 'Admin Projet', 'Paramètres', 'Utilisateur — Ibrahima Souaré', 'MODIFICATION', 'Mise à jour du rôle de Ibrahima Souaré (Observateur → Responsable Technique).', 'AVERTISSEMENT', '10.0.0.44', 'Chrome 120 / Windows 11'),
  h('evt-019', '2026-01-20', '10:10:05', 'Fatoumata Koné', 'Resp. Financier', 'Décaissements', 'DEC-001 — Avance IDA janvier', 'CREATION', 'Enregistrement du premier décaissement IDA, montant 300 000 USD.', 'INFO', '10.0.0.22', 'Firefox 121 / macOS'),
  h('evt-020', '2026-01-20', '10:30:00', 'Fatoumata Koné', 'Resp. Financier', 'Budget', 'Ligne BUD-001 — Consultants', 'MODIFICATION', 'Révision du montant alloué consultants de 650 000 à 720 000 USD (avenant fournisseur).', 'AVERTISSEMENT', '10.0.0.22', 'Firefox 121 / macOS'),
  h('evt-021', '2026-01-21', '16:00:00', 'Mariam Camara', 'Resp. S&E', 'EVM', 'Période EVM — Janvier 2026', 'CREATION', 'Saisie des indicateurs EVM de janvier 2026: PV=180 000, EV=120 000, AC=135 000.', 'INFO', '10.0.0.31', 'Edge 120 / Windows 10'),
  h('evt-022', '2026-01-25', '09:00:00', 'Amadou Diallo', 'Coordonnateur', 'Rapports', 'RPT-003 — Rapport financier janvier', 'CREATION', 'Génération du rapport financier de janvier 2026 au format Excel.', 'INFO', '192.168.1.10', 'Chrome 120 / Windows 11'),
  h('evt-023', '2026-01-28', '14:20:11', 'Ibrahima Souaré', 'Resp. Technique', 'Activités', 'ACT-A-002 — Forage puits P-02', 'MODIFICATION', 'Mise à jour avancement 0 % → 20 %, début des opérations de forage.', 'INFO', '192.168.1.15', 'Chrome 120 / Windows 11'),
  h('evt-024', '2026-01-30', '17:55:00', 'Sékou Touré', 'Admin Projet', 'Projet', 'SIGP-2026', 'EXPORT', 'Export du résumé projet au format PDF pour le bailleur IDA.', 'INFO', '10.0.0.44', 'Chrome 120 / Windows 11'),
  h('evt-025', '2026-01-31', '18:00:00', 'Fatoumata Koné', 'Resp. Financier', 'Projet', 'SIGP-2026', 'DECONNEXION', 'Déconnexion automatique après inactivité.', 'INFO', '10.0.0.22', 'Firefox 121 / macOS'),

  // ── Février 2026 ──────────────────────────────────────────────────────────

  h('evt-026', '2026-02-02', '08:05:00', 'Amadou Diallo', 'Coordonnateur', 'Projet', 'SIGP-2026', 'CONNEXION', 'Connexion en début de semaine.', 'INFO', '192.168.1.10', 'Chrome 121 / Windows 11'),
  h('evt-027', '2026-02-03', '10:15:44', 'Ibrahima Souaré', 'Resp. Technique', 'Activités', 'ACT-B-001 — Formation agents', 'CREATION', 'Création de l\'activité de formation des agents techniques (composante B).', 'INFO', '192.168.1.15', 'Chrome 121 / Windows 11'),
  h('evt-028', '2026-02-04', '11:00:00', 'Fatoumata Koné', 'Resp. Financier', 'Budget', 'Ligne BUD-003 — Formations', 'CREATION', 'Création ligne budgétaire Formations, composante B, montant 80 000 USD.', 'INFO', '10.0.0.22', 'Firefox 122 / macOS'),
  h('evt-029', '2026-02-05', '14:30:00', 'Mariam Camara', 'Resp. S&E', 'EVM', 'Période EVM — T1 2026', 'CREATION', 'Saisie de l\'analyse EVM trimestrielle T1 2026: CPI=0.89, SPI=0.91.', 'INFO', '10.0.0.31', 'Edge 120 / Windows 10'),
  h('evt-030', '2026-02-05', '15:00:00', 'Mariam Camara', 'Resp. S&E', 'Rapports', 'RPT-004 — Rapport EVM T1', 'CREATION', 'Génération du rapport EVM T1 2026 au format PDF.', 'INFO', '10.0.0.31', 'Edge 120 / Windows 10'),
  h('evt-031', '2026-02-06', '09:30:00', 'Sékou Touré', 'Admin Projet', 'PPM', 'Marché MRC-002 — Équipements bureau', 'CREATION', 'Ajout du marché d\'acquisition d\'équipements informatiques dans le PPM.', 'INFO', '10.0.0.44', 'Chrome 121 / Windows 11'),
  h('evt-032', '2026-02-09', '16:00:00', 'Ibrahima Souaré', 'Resp. Technique', 'Risques', 'Risque R-002 — Pénurie matériaux', 'CREATION', 'Identification d\'un risque de pénurie de matériaux de construction zone nord.', 'AVERTISSEMENT', '192.168.1.15', 'Chrome 121 / Windows 11'),
  h('evt-033', '2026-02-10', '09:00:00', 'Amadou Diallo', 'Coordonnateur', 'Documents', 'DOC-004 — EIES', 'CREATION', 'Dépôt de l\'Étude d\'Impact Environnemental et Social (EIES) dans le GED.', 'INFO', '192.168.1.10', 'Chrome 121 / Windows 11'),
  h('evt-034', '2026-02-10', '10:30:00', 'Amadou Diallo', 'Coordonnateur', 'Documents', 'DOC-004 — EIES', 'VALIDATION', 'Validation de l\'EIES après revue du responsable technique.', 'INFO', '192.168.1.10', 'Chrome 121 / Windows 11'),
  h('evt-035', '2026-02-12', '11:45:00', 'Fatoumata Koné', 'Resp. Financier', 'Décaissements', 'DEC-002 — 2e tranche IDA', 'CREATION', 'Enregistrement de la 2e tranche IDA, montant 250 000 USD.', 'INFO', '10.0.0.22', 'Firefox 122 / macOS'),
  h('evt-036', '2026-02-13', '14:00:00', 'Mariam Camara', 'Resp. S&E', 'Risques', 'Risque R-001 — Délais fournisseurs', 'MODIFICATION', 'Réévaluation du niveau de criticité: Faible → Modéré suite constat de retards.', 'AVERTISSEMENT', '10.0.0.31', 'Edge 120 / Windows 10'),
  h('evt-037', '2026-02-14', '10:15:00', 'Sékou Touré', 'Admin Projet', 'Contrats', 'Contrat CTR-001 — SETEC', 'MODIFICATION', 'Mise à jour du montant suite avenant #1 : 450 000 → 490 000 USD.', 'AVERTISSEMENT', '10.0.0.44', 'Chrome 121 / Windows 11'),
  h('evt-038', '2026-02-15', '15:30:00', 'Ibrahima Souaré', 'Resp. Technique', 'Risques', 'Risque R-003 — Retards météo', 'CREATION', 'Identification risque retards liés aux conditions météorologiques saison des pluies.', 'INFO', '192.168.1.15', 'Chrome 121 / Windows 11'),
  h('evt-039', '2026-02-18', '08:45:00', 'Fatoumata Koné', 'Resp. Financier', 'Rapports', 'RPT-006 — Rapport risques T1', 'CREATION', 'Génération rapport risques T1 2026 au format PDF.', 'INFO', '10.0.0.22', 'Firefox 122 / macOS'),
  h('evt-040', '2026-02-19', '13:30:00', 'Amadou Diallo', 'Coordonnateur', 'Livrables', 'LIV-001 — Rapport démarrage', 'VALIDATION', 'Validation du rapport de démarrage après revue du bailleur.', 'INFO', '192.168.1.10', 'Chrome 121 / Windows 11'),
  h('evt-041', '2026-02-20', '11:00:00', 'Mariam Camara', 'Resp. S&E', 'Documents', 'DOC-005 — TDR Expert Technique', 'CREATION', 'Dépôt des TDR pour le recrutement de l\'expert technique eau & assainissement.', 'INFO', '10.0.0.31', 'Edge 120 / Windows 10'),
  h('evt-042', '2026-02-22', '09:00:00', 'Amadou Diallo', 'Coordonnateur', 'PTBA', 'PTBA-2026 — Composante A', 'MODIFICATION', 'Révision du calendrier composante A suite délai forage puits P-02.', 'AVERTISSEMENT', '192.168.1.10', 'Chrome 121 / Windows 11'),
  h('evt-043', '2026-02-25', '16:00:00', 'Sékou Touré', 'Admin Projet', 'PPM', 'Marché MRC-001 — Travaux civils lot 1', 'MODIFICATION', 'Mise à jour du statut PPM: Planifié → Lancé suite publication DAO.', 'INFO', '10.0.0.44', 'Chrome 121 / Windows 11'),
  h('evt-044', '2026-02-26', '10:20:00', 'Ibrahima Souaré', 'Resp. Technique', 'Activités', 'ACT-A-001 — Forage puits P-01', 'MODIFICATION', 'Avancement mis à jour 15 % → 45 % suite rapport mensuel terrain.', 'INFO', '192.168.1.15', 'Chrome 121 / Windows 11'),
  h('evt-045', '2026-02-28', '17:00:00', 'Amadou Diallo', 'Coordonnateur', 'Rapports', 'RPT-005 — Rapport mensuel février', 'CREATION', 'Génération du rapport mensuel de février 2026.', 'INFO', '192.168.1.10', 'Chrome 121 / Windows 11'),

  // ── Mars 2026 ─────────────────────────────────────────────────────────────

  h('evt-046', '2026-03-02', '08:30:00', 'Fatoumata Koné', 'Resp. Financier', 'Projet', 'SIGP-2026', 'CONNEXION', 'Connexion début de journée.', 'INFO', '10.0.0.22', 'Firefox 122 / macOS'),
  h('evt-047', '2026-03-03', '09:15:00', 'Ibrahima Souaré', 'Resp. Technique', 'Activités', 'ACT-A-003 — Construction châteaux eau', 'CREATION', 'Création activité construction châteaux d\'eau zone nord (4 ouvrages).', 'INFO', '192.168.1.15', 'Chrome 121 / Windows 11'),
  h('evt-048', '2026-03-04', '11:00:00', 'Sékou Touré', 'Admin Projet', 'Contrats', 'Contrat CTR-002 — Constructeur Lot 1', 'CREATION', 'Enregistrement contrat travaux civils lot 1, entreprise BATISSO, 1 200 000 USD.', 'INFO', '10.0.0.44', 'Chrome 121 / Windows 11'),
  h('evt-049', '2026-03-05', '14:45:00', 'Mariam Camara', 'Resp. S&E', 'Risques', 'Risque R-002 — Pénurie matériaux', 'MODIFICATION', 'Plan de mitigation mis à jour: contrat fournisseur alternatif signé.', 'INFO', '10.0.0.31', 'Edge 121 / Windows 10'),
  h('evt-050', '2026-03-06', '10:00:00', 'Fatoumata Koné', 'Resp. Financier', 'Décaissements', 'DEC-003 — Tranche gouvernement', 'CREATION', 'Enregistrement de la contrepartie nationale Q1 2026, montant 100 000 USD.', 'INFO', '10.0.0.22', 'Firefox 122 / macOS'),
  h('evt-051', '2026-03-08', '09:30:00', 'Amadou Diallo', 'Coordonnateur', 'Livrables', 'LIV-002 — Rapport technique mensuel', 'CREATION', 'Création du livrable rapport technique mensuel, responsable Ibrahima Souaré.', 'INFO', '192.168.1.10', 'Chrome 121 / Windows 11'),
  h('evt-052', '2026-03-10', '11:30:00', 'Ibrahima Souaré', 'Resp. Technique', 'Documents', 'DOC-008 — Rapport T1 2026', 'CREATION', 'Dépôt du rapport trimestriel T1 2026 bailleur IDA (PDF, v1.0).', 'INFO', '192.168.1.15', 'Chrome 121 / Windows 11'),
  h('evt-053', '2026-03-11', '15:00:00', 'Amadou Diallo', 'Coordonnateur', 'PTBA', 'PTBA-2026 — Revue trimestrielle', 'MODIFICATION', 'Actualisation PTBA après revue T1: 12 activités sur 28 terminées (43 %).', 'INFO', '192.168.1.10', 'Chrome 121 / Windows 11'),
  h('evt-054', '2026-03-12', '16:00:00', 'Mariam Camara', 'Resp. S&E', 'EVM', 'Période EVM — Février 2026', 'CREATION', 'Saisie EVM février 2026: PV=320 000, EV=270 000, AC=305 000, CPI=0.89.', 'AVERTISSEMENT', '10.0.0.31', 'Edge 121 / Windows 10'),
  h('evt-055', '2026-03-13', '09:00:00', 'Sékou Touré', 'Admin Projet', 'PPM', 'Marché MRC-001 — Travaux civils lot 1', 'VALIDATION', 'Validation de l\'attribution du marché MRC-001 à BATISSO.', 'INFO', '10.0.0.44', 'Chrome 121 / Windows 11'),
  h('evt-056', '2026-03-15', '10:00:00', 'Fatoumata Koné', 'Resp. Financier', 'Budget', 'Révision budgétaire T1 2026', 'MODIFICATION', 'Revue budgétaire: rééquilibrage 50 000 USD de la ligne Consultants vers Équipements.', 'AVERTISSEMENT', '10.0.0.22', 'Firefox 122 / macOS'),
  h('evt-057', '2026-03-18', '14:30:00', 'Ibrahima Souaré', 'Resp. Technique', 'Activités', 'ACT-A-001 — Forage puits P-01', 'MODIFICATION', 'Avancement 45 % → 90 % — puits P-01 quasi terminé.', 'INFO', '192.168.1.15', 'Chrome 121 / Windows 11'),
  h('evt-058', '2026-03-20', '11:15:00', 'Mariam Camara', 'Resp. S&E', 'Risques', 'Risque R-004 — Risque foncier zone sud', 'CREATION', 'Identification risque conflits fonciers pour les installations zone sud.', 'CRITIQUE', '10.0.0.31', 'Edge 121 / Windows 10'),
  h('evt-059', '2026-03-22', '09:45:00', 'Amadou Diallo', 'Coordonnateur', 'Risques', 'Risque R-004 — Risque foncier zone sud', 'MODIFICATION', 'Plan de mitigation ajouté: consultation communautaire planifiée pour avril 2026.', 'INFO', '192.168.1.10', 'Chrome 121 / Windows 11'),
  h('evt-060', '2026-03-25', '16:00:00', 'Fatoumata Koné', 'Resp. Financier', 'Rapports', 'RPT-009 — Rapport financier T1', 'CREATION', 'Génération rapport financier T1 2026 au format Excel.', 'INFO', '10.0.0.22', 'Firefox 122 / macOS'),
  h('evt-061', '2026-03-26', '10:00:00', 'Ibrahima Souaré', 'Resp. Technique', 'Activités', 'ACT-A-001 — Forage puits P-01', 'VALIDATION', 'Validation de la réception technique du puits P-01 (avancement 100 %).', 'INFO', '192.168.1.15', 'Chrome 121 / Windows 11'),
  h('evt-062', '2026-03-27', '14:00:00', 'Sékou Touré', 'Admin Projet', 'Documents', 'DOC-009 — Manuel procédures', 'CREATION', 'Dépôt du manuel de procédures administratives et financières v1.2.', 'INFO', '10.0.0.44', 'Chrome 121 / Windows 11'),
  h('evt-063', '2026-03-28', '17:00:00', 'Amadou Diallo', 'Coordonnateur', 'Rapports', 'RPT-008 — Rapport trimestriel T1', 'CREATION', 'Génération du rapport trimestriel T1 2026 bailleur IDA.', 'INFO', '192.168.1.10', 'Chrome 121 / Windows 11'),
  h('evt-064', '2026-03-30', '09:00:00', 'Mariam Camara', 'Resp. S&E', 'Livrables', 'LIV-002 — Rapport technique mensuel', 'MODIFICATION', 'Mise à jour de la date prévue: 31/03 → 10/04/2026 suite délai consolidation.', 'AVERTISSEMENT', '10.0.0.31', 'Edge 121 / Windows 10'),
  h('evt-065', '2026-03-31', '18:00:00', 'Fatoumata Koné', 'Resp. Financier', 'Projet', 'SIGP-2026', 'EXPORT', 'Export des données budgétaires T1 au format CSV pour audit.', 'INFO', '10.0.0.22', 'Firefox 122 / macOS'),

  // ── Avril 2026 ────────────────────────────────────────────────────────────

  h('evt-066', '2026-04-01', '08:00:00', 'Amadou Diallo', 'Coordonnateur', 'Projet', 'SIGP-2026', 'CONNEXION', 'Connexion début Q2 2026.', 'INFO', '192.168.1.10', 'Chrome 122 / Windows 11'),
  h('evt-067', '2026-04-02', '10:30:00', 'Sékou Touré', 'Admin Projet', 'Contrats', 'Contrat CTR-002 — BATISSO', 'MODIFICATION', 'Mise à jour avancement contractuel: 0 % → 15 %, premier état des lieux chantier.', 'INFO', '10.0.0.44', 'Chrome 122 / Windows 11'),
  h('evt-068', '2026-04-03', '09:15:00', 'Ibrahima Souaré', 'Resp. Technique', 'Activités', 'ACT-A-002 — Forage puits P-02', 'MODIFICATION', 'Avancement 20 % → 60 % — forage puits P-02 repris après interruption.', 'INFO', '192.168.1.15', 'Chrome 122 / Windows 11'),
  h('evt-069', '2026-04-04', '14:00:00', 'Fatoumata Koné', 'Resp. Financier', 'Décaissements', 'DEC-004 — 3e tranche IDA', 'CREATION', 'Enregistrement de la 3e tranche IDA, montant 350 000 USD, date 01/04/2026.', 'INFO', '10.0.0.22', 'Firefox 122 / macOS'),
  h('evt-070', '2026-04-05', '11:00:00', 'Sékou Touré', 'Admin Projet', 'Rapports', 'RPT-010 — Bailleur IDA T1', 'CREATION', 'Génération du rapport bailleur IDA T1 2026 au format Word.', 'INFO', '10.0.0.44', 'Chrome 122 / Windows 11'),
  h('evt-071', '2026-04-06', '15:30:00', 'Amadou Diallo', 'Coordonnateur', 'Documents', 'DOC-012 — DAO équipements info', 'CREATION', 'Dépôt du dossier d\'appel d\'offres pour équipements informatiques.', 'INFO', '192.168.1.10', 'Chrome 122 / Windows 11'),
  h('evt-072', '2026-04-07', '09:00:00', 'Mariam Camara', 'Resp. S&E', 'Risques', 'Risque R-004 — Risque foncier zone sud', 'MODIFICATION', 'Statut mis à jour: Critique → Modéré suite consultation communautaire réussie.', 'INFO', '10.0.0.31', 'Edge 121 / Windows 10'),
  h('evt-073', '2026-04-08', '10:00:00', 'Ibrahima Souaré', 'Resp. Technique', 'Activités', 'ACT-B-001 — Formation agents', 'MODIFICATION', 'Avancement 0 % → 30 %, premier atelier de formation réalisé (15 participants).', 'INFO', '192.168.1.15', 'Chrome 122 / Windows 11'),
  h('evt-074', '2026-04-10', '14:30:00', 'Sékou Touré', 'Admin Projet', 'PPM', 'Marché MRC-003 — Consultant S&E', 'CREATION', 'Ajout marché recrutement consultant en S&E dans le PPM 2026.', 'INFO', '10.0.0.44', 'Chrome 122 / Windows 11'),
  h('evt-075', '2026-04-12', '11:00:00', 'Amadou Diallo', 'Coordonnateur', 'Livrables', 'LIV-003 — Plan de passation marchés', 'CREATION', 'Création du livrable Plan de Passation des Marchés 2026 révisé.', 'INFO', '192.168.1.10', 'Chrome 122 / Windows 11'),
  h('evt-076', '2026-04-14', '09:30:00', 'Fatoumata Koné', 'Resp. Financier', 'Budget', 'Ligne BUD-004 — Imprévus', 'CREATION', 'Création ligne imprévus (5 % du budget total): 180 000 USD.', 'INFO', '10.0.0.22', 'Firefox 122 / macOS'),
  h('evt-077', '2026-04-15', '15:00:00', 'Mariam Camara', 'Resp. S&E', 'EVM', 'Période EVM — Mars 2026', 'CREATION', 'Saisie EVM mars 2026: PV=500 000, EV=435 000, AC=470 000, CPI=0.93, SPI=0.87.', 'AVERTISSEMENT', '10.0.0.31', 'Edge 121 / Windows 10'),
  h('evt-078', '2026-04-16', '10:00:00', 'Ibrahima Souaré', 'Resp. Technique', 'Activités', 'ACT-A-003 — Construction châteaux eau', 'MODIFICATION', 'Avancement 0 % → 25 % — fondations châteaux eau puits P-01 terminées.', 'INFO', '192.168.1.15', 'Chrome 122 / Windows 11'),
  h('evt-079', '2026-04-18', '09:00:00', 'Sékou Touré', 'Admin Projet', 'Paramètres', 'Seuil alerte budget', 'MODIFICATION', 'Seuil d\'alerte taux consommation budgétaire abaissé de 90 % à 85 %.', 'INFO', '10.0.0.44', 'Chrome 122 / Windows 11'),
  h('evt-080', '2026-04-20', '14:00:00', 'Fatoumata Koné', 'Resp. Financier', 'Documents', 'DOC-013 — Rapport financier T1', 'CREATION', 'Dépôt du rapport financier T1 2026 dans le GED (Excel, v1.0).', 'INFO', '10.0.0.22', 'Firefox 122 / macOS'),
  h('evt-081', '2026-04-22', '11:30:00', 'Amadou Diallo', 'Coordonnateur', 'Risques', 'Risque R-005 — Inflation matériaux', 'CREATION', 'Identification risque inflation coûts matériaux de construction (+12 % depuis jan).', 'CRITIQUE', '192.168.1.10', 'Chrome 122 / Windows 11'),
  h('evt-082', '2026-04-23', '09:45:00', 'Fatoumata Koné', 'Resp. Financier', 'Risques', 'Risque R-005 — Inflation matériaux', 'MODIFICATION', 'Plan mitigation: activation ligne imprévus + renégociation contrat BATISSO.', 'INFO', '10.0.0.22', 'Firefox 122 / macOS'),
  h('evt-083', '2026-04-25', '16:00:00', 'Amadou Diallo', 'Coordonnateur', 'Rapports', 'RPT-012 — Rapport mensuel avril', 'CREATION', 'Génération rapport mensuel avril 2026.', 'INFO', '192.168.1.10', 'Chrome 122 / Windows 11'),
  h('evt-084', '2026-04-28', '10:00:00', 'Sékou Touré', 'Admin Projet', 'Contrats', 'Contrat CTR-001 — SETEC', 'MODIFICATION', 'Avenant #2 signé: extension délai de 3 mois pour études zone sud.', 'AVERTISSEMENT', '10.0.0.44', 'Chrome 122 / Windows 11'),
  h('evt-085', '2026-04-29', '14:30:00', 'Mariam Camara', 'Resp. S&E', 'Livrables', 'LIV-004 — Étude d\'impact phase 2', 'CREATION', 'Création livrable étude d\'impact environnemental phase 2.', 'INFO', '10.0.0.31', 'Edge 122 / Windows 10'),
  h('evt-086', '2026-04-30', '17:00:00', 'Fatoumata Koné', 'Resp. Financier', 'Projet', 'SIGP-2026', 'DECONNEXION', 'Déconnexion fin de mois.', 'INFO', '10.0.0.22', 'Firefox 122 / macOS'),

  // ── Mai 2026 ──────────────────────────────────────────────────────────────

  h('evt-087', '2026-05-02', '08:10:00', 'Amadou Diallo', 'Coordonnateur', 'Projet', 'SIGP-2026', 'CONNEXION', 'Connexion début mai 2026.', 'INFO', '192.168.1.10', 'Chrome 123 / Windows 11'),
  h('evt-088', '2026-05-03', '09:30:00', 'Ibrahima Souaré', 'Resp. Technique', 'Activités', 'ACT-A-002 — Forage puits P-02', 'VALIDATION', 'Validation réception technique puits P-02 (forage terminé, qualité conforme).', 'INFO', '192.168.1.15', 'Chrome 123 / Windows 11'),
  h('evt-089', '2026-05-04', '11:00:00', 'Fatoumata Koné', 'Resp. Financier', 'Sources', 'Source FIN-001 — IDA', 'MODIFICATION', 'Mise à jour montant décaissé cumulé IDA: 700 000 → 950 000 USD.', 'INFO', '10.0.0.22', 'Firefox 123 / macOS'),
  h('evt-090', '2026-05-05', '14:00:00', 'Sékou Touré', 'Admin Projet', 'PPM', 'Marché MRC-001 — Travaux civils lot 1', 'MODIFICATION', 'Statut marché: Attribué → Signé après formalisation contrat BATISSO.', 'INFO', '10.0.0.44', 'Chrome 123 / Windows 11'),
  h('evt-091', '2026-05-06', '10:30:00', 'Mariam Camara', 'Resp. S&E', 'Risques', 'Risque R-001 — Délais fournisseurs', 'VALIDATION', 'Clôture du risque R-001: livraisons normalisées, risque résolu.', 'INFO', '10.0.0.31', 'Edge 122 / Windows 10'),
  h('evt-092', '2026-05-07', '15:00:00', 'Amadou Diallo', 'Coordonnateur', 'Documents', 'DOC-015 — Rapport avancement mai', 'CREATION', 'Dépôt du rapport d\'avancement mai 2026 (Word, v1.0).', 'INFO', '192.168.1.10', 'Chrome 123 / Windows 11'),
  h('evt-093', '2026-05-08', '09:00:00', 'Ibrahima Souaré', 'Resp. Technique', 'Activités', 'ACT-A-003 — Construction châteaux eau', 'MODIFICATION', 'Avancement 25 % → 55 % — armature et coulage béton châteaux eau P-01 et P-02.', 'INFO', '192.168.1.15', 'Chrome 123 / Windows 11'),
  h('evt-094', '2026-05-10', '11:00:00', 'Fatoumata Koné', 'Resp. Financier', 'Décaissements', 'DEC-005 — 4e tranche IDA', 'CREATION', 'Enregistrement de la 4e tranche IDA, montant 400 000 USD, date 08/05/2026.', 'INFO', '10.0.0.22', 'Firefox 123 / macOS'),
  h('evt-095', '2026-05-12', '14:30:00', 'Amadou Diallo', 'Coordonnateur', 'PTBA', 'PTBA-2026', 'MODIFICATION', 'Révision PTBA mi-parcours: 3 activités reportées au S2, 2 nouvelles activités ajoutées.', 'AVERTISSEMENT', '192.168.1.10', 'Chrome 123 / Windows 11'),
  h('evt-096', '2026-05-13', '10:00:00', 'Sékou Touré', 'Admin Projet', 'Contrats', 'Contrat CTR-003 — Consultant RH', 'CREATION', 'Enregistrement contrat consultant renforcement capacités humaines, 85 000 USD.', 'INFO', '10.0.0.44', 'Chrome 123 / Windows 11'),
  h('evt-097', '2026-05-14', '09:15:00', 'Mariam Camara', 'Resp. S&E', 'Documents', 'DOC-016 — Rapport audit mi-parcours', 'CREATION', 'Dépôt du rapport d\'audit interne mi-parcours 2026 (PDF, v1.0).', 'INFO', '10.0.0.31', 'Edge 122 / Windows 10'),
  h('evt-098', '2026-05-15', '15:30:00', 'Ibrahima Souaré', 'Resp. Technique', 'Activités', 'ACT-B-001 — Formation agents', 'MODIFICATION', 'Avancement 30 % → 65 % — 2e et 3e ateliers réalisés, 35 agents formés.', 'INFO', '192.168.1.15', 'Chrome 123 / Windows 11'),
  h('evt-099', '2026-05-18', '10:00:00', 'Amadou Diallo', 'Coordonnateur', 'Risques', 'Risque R-005 — Inflation matériaux', 'MODIFICATION', 'Avenant BATISSO signé (+8 % montant), risque partiellement couvert.', 'AVERTISSEMENT', '192.168.1.10', 'Chrome 123 / Windows 11'),
  h('evt-100', '2026-05-20', '14:00:00', 'Fatoumata Koné', 'Resp. Financier', 'EVM', 'Période EVM — Avril 2026', 'CREATION', 'Saisie EVM avril 2026: CPI=0.91, SPI=0.88, EAC=5 320 000 USD.', 'AVERTISSEMENT', '10.0.0.22', 'Firefox 123 / macOS'),
  h('evt-101', '2026-05-20', '14:30:00', 'Fatoumata Koné', 'Resp. Financier', 'Rapports', 'RPT-013 — EVM T2 intermédiaire', 'CREATION', 'Génération rapport EVM intermédiaire T2 2026 au format PDF.', 'INFO', '10.0.0.22', 'Firefox 123 / macOS'),
  h('evt-102', '2026-05-21', '09:00:00', 'Sékou Touré', 'Admin Projet', 'Paramètres', 'Utilisateur — Mariam Camara', 'MODIFICATION', 'Extension des droits de Mariam Camara: accès export données EVM activé.', 'INFO', '10.0.0.44', 'Chrome 123 / Windows 11'),
  h('evt-103', '2026-05-22', '11:00:00', 'Amadou Diallo', 'Coordonnateur', 'Documents', 'DOC-018 — CR réunion bailleur', 'CREATION', 'Dépôt du compte-rendu réunion de supervision IDA du 22/05/2026.', 'INFO', '192.168.1.10', 'Chrome 123 / Windows 11'),
  h('evt-104', '2026-05-22', '16:00:00', 'Amadou Diallo', 'Coordonnateur', 'Documents', 'DOC-018 — CR réunion bailleur', 'VALIDATION', 'Validation du CR réunion bailleur après revue du Coordonnateur.', 'INFO', '192.168.1.10', 'Chrome 123 / Windows 11'),
  h('evt-105', '2026-05-25', '10:30:00', 'Mariam Camara', 'Resp. S&E', 'Livrables', 'LIV-005 — Rapport supervision mi-parcours', 'CREATION', 'Création du livrable rapport de supervision mi-parcours, échéance 30/06.', 'INFO', '10.0.0.31', 'Edge 122 / Windows 10'),
  h('evt-106', '2026-05-28', '09:00:00', 'Ibrahima Souaré', 'Resp. Technique', 'Rapports', 'RPT-017 — Avancement T2', 'CREATION', 'Génération rapport d\'avancement T2 2026 version préliminaire au format Word.', 'INFO', '192.168.1.15', 'Chrome 123 / Windows 11'),
  h('evt-107', '2026-05-29', '14:00:00', 'Fatoumata Koné', 'Resp. Financier', 'Budget', 'Ligne BUD-004 — Imprévus', 'MODIFICATION', 'Utilisation partielle ligne imprévus: 60 000 USD alloués à l\'avenant BATISSO.', 'AVERTISSEMENT', '10.0.0.22', 'Firefox 123 / macOS'),
  h('evt-108', '2026-05-30', '15:30:00', 'Amadou Diallo', 'Coordonnateur', 'Rapports', 'RPT-014 — Rapport mensuel mai', 'CREATION', 'Génération du rapport mensuel mai 2026 au format PDF.', 'INFO', '192.168.1.10', 'Chrome 123 / Windows 11'),
  h('evt-109', '2026-05-30', '16:00:00', 'Sékou Touré', 'Admin Projet', 'Projet', 'SIGP-2026', 'IMPORT', 'Import du fichier de mise à jour des données WBS depuis fichier Excel.', 'INFO', '10.0.0.44', 'Chrome 123 / Windows 11'),
  h('evt-110', '2026-05-31', '18:00:00', 'Mariam Camara', 'Resp. S&E', 'Projet', 'SIGP-2026', 'DECONNEXION', 'Déconnexion fin mai 2026.', 'INFO', '10.0.0.31', 'Edge 122 / Windows 10'),

  // ── Juin 2026 ─────────────────────────────────────────────────────────────

  h('evt-111', '2026-06-01', '08:00:00', 'Amadou Diallo', 'Coordonnateur', 'Projet', 'SIGP-2026', 'CONNEXION', 'Connexion début juin 2026.', 'INFO', '192.168.1.10', 'Chrome 124 / Windows 11'),
  h('evt-112', '2026-06-02', '09:00:00', 'Ibrahima Souaré', 'Resp. Technique', 'Activités', 'ACT-A-003 — Construction châteaux eau', 'MODIFICATION', 'Avancement 55 % → 80 % — pose toiture et équipements hydrauliques.', 'INFO', '192.168.1.15', 'Chrome 124 / Windows 11'),
  h('evt-113', '2026-06-03', '10:30:00', 'Fatoumata Koné', 'Resp. Financier', 'Sources', 'Source FIN-001 — IDA', 'MODIFICATION', 'Révision plafond IDA accordée en réunion bailleur: +500 000 USD (avenant IDA-3).', 'AVERTISSEMENT', '10.0.0.22', 'Firefox 124 / macOS'),
  h('evt-114', '2026-06-04', '11:00:00', 'Sékou Touré', 'Admin Projet', 'PPM', 'Marché MRC-002 — Équipements info', 'MODIFICATION', 'Statut marché: Planifié → Lancé suite publication DAO informatique.', 'INFO', '10.0.0.44', 'Chrome 124 / Windows 11'),
  h('evt-115', '2026-06-05', '14:00:00', 'Mariam Camara', 'Resp. S&E', 'Risques', 'Risque R-006 — Capacité UCP', 'CREATION', 'Identification risque de surcharge de l\'Unité de Coordination du Projet.', 'AVERTISSEMENT', '10.0.0.31', 'Edge 122 / Windows 10'),
  h('evt-116', '2026-06-06', '10:00:00', 'Amadou Diallo', 'Coordonnateur', 'Livrables', 'LIV-001 — Rapport démarrage', 'TELECHARGEMENT', 'Téléchargement du rapport de démarrage validé pour envoi au bailleur.', 'INFO', '192.168.1.10', 'Chrome 124 / Windows 11'),
  h('evt-117', '2026-06-07', '11:30:00', 'Ibrahima Souaré', 'Resp. Technique', 'Activités', 'ACT-B-001 — Formation agents', 'MODIFICATION', 'Avancement 65 % → 100 % — 4e et dernier atelier terminé, 60 agents formés au total.', 'INFO', '192.168.1.15', 'Chrome 124 / Windows 11'),
  h('evt-118', '2026-06-07', '12:00:00', 'Ibrahima Souaré', 'Resp. Technique', 'Activités', 'ACT-B-001 — Formation agents', 'VALIDATION', 'Validation de la réception définitive de l\'activité ACT-B-001.', 'INFO', '192.168.1.15', 'Chrome 124 / Windows 11'),
  h('evt-119', '2026-06-08', '09:30:00', 'Fatoumata Koné', 'Resp. Financier', 'Décaissements', 'DEC-006 — 5e tranche IDA', 'CREATION', 'Enregistrement de la 5e tranche IDA, montant 500 000 USD, date 06/06/2026.', 'INFO', '10.0.0.22', 'Firefox 124 / macOS'),
  h('evt-120', '2026-06-09', '10:00:00', 'Sékou Touré', 'Admin Projet', 'Contrats', 'Contrat CTR-002 — BATISSO', 'MODIFICATION', 'Avancement contractuel 15 % → 40 % — décompte mensuel #3 approuvé.', 'INFO', '10.0.0.44', 'Chrome 124 / Windows 11'),
  h('evt-121', '2026-06-10', '14:30:00', 'Amadou Diallo', 'Coordonnateur', 'Paramètres', 'Paramètres notifications', 'MODIFICATION', 'Activation des notifications automatiques pour les risques de niveau Critique.', 'INFO', '192.168.1.10', 'Chrome 124 / Windows 11'),
  h('evt-122', '2026-06-11', '09:00:00', 'Mariam Camara', 'Resp. S&E', 'EVM', 'Période EVM — Mai 2026', 'CREATION', 'Saisie EVM mai 2026: CPI=0.93, SPI=0.90, tendance légèrement améliorée.', 'INFO', '10.0.0.31', 'Edge 123 / Windows 10'),
  h('evt-123', '2026-06-12', '11:00:00', 'Ibrahima Souaré', 'Resp. Technique', 'Documents', 'DOC-019 — Rapport T2 brouillon', 'CREATION', 'Dépôt de la version brouillon du rapport trimestriel T2 2026 (Word, v0.5).', 'INFO', '192.168.1.15', 'Chrome 124 / Windows 11'),
  h('evt-124', '2026-06-13', '10:00:00', 'Amadou Diallo', 'Coordonnateur', 'Livrables', 'LIV-003 — Plan de passation marchés', 'VALIDATION', 'Validation du plan de passation des marchés 2026 révisé.', 'INFO', '192.168.1.10', 'Chrome 124 / Windows 11'),
  h('evt-125', '2026-06-14', '14:00:00', 'Fatoumata Koné', 'Resp. Financier', 'Budget', 'Budget global 2026', 'MODIFICATION', 'Intégration de l\'avenant IDA-3: budget total révisé de 5 000 000 → 5 500 000 USD.', 'CRITIQUE', '10.0.0.22', 'Firefox 124 / macOS'),
  h('evt-126', '2026-06-15', '09:00:00', 'Amadou Diallo', 'Coordonnateur', 'Rapports', 'RPT-022 — PTBA S1 2026', 'ARCHIVAGE', 'Archivage du rapport PTBA S1 2026 après révision du PTBA.', 'INFO', '192.168.1.10', 'Chrome 124 / Windows 11'),
  h('evt-127', '2026-06-16', '10:30:00', 'Sékou Touré', 'Admin Projet', 'PPM', 'Marché MRC-003 — Consultant S&E', 'VALIDATION', 'Validation de l\'attribution du marché consultant S&E (offre retenue).', 'INFO', '10.0.0.44', 'Chrome 124 / Windows 11'),
  h('evt-128', '2026-06-17', '15:00:00', 'Mariam Camara', 'Resp. S&E', 'Risques', 'Risque R-003 — Retards météo', 'MODIFICATION', 'Saison des pluies moins impactante que prévu — niveau dégradé à Faible.', 'INFO', '10.0.0.31', 'Edge 123 / Windows 10'),
  h('evt-129', '2026-06-18', '09:00:00', 'Ibrahima Souaré', 'Resp. Technique', 'Activités', 'ACT-C-001 — Pistes rurales zone sud', 'CREATION', 'Création de la nouvelle activité pistes rurales zone sud (ajoutée en révision PTBA).', 'INFO', '192.168.1.15', 'Chrome 124 / Windows 11'),
  h('evt-130', '2026-06-19', '10:00:00', 'Fatoumata Koné', 'Resp. Financier', 'Sources', 'Source FIN-003 — Cofinancement AFD', 'CREATION', 'Enregistrement nouvelle source cofinancement AFD suite accord de juin 2026.', 'INFO', '10.0.0.22', 'Firefox 124 / macOS'),
  h('evt-131', '2026-06-20', '14:00:00', 'Sékou Touré', 'Admin Projet', 'Décaissements', 'DEC-007 — AFD tranche initiale', 'CREATION', 'Enregistrement premier décaissement AFD, montant 200 000 EUR.', 'INFO', '10.0.0.44', 'Chrome 124 / Windows 11'),
  h('evt-132', '2026-06-21', '11:30:00', 'Amadou Diallo', 'Coordonnateur', 'Risques', 'Risque R-007 — Gouvernance locale', 'CREATION', 'Identification risque gouvernance: rotation des autorités locales avant élections.', 'CRITIQUE', '192.168.1.10', 'Chrome 124 / Windows 11'),
  h('evt-133', '2026-06-22', '09:00:00', 'Mariam Camara', 'Resp. S&E', 'Documents', 'DOC-016 — Rapport audit mi-parcours', 'VALIDATION', 'Validation du rapport d\'audit mi-parcours après revue du Coordonnateur.', 'INFO', '10.0.0.31', 'Edge 123 / Windows 10'),
  h('evt-134', '2026-06-23', '10:00:00', 'Ibrahima Souaré', 'Resp. Technique', 'Activités', 'ACT-A-003 — Construction châteaux eau', 'VALIDATION', 'Validation réception provisoire châteaux eau P-01 et P-02 (travaux conformes).', 'INFO', '192.168.1.15', 'Chrome 124 / Windows 11'),
  h('evt-135', '2026-06-24', '14:30:00', 'Fatoumata Koné', 'Resp. Financier', 'Rapports', 'RPT-020 — Rapport financier T2', 'CREATION', 'Génération rapport financier T2 2026 au format Excel.', 'INFO', '10.0.0.22', 'Firefox 124 / macOS'),
  h('evt-136', '2026-06-25', '10:00:00', 'Sékou Touré', 'Admin Projet', 'Rapports', 'RPT-021 — Bailleur IDA T2', 'CREATION', 'Génération du rapport bailleur IDA T2 2026 au format Word.', 'INFO', '10.0.0.44', 'Chrome 124 / Windows 11'),
  h('evt-137', '2026-06-25', '15:00:00', 'Amadou Diallo', 'Coordonnateur', 'Documents', 'DOC-021 — Photos chantier zone sud', 'CREATION', 'Dépôt de l\'archive photographique chantier zone sud (ZIP, 39 Mo).', 'INFO', '192.168.1.10', 'Chrome 124 / Windows 11'),
  h('evt-138', '2026-06-26', '09:00:00', 'Mariam Camara', 'Resp. S&E', 'Livrables', 'LIV-005 — Rapport supervision mi-parcours', 'MODIFICATION', 'Avancement livrable 0 % → 80 %, revue en cours avec l\'équipe IDA.', 'INFO', '10.0.0.31', 'Edge 123 / Windows 10'),
  h('evt-139', '2026-06-27', '10:30:00', 'Ibrahima Souaré', 'Resp. Technique', 'Contrats', 'Contrat CTR-002 — BATISSO', 'MODIFICATION', 'Décompte #4 approuvé — avancement contractuel 40 % → 60 %.', 'INFO', '192.168.1.15', 'Chrome 124 / Windows 11'),
  h('evt-140', '2026-06-28', '08:15:05', 'Amadou Diallo', 'Coordonnateur', 'Projet', 'SIGP-2026', 'CONNEXION', 'Connexion au système — début de journée de travail.', 'INFO', '192.168.1.10', 'Chrome 124 / Windows 11'),
  h('evt-141', '2026-06-28', '09:00:00', 'Fatoumata Koné', 'Resp. Financier', 'Décaissements', 'DEC-008 — 6e tranche IDA', 'CREATION', 'Enregistrement de la 6e tranche IDA, montant 380 000 USD, date 27/06/2026.', 'INFO', '10.0.0.22', 'Firefox 124 / macOS'),
  h('evt-142', '2026-06-28', '10:00:00', 'Mariam Camara', 'Resp. S&E', 'EVM', 'Période EVM — Juin 2026', 'CREATION', 'Saisie EVM juin 2026: CPI=0.95, SPI=0.92, amélioration notable vs T1.', 'INFO', '10.0.0.31', 'Edge 123 / Windows 10'),
  h('evt-143', '2026-06-28', '11:30:00', 'Sékou Touré', 'Admin Projet', 'Rapports', 'RPT-018 — Rapport mensuel juin', 'CREATION', 'Initiation du rapport mensuel juin 2026 (en cours de rédaction).', 'INFO', '10.0.0.44', 'Chrome 124 / Windows 11'),
  h('evt-144', '2026-06-28', '14:00:00', 'Amadou Diallo', 'Coordonnateur', 'Documents', 'DOC-022 — Plan correctif Q3 2026', 'CREATION', 'Dépôt du plan d\'action correctif Q3 2026 (Excel, v0.7).', 'INFO', '192.168.1.10', 'Chrome 124 / Windows 11'),
  h('evt-145', '2026-06-28', '15:00:00', 'Fatoumata Koné', 'Resp. Financier', 'Rapports', 'RPT-015 — Rapport financier mai', 'REJET', 'Rejet du rapport financier mai 2026 — données décaissements incomplètes à corriger.', 'CRITIQUE', '10.0.0.22', 'Firefox 124 / macOS'),
  h('evt-146', '2026-06-28', '15:30:00', 'Amadou Diallo', 'Coordonnateur', 'Risques', 'Risque R-007 — Gouvernance locale', 'MODIFICATION', 'Plan de mitigation ajouté: implication des autorités nationales dans le processus.', 'INFO', '192.168.1.10', 'Chrome 124 / Windows 11'),
  h('evt-147', '2026-06-28', '16:00:00', 'Ibrahima Souaré', 'Resp. Technique', 'Documents', 'DOC-019 — Rapport T2 brouillon', 'SUPPRESSION', 'Suppression de la version brouillon v0.5 remplacée par la version v1.0.', 'AVERTISSEMENT', '192.168.1.15', 'Chrome 124 / Windows 11'),
  h('evt-148', '2026-06-28', '16:30:00', 'Mariam Camara', 'Resp. S&E', 'Livrables', 'LIV-005 — Rapport supervision mi-parcours', 'VALIDATION', 'Validation finale du rapport de supervision mi-parcours — livrable clôturé.', 'INFO', '10.0.0.31', 'Edge 123 / Windows 10'),
  h('evt-149', '2026-06-28', '17:00:00', 'Sékou Touré', 'Admin Projet', 'Projet', 'Registre exports', 'EXPORT', 'Export global de l\'historique des opérations au format CSV pour archivage.', 'INFO', '10.0.0.44', 'Chrome 124 / Windows 11'),
  h('evt-150', '2026-06-28', '17:30:00', 'Amadou Diallo', 'Coordonnateur', 'Rapports', 'RPT-019 — Rapport trimestriel T2', 'CREATION', 'Initialisation du rapport trimestriel T2 2026 — consolidation en cours.', 'INFO', '192.168.1.10', 'Chrome 124 / Windows 11'),
];

// ─── Legacy types — used by src/components/project/ProjectHistoryTab.tsx ──────

export type HistoryModule =
  | 'Informations générales' | 'Budget' | 'Activités'
  | 'Gouvernance' | 'Livrables' | 'Risques' | 'Décaissements';

export interface HistoryEntry {
  id: string;
  version: string;
  date: string;
  auteur: string;
  initialesAuteur: string;
  module: HistoryModule;
  champ: string;
  modification: string;
  ancienneValeur: string;
  nouvelleValeur: string;
}

export const mockHistoryEntries: HistoryEntry[] = [
  { id: 'h1',  version: 'v3.4', date: '2026-06-28', auteur: 'Amadou Diallo',   initialesAuteur: 'AD', module: 'Budget',                  champ: 'Budget composante C',           modification: 'Révision budgétaire suite avenant contractuel',              ancienneValeur: '1 250 000 USD',      nouvelleValeur: '1 380 000 USD'              },
  { id: 'h2',  version: 'v3.3', date: '2026-06-27', auteur: 'Fatoumata Moussa',initialesAuteur: 'FM', module: 'Livrables',                champ: 'Statut livrable LIV-004',       modification: 'Validation du SGB par le comité technique',                  ancienneValeur: 'En cours',           nouvelleValeur: 'Validé'                     },
  { id: 'h3',  version: 'v3.2', date: '2026-06-25', auteur: 'Rabiou Hamidou',  initialesAuteur: 'RH', module: 'Activités',                champ: 'Avancement ACT-B-001',          modification: 'Clôture formation suite dernier atelier',                    ancienneValeur: '85%',                nouvelleValeur: '100%'                       },
  { id: 'h4',  version: 'v3.1', date: '2026-06-24', auteur: 'Aïchata Koné',    initialesAuteur: 'AK', module: 'Risques',                  champ: 'Probabilité risque R-007',      modification: 'Réévaluation suite retards constatés livraisons lot 2',      ancienneValeur: 'Faible',             nouvelleValeur: 'Élevée'                     },
  { id: 'h5',  version: 'v3.0', date: '2026-06-22', auteur: 'Boubacar Issa',   initialesAuteur: 'BI', module: 'Activités',                champ: 'Date fin ACT-C-004',            modification: 'Report pour conditions météorologiques défavorables',         ancienneValeur: '30/09/2025',         nouvelleValeur: '30/11/2025'                 },
  { id: 'h6',  version: 'v2.9', date: '2026-06-20', auteur: 'Amadou Diallo',   initialesAuteur: 'AD', module: 'Décaissements',            champ: 'Statut décaissement DEC-003',   modification: 'Mise à jour suite réception du virement BM',                 ancienneValeur: 'En retard',          nouvelleValeur: 'Reçu'                       },
  { id: 'h7',  version: 'v2.8', date: '2026-06-18', auteur: 'Fatoumata Moussa',initialesAuteur: 'FM', module: 'Gouvernance',              champ: 'Membre équipe — Dr. Issoufou', modification: 'Recrutement expert technique spécialisé eau-assainissement', ancienneValeur: '—',                  nouvelleValeur: 'Expert Technique'           },
  { id: 'h8',  version: 'v2.7', date: '2026-06-15', auteur: 'Salif Traoré',    initialesAuteur: 'ST', module: 'Activités',                champ: 'Statut ACT-C-003',              modification: 'Blocage constaté — retard fournisseur panneaux lot 2',       ancienneValeur: 'En cours',           nouvelleValeur: 'En retard'                  },
  { id: 'h9',  version: 'v2.6', date: '2026-06-10', auteur: 'Amadou Diallo',   initialesAuteur: 'AD', module: 'Informations générales',   champ: 'Coordinateur projet',           modification: 'Changement de coordinateur suite départ en retraite',        ancienneValeur: 'Ibrahim Mahamadou',  nouvelleValeur: 'Amadou Diallo'              },
  { id: 'h10', version: 'v2.5', date: '2026-05-30', auteur: 'Aïchata Koné',    initialesAuteur: 'AK', module: 'Budget',                  champ: 'Taux de change EUR/USD',        modification: 'Actualisation taux conversion pour reporting Q2',             ancienneValeur: '1 EUR = 1.08 USD',   nouvelleValeur: '1 EUR = 1.12 USD'           },
  { id: 'h11', version: 'v2.4', date: '2026-05-15', auteur: 'Rabiou Hamidou',  initialesAuteur: 'RH', module: 'Livrables',                champ: 'Responsable livrable LIV-007',  modification: 'Transfert de responsabilité pour revue mi-parcours',          ancienneValeur: 'Aïchata Koné',       nouvelleValeur: 'Amadou Diallo'              },
  { id: 'h12', version: 'v2.3', date: '2026-04-20', auteur: 'Boubacar Issa',   initialesAuteur: 'BI', module: 'Informations générales',   champ: 'Date fin projet',               modification: "Extension de durée accordée (avenant #3)",                    ancienneValeur: '31/12/2026',         nouvelleValeur: '30/06/2027'                 },
];
