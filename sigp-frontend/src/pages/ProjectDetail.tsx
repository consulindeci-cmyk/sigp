import { useState } from 'react';
import ProjectHeader from '../components/project/layout/ProjectHeader';
import ProjectSidebar from '../components/project/layout/ProjectSidebar';

// Existing tabs
import TabOverview from '../components/project/TabOverview';
import TabPTBA from '../components/project/TabPTBA';
import TabLogframe from '../components/project/TabLogframe';
import TabBudget from '../components/project/TabBudget';
import TabProcurement from '../components/project/TabProcurement';
import TabEVM from '../components/project/TabEVM';
import TabRisks from '../components/project/TabRisks';
import TabDocuments from '../components/project/TabDocuments';
import TabReports from '../components/project/TabReports';

// Placeholder for missing modules
const Placeholder = ({ name }: { name: string }) => (
  <div className="panel" style={{ padding: '80px 40px', textAlign: 'center', background: 'var(--surface)' }}>
    <div style={{ width: '64px', height: '64px', margin: '0 auto 20px', borderRadius: '50%', background: 'var(--navy-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--navy-500)' }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
    </div>
    <h3 style={{ fontSize: '20px', color: 'var(--navy-900)', marginBottom: '10px' }}>{name}</h3>
    <p style={{ color: 'var(--slate)', maxWidth: '400px', margin: '0 auto' }}>Ce module fait partie de l'architecture cible du Hub Central et sera développé prochainement.</p>
  </div>
);

export default function ProjectDetail() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);

  return (
    <section className="screen active" id="screen-project-detail" style={{ padding: '20px', background: 'var(--canvas)' }}>
      {/* 1. Header Permanent (Résumé Exécutif) */}
      <ProjectHeader isEditing={isEditing} setIsEditing={setIsEditing} />

      {/* 2. Layout Master-Detail (Sidebar + Content) */}
      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        
        {/* Sidebar (Navigation) */}
        <ProjectSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Contenu Principal */}
        <div style={{ flex: 1 }}>
          {activeTab === 'overview' && <TabOverview setActiveTab={setActiveTab} />}
          {activeTab === 'governance' && <Placeholder name="Gouvernance & Acteurs" />}
          {activeTab === 'logframe' && <TabLogframe />}
          {activeTab === 'wbs' && <Placeholder name="Structure de fractionnement du travail (WBS)" />}
          
          {activeTab === 'ptba' && <TabPTBA />}
          {activeTab === 'activities' && <Placeholder name="Liste détaillée des Activités" />}
          {activeTab === 'journal' && <Placeholder name="Journal des Opérations" />}
          
          {activeTab === 'budget' && <TabBudget />}
          {activeTab === 'funding' && <Placeholder name="Sources de Financement & Conventions" />}
          {activeTab === 'procurement' && <TabProcurement />}
          {activeTab === 'disbursements' && <Placeholder name="Suivi des Décaissements" />}
          
          {activeTab === 'evm' && <TabEVM />}
          {activeTab === 'risks' && <TabRisks />}
          {activeTab === 'deliverables' && <Placeholder name="Registre des Livrables" />}
          
          {activeTab === 'pdocuments' && <TabDocuments />}
          {activeTab === 'reports' && <TabReports />}
          {activeTab === 'history' && <Placeholder name="Historique des modifications" />}
          {activeTab === 'comments' && <Placeholder name="Commentaires & Discussions" />}
          {activeTab === 'settings' && <Placeholder name="Paramètres du Projet" />}
        </div>

      </div>
    </section>
  );
}
