import { useState, useEffect, useCallback } from 'react';
import { PPMVersion, StatutPPM } from '@/types';
import type { WorkflowLogEntry } from '@/components/common/workflow/WorkflowLogTable';
import type { TimelineStep } from '@/components/common/workflow/WorkflowTimeline';

// Mock mutable store de versions
let mockVersionsStore: PPMVersion[] = [
  {
    id: 'ppm-v1.0',
    projet_id: 'proj-1',
    numero_version: 'V1.0',
    statut: 'APPROUVE',
    date_creation: '2026-01-15T10:00:00Z',
    date_approbation: '2026-02-01T14:30:00Z',
    cree_par: 'Jean Dupont',
    approuve_par: 'Banque Mondiale',
    budget_version_reference: 'budg-v1.0',
    lignes: []
  },
  {
    id: 'ppm-v1.1',
    projet_id: 'proj-1',
    numero_version: 'V1.1',
    statut: 'BROUILLON',
    date_creation: '2026-06-10T09:15:00Z',
    cree_par: 'Marie Curie',
    budget_version_reference: 'budg-v1.1',
    lignes: []
  }
];

// Mock mutable store de logs de workflow, clé = versionId
let mockWorkflowLogs: Record<string, WorkflowLogEntry[]> = {
  'ppm-v1.0': [
    {
      id: 'log-1',
      utilisateur: 'Jean Dupont',
      role: 'Responsable des Achats',
      action: 'Création de la version',
      date: '2026-01-15T10:00:00Z',
      statut_nouveau: 'BROUILLON',
    },
    {
      id: 'log-2',
      utilisateur: 'Jean Dupont',
      role: 'Responsable des Achats',
      action: 'Soumission pour approbation',
      date: '2026-01-20T14:00:00Z',
      statut_precedent: 'BROUILLON',
      statut_nouveau: 'SOUMIS',
    },
    {
      id: 'log-3',
      utilisateur: 'Banque Mondiale',
      role: 'Bailleur / ANO',
      action: 'Approbation Bailleur (ANO)',
      commentaire: 'Plan conforme aux procédures. Approuvé sans réserve.',
      date: '2026-02-01T14:30:00Z',
      statut_precedent: 'VALIDATION_BAILLEUR',
      statut_nouveau: 'APPROUVE',
    },
  ],
  'ppm-v1.1': [
    {
      id: 'log-4',
      utilisateur: 'Marie Curie',
      role: 'Coordinateur de Projet',
      action: 'Création de la version révisée',
      date: '2026-06-10T09:15:00Z',
      statut_nouveau: 'BROUILLON',
    },
  ],
};

/**
 * Convertit le statut d'une PPMVersion en étapes pour le WorkflowTimeline.
 * Cette logique de mapping est centralisée ici (dans la couche Hook/Service) et non dans l'UI.
 */
export function buildWorkflowSteps(statut: StatutPPM, version: PPMVersion): TimelineStep[] {
  const steps: Array<{ id: string; label: string; targetStatuts: StatutPPM[] }> = [
    { id: 'creation', label: 'Création (Brouillon)', targetStatuts: ['BROUILLON'] },
    { id: 'soumis', label: 'Soumission pour revue interne', targetStatuts: ['SOUMIS'] },
    { id: 'validation_n1', label: 'Validation Interne (N1)', targetStatuts: ['VALIDATION_N1'] },
    { id: 'validation_bailleur', label: "Avis de Non-Objection (Bailleur)", targetStatuts: ['VALIDATION_BAILLEUR'] },
    { id: 'approuve', label: 'Approbation Finale', targetStatuts: ['APPROUVE'] },
  ];

  const statutOrder: StatutPPM[] = ['BROUILLON', 'SOUMIS', 'VALIDATION_N1', 'VALIDATION_BAILLEUR', 'APPROUVE', 'CLOTURE'];
  const currentIndex = statutOrder.indexOf(statut);

  if (statut === 'CLOTURE') {
    return steps.map(s => ({ id: s.id, label: s.label, status: 'COMPLETED' as const }));
  }

  return steps.map((s, i) => {
    const stepStatut = statutOrder[i];
    const stepIndex = statutOrder.indexOf(stepStatut);

    let status: TimelineStep['status'] = 'PENDING';
    if (stepIndex < currentIndex) status = 'COMPLETED';
    else if (stepIndex === currentIndex) status = 'CURRENT';

    // Chercher un log correspondant pour enrichir l'étape (compatible ES2020)
    const logs = mockWorkflowLogs[version.id] || [];
    const matchingLog = [...logs].reverse().find((l: WorkflowLogEntry) => l.statut_nouveau === stepStatut);

    return {
      id: s.id,
      label: s.label,
      status,
      date: matchingLog?.date,
      user: matchingLog?.utilisateur,
      role: matchingLog?.role,
      comment: matchingLog?.commentaire,
    };
  });
}

/**
 * Actions de workflow possibles selon le statut courant.
 */
export type WorkflowAction = 'SOUMETTRE' | 'VALIDER_N1' | 'DEMANDER_ANO' | 'APPROUVER' | 'REJETER' | 'CLOTURER';

export function getAvailableActions(statut: StatutPPM): WorkflowAction[] {
  switch (statut) {
    case 'BROUILLON': return ['SOUMETTRE'];
    case 'SOUMIS': return ['VALIDER_N1', 'REJETER'];
    case 'VALIDATION_N1': return ['DEMANDER_ANO', 'REJETER'];
    case 'VALIDATION_BAILLEUR': return ['APPROUVER', 'REJETER'];
    case 'APPROUVE': return ['CLOTURER'];
    default: return [];
  }
}

export function usePPMVersions() {
  const [versions, setVersions] = useState<PPMVersion[]>([]);
  const [activeVersionId, setActiveVersionId] = useState<string>('ppm-v1.1');
  const [isLoading, setIsLoading] = useState(true);

  const fetchVersions = useCallback(() => {
    setTimeout(() => {
      setVersions([...mockVersionsStore]);
      setIsLoading(false);
    }, 300);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchVersions();
  }, [fetchVersions]);

  /**
   * Exécute une action de workflow sur une version du PPM.
   * La transition d'état est validée ici (dans la couche Hook), pas dans le composant UI.
   */
  const executeWorkflowAction = useCallback(async (
    versionId: string,
    action: WorkflowAction,
    payload: { utilisateur: string; role: string; commentaire?: string }
  ) => {
    // Simule latence API
    await new Promise(resolve => setTimeout(resolve, 500));

    const version = mockVersionsStore.find(v => v.id === versionId);
    if (!version) throw new Error('Version introuvable');

    const transitionMap: Partial<Record<WorkflowAction, StatutPPM>> = {
      'SOUMETTRE': 'SOUMIS',
      'VALIDER_N1': 'VALIDATION_N1',
      'DEMANDER_ANO': 'VALIDATION_BAILLEUR',
      'APPROUVER': 'APPROUVE',
      'CLOTURER': 'CLOTURE',
    };

    const actionLabels: Partial<Record<WorkflowAction, string>> = {
      'SOUMETTRE': 'Soumission pour revue',
      'VALIDER_N1': 'Validation Interne N1',
      'DEMANDER_ANO': "Envoi pour ANO Bailleur",
      'APPROUVER': 'Approbation Finale',
      'CLOTURER': 'Clôture du PPM',
      'REJETER': 'Rejet et renvoi en brouillon',
    };

    const previousStatut = version.statut;
    let newStatut: StatutPPM = action === 'REJETER' ? 'BROUILLON' : (transitionMap[action] || version.statut);

    // Mettre à jour le store de versions
    mockVersionsStore = mockVersionsStore.map(v =>
      v.id === versionId
        ? {
            ...v,
            statut: newStatut,
            date_approbation: action === 'APPROUVER' ? new Date().toISOString() : v.date_approbation,
            approuve_par: action === 'APPROUVER' ? payload.utilisateur : v.approuve_par,
          }
        : v
    );

    // Ajouter une entrée au journal d'audit
    const newLog: WorkflowLogEntry = {
      id: `log-${Date.now()}`,
      utilisateur: payload.utilisateur,
      role: payload.role,
      action: actionLabels[action] || action,
      commentaire: payload.commentaire,
      date: new Date().toISOString(),
      statut_precedent: previousStatut,
      statut_nouveau: newStatut,
    };

    mockWorkflowLogs[versionId] = [...(mockWorkflowLogs[versionId] || []), newLog];

    fetchVersions();
  }, [fetchVersions]);

  const getWorkflowLogs = useCallback((versionId: string): WorkflowLogEntry[] => {
    return mockWorkflowLogs[versionId] || [];
  }, []);

  return {
    versions,
    activeVersionId,
    setActiveVersionId,
    isLoading,
    executeWorkflowAction,
    getWorkflowLogs,
    buildWorkflowSteps,
    getAvailableActions,
  };
}

