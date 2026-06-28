import { useState } from 'react';
import ProjectHeader from '../components/project/layout/ProjectHeader';
import ProjectNavigation from '../components/project/layout/ProjectNavigation';

// Existing tabs
import TabOverview from '../components/project/TabOverview';
import PTBAPage from './project/PTBAPage';
import LogframePage from './project/LogframePage';
import WBSPage from './project/WBSPage';
import BudgetPage from './project/BudgetPage';
import PPMPage from './project/PPMPage';
import ContractsPage from './project/ContractsPage';
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


export default function ProjectDetail() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="flex flex-col min-h-full bg-muted/10">
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto w-full max-w-layout flex flex-col">
          <ProjectHeader isEditing={isEditing} setIsEditing={setIsEditing} />
          
          <ProjectNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
          
          <div className="w-full">
            {activeTab === 'overview' && <TabOverview setActiveTab={setActiveTab} />}
            {activeTab === 'governance' && <ProjectGovernanceTab />}
            {activeTab === 'logframe' && <LogframePage />}
            {activeTab === 'wbs' && <WBSPage />}
            
            {activeTab === 'ptba' && <PTBAPage />}
            {activeTab === 'activities' && <ProjectActivitiesTab />}
            {activeTab === 'journal' && <ProjectOperationsJournalTab />}
            
            {activeTab === 'budget' && <BudgetPage />}
            {activeTab === 'funding' && <ProjectFundingTab />}
            {activeTab === 'ppm' && <PPMPage />}
            {activeTab === 'contracts' && <ContractsPage />}
            {activeTab === 'disbursements' && <ProjectDisbursementTab />}
            
            {activeTab === 'evm' && <TabEVM />}
            {activeTab === 'risks' && <TabRisks />}
            {activeTab === 'deliverables' && <ProjectDeliverablesTab />}
            
            {activeTab === 'pdocuments' && <TabDocuments />}
            {activeTab === 'reports' && <TabReports />}
            {activeTab === 'history' && <ProjectHistoryTab />}
            {activeTab === 'comments' && <ProjectCommentsTab />}
            {activeTab === 'settings' && <ProjectSettingsTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
