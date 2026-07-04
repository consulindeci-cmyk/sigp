import { useState } from 'react';
import { useParams } from 'react-router-dom';
import ProjectHeader from '../components/project/layout/ProjectHeader';
import ProjectNavigation from '../components/project/layout/ProjectNavigation';

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
  const initialProject = mockProjects.find(p => p.id === id) ?? mockProjects[0];
  const [project, setProject] = useState<Project>(initialProject);
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="flex flex-col flex-1 bg-background relative">

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 bg-background">
        <div className={INNER}>
          <ProjectHeader project={project} onProjectUpdate={setProject} />
        </div>
      </div>

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 pt-6 bg-background border-b border-border">
        <div className={INNER}>
          <ProjectNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
      </div>

      {/* ── TAB CONTENT ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-muted/10">

        {/* Full-height tabs: fill the container, manage their own scroll */}
        {activeTab === 'logframe'  && <LogframePage />}
        {activeTab === 'wbs'       && <WBSPage />}
        {activeTab === 'ptba'      && <PTBAPage />}
        {activeTab === 'budget'    && <BudgetPage />}
        {activeTab === 'ppm'       && <PPMPage />}
        {activeTab === 'contracts' && <ContractsPage />}

        {/* Natural-flow tabs: padded, parent container scrolls them */}
        {activeTab === 'overview' && (
          <div className={PAD}><div className={INNER}><TabOverview setActiveTab={setActiveTab} /></div></div>
        )}
        {activeTab === 'governance' && (
          <div className={PAD}><div className={INNER}><ProjectGovernanceTab /></div></div>
        )}
        {activeTab === 'activities' && (
          <div className={PAD}><div className={INNER}><ProjectActivitiesTab /></div></div>
        )}
        {activeTab === 'journal' && (
          <div className={PAD}><div className={INNER}><ProjectOperationsJournalTab /></div></div>
        )}
        {activeTab === 'funding' && (
          <div className={PAD}><div className={INNER}><ProjectFundingTab /></div></div>
        )}
        {activeTab === 'disbursements' && (
          <div className={PAD}><div className={INNER}><ProjectDisbursementTab /></div></div>
        )}
        {activeTab === 'evm' && (
          <div className={PAD}><div className={INNER}><TabEVM /></div></div>
        )}
        {activeTab === 'risks' && (
          <div className={PAD}><div className={INNER}><TabRisks /></div></div>
        )}
        {activeTab === 'deliverables' && (
          <div className={PAD}><div className={INNER}><ProjectDeliverablesTab /></div></div>
        )}
        {activeTab === 'pdocuments' && (
          <div className={PAD}><div className={INNER}><TabDocuments /></div></div>
        )}
        {activeTab === 'reports' && (
          <div className={PAD}><div className={INNER}><TabReports /></div></div>
        )}
        {activeTab === 'history' && (
          <div className={PAD}><div className={INNER}><ProjectHistoryTab /></div></div>
        )}
        {activeTab === 'comments' && (
          <div className={PAD}><div className={INNER}><TabComments /></div></div>
        )}
        {activeTab === 'settings' && (
          <div className={PAD}><div className={INNER}><TabSettings /></div></div>
        )}
      </div>
    </div>
  );
}
