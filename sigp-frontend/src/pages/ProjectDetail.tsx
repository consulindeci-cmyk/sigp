import { useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useUIStore } from '@/stores/uiStore';
import ProjectHeader from '../components/project/layout/ProjectHeader';

// Full-height tabs (manage their own layout, header and scroll)
import PTBAPage from './project/PTBAPage';
import LogframePage from './project/LogframePage';
import BudgetPage from './project/BudgetPage';
import PPMPage from './project/PPMPage';
import ContractsPage from './project/ContractsPage';

// Natural-flow tabs (padded by ProjectDetail, scroll via parent)
import { Loader } from '@/components/ui/feedback/Loader';
import TabOverview from '../components/project/TabOverview';
import TabEVM from '../components/project/TabEVM';
import TabRisks from '../components/project/TabRisks';
import TabDocuments from '../components/project/TabDocuments';
import TabReports from '../components/project/TabReports';
import ProjectGovernanceTab from '../components/project/ProjectGovernanceTab';
import ProjectFundingTab from '../components/project/ProjectFundingTab';
import ProjectDisbursementTab from '../components/project/ProjectDisbursementTab';
import ProjectDeliverablesTab from '../components/project/ProjectDeliverablesTab';
import ProjectOperationsJournalTab from '../components/project/ProjectOperationsJournalTab';
import TabHistory from '../components/project/TabHistory';
import TabComments from '../components/project/TabComments';
import TabSettings from '../components/project/TabSettings';

import { useProject, useProjectSummary, useProjectRowAggregation } from '@/hooks/useProjects';
import { adaptProjectDto, type Project } from '@/lib/projectAdapter';

const PAD = 'px-4 sm:px-6 lg:px-8 py-6';
const INNER = 'mx-auto w-full max-w-layout';


export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { activeProjectTab, setActiveProjectTab, setActiveProject } = useUIStore();
  const prevIdRef = useRef<string | undefined>(undefined);

  const { data: apiProject, isLoading } = useProject(id ?? '');
  const { data: summary } = useProjectSummary(id ?? '');
  const { data: rowAgg } = useProjectRowAggregation(id ?? '');

  const project: Project | undefined = useMemo(() => {
    if (!apiProject) return undefined;
    return {
      ...adaptProjectDto(apiProject),
      progressScore: summary?.progressScore ?? 0,
      tauxDecaissement: summary?.tauxDecaissement ?? 0,
      profileScore: summary?.profileScore ?? 0,
      composantes: rowAgg?.composantes ?? 0,
      activites: rowAgg?.activites ?? 0,
      livrables: rowAgg?.livrables ?? 0,
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

  return (
    <div className="flex flex-col flex-1 bg-background relative">

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-4 sm:pb-6 bg-background border-b border-border">
        <div className={INNER}>
          <ProjectHeader project={project} onProjectUpdate={() => {}} />
        </div>
      </div>

      {/* ── TAB CONTENT ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-muted/10">

        {/* Full-height tabs: fill the container, manage their own scroll */}
        {activeProjectTab === 'logframe'  && <LogframePage />}
        {activeProjectTab === 'ptba'      && <PTBAPage />}
        {activeProjectTab === 'budget'    && <BudgetPage />}
        {activeProjectTab === 'ppm'       && <PPMPage />}
        {activeProjectTab === 'contracts' && <ContractsPage />}

        {/* Natural-flow tabs: padded, parent container scrolls them */}
        {activeProjectTab === 'overview' && (
          <div className={PAD}><div className={INNER}><TabOverview setActiveTab={setActiveProjectTab} project={project} summary={summary} /></div></div>
        )}
        {activeProjectTab === 'governance' && (
          <div className={PAD}><div className={INNER}><ProjectGovernanceTab /></div></div>
        )}
        {activeProjectTab === 'journal' && (
          <div className={PAD}><div className={INNER}><ProjectOperationsJournalTab /></div></div>
        )}
        {activeProjectTab === 'funding' && (
          <div className={PAD}><div className={INNER}><ProjectFundingTab /></div></div>
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
        {activeProjectTab === 'deliverables' && (
          <div className={PAD}><div className={INNER}><ProjectDeliverablesTab /></div></div>
        )}
        {activeProjectTab === 'pdocuments' && (
          <div className={PAD}><div className={INNER}><TabDocuments /></div></div>
        )}
        {activeProjectTab === 'reports' && (
          <div className={PAD}><div className={INNER}><TabReports /></div></div>
        )}
        {activeProjectTab === 'history' && (
          <div className={PAD}><div className={INNER}><TabHistory /></div></div>
        )}
        {activeProjectTab === 'comments' && (
          <div className={PAD}><div className={INNER}><TabComments /></div></div>
        )}
        {activeProjectTab === 'settings' && (
          <div className={PAD}><div className={INNER}><TabSettings /></div></div>
        )}
      </div>
    </div>
  );
}
