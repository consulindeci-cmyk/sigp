import { useState } from 'react';
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
import ProjectCommentsTab from '../components/project/ProjectCommentsTab';
import ProjectSettingsTab from '../components/project/ProjectSettingsTab';

// Padding applied to all natural-flow tabs
const PAD = 'px-4 sm:px-6 lg:px-8 py-6';
const INNER = 'mx-auto w-full max-w-layout';

export default function ProjectDetail() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="flex flex-col min-h-full bg-background relative">

      {/* ── HEADER (Scrolls out naturally) ── */}
      <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 bg-background">
        <div className={INNER}>
          <ProjectHeader isEditing={isEditing} setIsEditing={setIsEditing} />
        </div>
      </div>

      {/* ── NAV (Sticky) ── */}
      <div className="sticky top-0 z-40 px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 pt-6 bg-background border-b border-border shadow-sm">
        <div className={INNER}>
          <ProjectNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
      </div>

      {/* ── TAB CONTENT (Grows naturally) ── */}
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
          <div className={PAD}><div className={INNER}><ProjectCommentsTab /></div></div>
        )}
        {activeTab === 'settings' && (
          <div className={PAD}><div className={INNER}><ProjectSettingsTab /></div></div>
        )}
      </div>
    </div>
  );
}
