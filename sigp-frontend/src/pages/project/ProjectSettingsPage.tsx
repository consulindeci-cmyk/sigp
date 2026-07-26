import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Settings, Users, Wallet, ListTree } from 'lucide-react';
import TabSettings from '@/components/project/TabSettings';
import ProjectGovernanceTab from '@/components/project/ProjectGovernanceTab';
import ProjectFundingTab from '@/components/project/ProjectFundingTab';
import WBSPage from '@/pages/project/WBSPage';

// Regroupe, dans un seul onglet "Paramètres du Projet", 3 sous-sections qui
// vivaient auparavant comme entrées de menu séparées (Membres/Sources de
// financement/Structure WBS) — cf. réorganisation de la navigation. Les
// composants réutilisés (ProjectGovernanceTab/ProjectFundingTab/WBSPage)
// sont inchangés, simplement embarqués ici en plus de leur route d'origine
// (toujours valide, cf. ProjectDetail.tsx — aucun lien existant cassé).
const TABS = [
  { key: 'GENERAL',   label: 'Général',              icon: Settings },
  { key: 'TEAM',       label: 'Membres',              icon: Users },
  { key: 'FUNDING',    label: 'Sources de financement', icon: Wallet },
  { key: 'WBS',        label: 'Structure WBS',        icon: ListTree },
] as const;

type Tab = typeof TABS[number]['key'];

export default function ProjectSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('GENERAL');

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="shrink-0 px-4 py-3 border-b border-border bg-card">
        <PageHeader title="Paramètres du Projet" />
      </div>

      {/* ── ONGLETS ─────────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center gap-1 px-4 border-b border-border bg-card">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring -mb-px ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── CONTENU ────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-auto p-4">
        {activeTab === 'GENERAL' && <TabSettings />}
        {activeTab === 'TEAM' && <ProjectGovernanceTab />}
        {activeTab === 'FUNDING' && <ProjectFundingTab />}
        {activeTab === 'WBS' && (
          <div className="h-full min-h-[500px] bg-card border border-border rounded-lg overflow-hidden">
            <WBSPage />
          </div>
        )}
      </div>
    </div>
  );
}
