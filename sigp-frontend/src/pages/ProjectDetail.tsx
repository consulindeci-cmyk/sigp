import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useUIStore } from '@/stores/uiStore';
import ProjectHeader from '../components/project/layout/ProjectHeader';

// Full-height tabs (manage their own layout, header and scroll)
import PTBAPage from './project/PTBAPage';
import LogframePage from './project/LogframePage';
import WBSPage from './project/WBSPage';
import BudgetPage from './project/BudgetPage';
import PPMPage from './project/PPMPage';
import ContractsPage from './project/ContractsPage';

// Natural-flow tabs (padded by ProjectDetail, scroll via parent)
import TabOverview from '../components/project/TabOverview';
import TabEVM from '../components/project/TabEVM';
import TabRisks from '../components/project/TabRisks';
import TabDocuments from '../components/project/TabDocuments';
import TabReports from '../components/project/TabReports';
import ProjectGovernanceTab from '../components/project/ProjectGovernanceTab';
import ProjectFundingTab from '../components/project/ProjectFundingTab';
import ProjectDisbursementTab from '../components/project/ProjectDisbursementTab';
import ProjectDeliverablesTab from '../components/project/ProjectDeliverablesTab';
import ProjectActivitiesTab from '../components/project/ProjectActivitiesTab';
import ProjectOperationsJournalTab from '../components/project/ProjectOperationsJournalTab';
import ProjectHistoryTab from '../components/project/ProjectHistoryTab';
import TabComments from '../components/project/TabComments';
import TabSettings from '../components/project/TabSettings';

import { mockProjects, type Project } from '@/mocks/projectsMocks';

const PAD = 'px-4 sm:px-6 lg:px-8 py-6';
const INNER = 'mx-auto w-full max-w-layout';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { activeProjectTab, setActiveProjectTab, setActiveProject } = useUIStore();

  const initialProject = mockProjects.find(p => p.id === id) ?? mockProjects[0];
  const [project, setProject] = useState<Project>(initialProject);
  const prevIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const found = mockProjects.find(p => p.id === id) ?? mockProjects[0];
    setProject(found);
    setActiveProject(id ?? null, found.name);
    // Reset tab to overview only when navigating to a different project
    if (prevIdRef.current !== undefined && prevIdRef.current !== id) {
      setActiveProjectTab('overview');
    }
    prevIdRef.current = id;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <div className="flex flex-col flex-1 bg-background relative">

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-4 sm:pb-6 bg-background border-b border-border">
        <div className={INNER}>
          <ProjectHeader project={project} onProjectUpdate={setProject} />
        </div>
      </div>

      {/* ── TAB CONTENT ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-muted/10">

        {/* Full-height tabs: fill the container, manage their own scroll */}
        {activeProjectTab === 'logframe'  && <LogframePage />}
        {activeProjectTab === 'wbs'       && <WBSPage />}
        {activeProjectTab === 'ptba'      && <PTBAPage />}
        {activeProjectTab === 'budget'    && <BudgetPage />}
        {activeProjectTab === 'ppm'       && <PPMPage />}
        {activeProjectTab === 'contracts' && <ContractsPage />}

        {/* Natural-flow tabs: padded, parent container scrolls them */}
        {activeProjectTab === 'overview' && (
          <div className={PAD}><div className={INNER}><TabOverview setActiveTab={setActiveProjectTab} /></div></div>
        )}
        {activeProjectTab === 'governance' && (
          <div className={PAD}><div className={INNER}><ProjectGovernanceTab /></div></div>
        )}
        {activeProjectTab === 'activities' && (
          <div className={PAD}><div className={INNER}><ProjectActivitiesTab /></div></div>
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
          <div className={PAD}><div className={INNER}><ProjectHistoryTab /></div></div>
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
