import { useState } from 'react';
import ProjectHeader from '../components/project/layout/ProjectHeader';
import ProjectSidebar from '../components/project/layout/ProjectSidebar';

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

import { MasterDetailLayout } from '@/components/layout/MasterDetailLayout';

// Placeholder for missing modules
const Placeholder = ({ name }: { name: string }) => (
  <div className="flex flex-col items-center justify-center p-12 text-center bg-background rounded-lg border border-border h-[400px]">
    <div className="w-16 h-16 mb-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
    </div>
    <h3 className="text-xl font-semibold text-foreground mb-3">{name}</h3>
    <p className="text-muted-foreground max-w-md mx-auto">Ce module fait partie de l'architecture cible du Hub Central et sera développé prochainement.</p>
  </div>
);

export default function ProjectDetail() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);

  return (
    <MasterDetailLayout
      header={<ProjectHeader isEditing={isEditing} setIsEditing={setIsEditing} />}
      master={<ProjectSidebar activeTab={activeTab} setActiveTab={setActiveTab} />}
      detail={
        <>
          {activeTab === 'overview' && <TabOverview setActiveTab={setActiveTab} />}
          {activeTab === 'governance' && <Placeholder name="Gouvernance & Acteurs" />}
          {activeTab === 'logframe' && <LogframePage />}
          {activeTab === 'wbs' && <WBSPage />}
          
          {activeTab === 'ptba' && <PTBAPage />}
          {activeTab === 'activities' && <Placeholder name="Liste détaillée des Activités" />}
          {activeTab === 'journal' && <Placeholder name="Journal des Opérations" />}
          
          {activeTab === 'budget' && <BudgetPage />}
          {activeTab === 'funding' && <Placeholder name="Sources de Financement & Conventions" />}
          {activeTab === 'ppm' && <PPMPage />}
          {activeTab === 'contracts' && <ContractsPage />}
          {activeTab === 'disbursements' && <Placeholder name="Suivi des Décaissements" />}
          
          {activeTab === 'evm' && <TabEVM />}
          {activeTab === 'risks' && <TabRisks />}
          {activeTab === 'deliverables' && <Placeholder name="Registre des Livrables" />}
          
          {activeTab === 'pdocuments' && <TabDocuments />}
          {activeTab === 'reports' && <TabReports />}
          {activeTab === 'history' && <Placeholder name="Historique des modifications" />}
          {activeTab === 'comments' && <Placeholder name="Commentaires & Discussions" />}
          {activeTab === 'settings' && <Placeholder name="Paramètres du Projet" />}
        </>
      }
    />
  );
}
