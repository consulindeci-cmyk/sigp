export interface DocumentMock {
  id: string;
  nom: string;
  type: string;
  taille_ko: number;
  projet_nom?: string;
  cree_par: string;
  cree_le: string;
  url: string;
}

export const mockDocuments: DocumentMock[] = [
  {
    id: 'doc-001',
    nom: 'Rapport de démarrage du projet.pdf',
    type: 'PDF',
    taille_ko: 2048,
    projet_nom: 'Projet SIGP Phase 1',
    cree_par: 'Jean Dupont',
    cree_le: '2026-01-15T10:00:00Z',
    url: '#',
  },
  {
    id: 'doc-002',
    nom: 'PTBA 2026 v1.1 — Budget Détaillé.xlsx',
    type: 'XLSX',
    taille_ko: 512,
    projet_nom: 'Projet SIGP Phase 1',
    cree_par: 'Marie Curie',
    cree_le: '2026-02-10T14:30:00Z',
    url: '#',
  },
  {
    id: 'doc-003',
    nom: 'Rapport Trimestriel T1 2026.pdf',
    type: 'PDF',
    taille_ko: 3584,
    projet_nom: 'Projet SIGP Phase 1',
    cree_par: 'Alice Martin',
    cree_le: '2026-04-05T09:00:00Z',
    url: '#',
  },
  {
    id: 'doc-004',
    nom: 'Plan de Passation des Marchés 2026.pdf',
    type: 'PDF',
    taille_ko: 1280,
    projet_nom: 'Projet SIGP Phase 1',
    cree_par: 'Paul Koffi',
    cree_le: '2026-01-20T11:00:00Z',
    url: '#',
  },
  {
    id: 'doc-005',
    nom: 'Contrat CTR-2026-001 — Serveurs Datacenter.pdf',
    type: 'PDF',
    taille_ko: 4096,
    projet_nom: 'Projet SIGP Phase 1',
    cree_par: 'Jean Dupont',
    cree_le: '2026-01-15T16:45:00Z',
    url: '#',
  },
  {
    id: 'doc-006',
    nom: 'Études de faisabilité — Bâtiment A.docx',
    type: 'DOCX',
    taille_ko: 890,
    projet_nom: 'Projet SIGP Phase 2',
    cree_par: 'Sophie Bernard',
    cree_le: '2025-12-01T08:30:00Z',
    url: '#',
  },
  {
    id: 'doc-007',
    nom: 'Procès-verbal de réception provisoire CTR-2026-003.pdf',
    type: 'PDF',
    taille_ko: 768,
    projet_nom: 'Projet SIGP Phase 1',
    cree_par: 'Alice Martin',
    cree_le: '2026-06-10T15:00:00Z',
    url: '#',
  },
];
