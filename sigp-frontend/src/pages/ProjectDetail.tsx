import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useUIStore } from '@/stores/uiStore';
import ProjectHeader from '../components/project/layout/ProjectHeader';

// Full-height tabs (manage their own layout, header and scroll)
import PTBAPage from './project/PTBAPage';
import LogframePage from './project/LogframePage';
import BudgetPage from './project/BudgetPage';
import PPMPage from './project/PPMPage';
import ProjectSettingsPage from './project/ProjectSettingsPage';

// Natural-flow tabs (padded by ProjectDetail, scroll via parent)
import { Loader } from '@/components/ui/feedback/Loader';
import WBSPage from './project/WBSPage';
import TabOverview from '../components/project/TabOverview';
import TabEVM from '../components/project/TabEVM';
import TabRisks from '../components/project/TabRisks';
import ProjectGovernanceTab from '../components/project/ProjectGovernanceTab';
import ProjectFundingTab from '../components/project/ProjectFundingTab';
import ProjectDisbursementTab from '../components/project/ProjectDisbursementTab';
import TabHistory from '../components/project/TabHistory';

import { useProject, useProjectSummary, useProjectRowAggregation, useUpdateProject } from '@/hooks/useProjects';
import { adaptProjectDto, type Project, type UpdateProjectPayload } from '@/lib/projectAdapter';

const PAD = 'px-4 sm:px-6 lg:px-8 py-6';
const INNER = 'mx-auto w-full max-w-layout';


export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { activeProjectTab, setActiveProjectTab, setActiveProject } = useUIStore();
  const prevIdRef = useRef<string | undefined>(undefined);

  const { data: apiProject, isLoading } = useProject(id ?? '');
  const { data: summary } = useProjectSummary(id ?? '');
  const { data: rowAgg } = useProjectRowAggregation(id ?? '');
  const updateProjectMutation = useUpdateProject();
  const [updateError, setUpdateError] = useState<string | null>(null);

  const project: Project | undefined = useMemo(() => {
    if (!apiProject) return undefined;
    return {
      ...adaptProjectDto(apiProject),
      progressScore: summary?.progressScore ?? 0,
      tauxDecaissement: summary?.tauxDecaissement ?? 0,
      profileScore: summary?.profileScore ?? 0,
      composantes: rowAgg?.composantes ?? 0,
      activites: rowAgg?.activites ?? 0,
    };
  }, [apiProject, summary, rowAgg]);

  // Set default tab on load and reset when navigating to a different project
  useEffect(() => {
    if (id !== prevIdRef.current) {
      setActiveProjectTab('overview');
      prevIdRef.current = id;
    }
  }, [id, setActiveProjectTab]);

  // Synchronize the current project into the global UI store for breadcrumbs & sidebar
  useEffect(() => {
    if (project) {
      setActiveProject(project.id, project.name);
    } else {
      setActiveProject(null, null);
    }
    return () => setActiveProject(null, null);
  }, [project?.id, project?.name, setActiveProject]);

  if (isLoading || !project) {
    return <Loader fullWidth text="Chargement du projet..." />;
  }

  const currentProject = project;

  // Le champ `code` est intentionnellement absent du payload PATCH (immuable côté backend)
  async function handleProjectUpdate(data: Partial<Project>) {
    setUpdateError(null);
    try {
      const payload: UpdateProjectPayload = {
        nom: data.name,
        description: data.description,
        bailleurPrincipal: data.donor,
        secteur: data.sector,
        pays: data.country,
        managerId: data.managerId || undefined,
        dateDebut: data.startDate || undefined,
        dateFinPrevue: data.endDate || undefined,
        dateFinEffective: data.dateFinEffective || undefined,
        dateClotureEffective: data.dateClotureEffective || undefined,
        budgetTotal: data.budgetTotal,
        devise: data.devise,
        statut: data.statut,
      };
      await updateProjectMutation.mutateAsync({ id: currentProject.id, payload });
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'Une erreur est survenue. Veuillez réessayer.');
      throw err;
    }
  }

  return (
    <div className="flex flex-col flex-1 bg-background relative">

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-4 sm:pb-6 bg-background border-b border-border">
        <div className={INNER}>
          <ProjectHeader
            project={project}
            onProjectUpdate={handleProjectUpdate}
            isUpdating={updateProjectMutation.isPending}
            updateError={updateError}
          />
        </div>
      </div>

      {/* ── TAB CONTENT ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-muted/10">

        {/* Full-height tabs: fill the container, manage their own scroll */}
        {activeProjectTab === 'logframe'  && <LogframePage />}
        {activeProjectTab === 'ptba'      && <PTBAPage />}
        {activeProjectTab === 'budget'    && <BudgetPage />}
        {activeProjectTab === 'ppm'       && <PPMPage />}
        {activeProjectTab === 'settings'  && <ProjectSettingsPage />}

        {/* Natural-flow tabs: padded, parent container scrolls them */}
        {activeProjectTab === 'overview' && (
          <div className={PAD}><div className={INNER}><TabOverview setActiveTab={setActiveProjectTab} project={project} summary={summary} /></div></div>
        )}
        {/* "Membres"/"Sources de financement"/"Structure WBS" vivent désormais
            comme sous-onglets de Paramètres du Projet (ProjectSettingsPage) —
            ces 3 cas restent actifs pour ne casser aucun lien existant
            (ex: BudgetPage.tsx → setActiveProjectTab('funding')), même s'ils
            ne sont plus listés dans le menu principal. */}
        {activeProjectTab === 'governance' && (
          <div className={PAD}><div className={INNER}><ProjectGovernanceTab /></div></div>
        )}
        {activeProjectTab === 'wbs' && (
          <div className={PAD}><div className={INNER}><WBSPage /></div></div>
        )}
        {activeProjectTab === 'funding' && (
          <div className={PAD}><div className={INNER}><ProjectFundingTab /></div></div>
        )}
        {/* "Journal des Opérations" affiche désormais directement le registre
            des Décaissements (plus de sous-onglets Journal/Historique). */}
        {activeProjectTab === 'journal' && (
          <div className={PAD}><div className={INNER}><ProjectDisbursementTab /></div></div>
        )}
        {activeProjectTab === 'disbursements' && (
          <div className={PAD}><div className={INNER}><ProjectDisbursementTab /></div></div>
        )}
        {activeProjectTab === 'evm' && (
          <div className={PAD}><div className={INNER}><TabEVM /></div></div>
        )}
        {activeProjectTab === 'risks' && (
          <div className={PAD}><div className={INNER}><TabRisks /></div></div>
        )}
        {activeProjectTab === 'history' && (
          <div className={PAD}><div className={INNER}><TabHistory /></div></div>
        )}
      </div>
    </div>
  );
}
