import { PageHeader } from '@/components/layout/PageHeader';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useUIStore } from '@/stores/uiStore';
import { usePPM } from '@/hooks/usePPM';
import { usePPMVersions } from '@/hooks/usePPMVersions';
import { formatMoney } from '@/utils/format';
import { VersionSelector } from '@/components/common/workflow/VersionSelector';
import { PPMMatrix } from '@/components/project/ppm/views/PPMMatrix';
import { PPMFormSlideOver } from '@/components/project/ppm/forms/PPMFormSlideOver';
import { LayoutGrid, GitCommit, TrendingUp, Download, Plus, Loader2, Package } from 'lucide-react';
import { PPMLigne } from '@/types';
import { Badge } from '@/components/ui/data-display/Badge';
import { Button } from '@/components/ui/forms/Button';

type BadgeVariant = 'success' | 'secondary' | 'warning' | 'default'

function renderStatusBadge(statut?: string) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    APPROUVE:           { label: 'Approuvé',    variant: 'success' },
    BROUILLON:          { label: 'Brouillon',   variant: 'secondary' },
    SOUMIS:             { label: 'Soumis',      variant: 'warning' },
    VALIDATION_BAILLEUR:{ label: 'Attente ANO', variant: 'warning' },
    CLOTURE:            { label: 'Clôturé',     variant: 'secondary' },
  }
  const entry = statut ? map[statut] : undefined
  return (
    <Badge variant={entry?.variant ?? 'default'} className="text-[10px]">
      {entry?.label ?? statut ?? 'N/A'}
    </Badge>
  )
}

const TABS = [
  { key: 'MATRIX',   label: 'Matrice Globale',         icon: LayoutGrid },
  { key: 'WORKFLOW', label: "Workflow d'Approbation",  icon: GitCommit },
  { key: 'BI',       label: 'Analytics PPM',           icon: TrendingUp },
] as const

type Tab = typeof TABS[number]['key']

export default function PPMPage() {
  const { id: urlProjectId } = useParams();
  const { activeProjectId } = useUIStore();
  const resolvedProjectId = urlProjectId || activeProjectId || '';

  const { versions, activeVersionId, setActiveVersionId, isLoading: isLoadingVersions } = usePPMVersions();
  const { lignes, isLoading: isLoadingPPM, totalEstimeBase, addLigne, updateLigne, deleteLigne } = usePPM(activeVersionId);

  const [activeTab, setActiveTab] = useState<Tab>('MATRIX');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedLigneId, setSelectedLigneId] = useState<string | null>(null);

  const isLoading = isLoadingVersions || isLoadingPPM;

  if (!resolvedProjectId) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-3 text-center p-8">
        <Package className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
        <p className="font-semibold text-foreground">Aucun projet sélectionné</p>
        <p className="text-sm text-muted-foreground">
          Veuillez sélectionner un projet pour afficher le Plan de Passation des Marchés.
        </p>
      </div>
    );
  }

  const activeVersion = versions.find(v => v.id === activeVersionId);

  const handleOpenForm = (id?: string) => {
    setSelectedLigneId(id || null);
    setIsFormOpen(true);
  };

  const handleSaveForm = async (data: Omit<PPMLigne, 'id' | 'version_hash' | 'statut' | 'ppm_version_id'>) => {
    if (selectedLigneId) {
      await updateLigne(selectedLigneId, data);
    } else {
      await addLigne(data);
    }
  };

  const selectedLigne = selectedLigneId ? lignes.find(l => l.id === selectedLigneId) : null;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <PageHeader title="Plan de Passation des Marchés (PPM)" />
          </div>
          {renderStatusBadge(activeVersion?.statut)}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />} className="h-8 text-xs">
            Exporter Excel
          </Button>
          <Button variant="default" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} className="h-8 text-xs" onClick={() => handleOpenForm()}>
            Nouveau Marché
          </Button>
        </div>
      </div>

      {/* ── KPI STRIP ──────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-4 px-4 py-2.5 border-b border-border bg-muted/10">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">Montant Total Estimé (PPM)</p>
            <p className="text-sm font-bold text-foreground tabular-nums">{formatMoney(totalEstimeBase)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">Lignes de Marché</p>
            <p className="text-sm font-bold text-foreground">{lignes.length} {lignes.length > 1 ? 'Lignes' : 'Ligne'}</p>
          </div>
        </div>
        <VersionSelector
          versions={versions.map(v => ({
            id: v.id,
            label: v.numero_version,
            isActive: v.id === activeVersionId,
            statut: v.statut
          }))}
          selectedId={activeVersionId}
          onChange={setActiveVersionId}
        />
      </div>

      {/* ── ONGLETS ─────────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center gap-1 px-4 border-b border-border bg-card">
        {TABS.map(tab => {
          const Icon = tab.icon
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
          )
        })}
      </div>

      {/* ── CONTENU ────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-auto p-4">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm font-medium">Chargement du PPM...</span>
          </div>
        ) : (
          <>
            {activeTab === 'MATRIX' && (
              <div className="h-full min-h-[500px] bg-card border border-border rounded-lg overflow-hidden">
                <PPMMatrix lignes={lignes} onRowClick={handleOpenForm} />
              </div>
            )}

            {activeTab === 'WORKFLOW' && (
              <div className="bg-card border border-dashed border-border rounded-lg p-8 text-center">
                <p className="text-sm text-muted-foreground">[Étape 4 : Workflow d'Approbation à venir]</p>
              </div>
            )}

            {activeTab === 'BI' && (
              <div className="bg-card border border-dashed border-border rounded-lg p-8 text-center">
                <p className="text-sm text-muted-foreground">[Étape 5 : Analytics PPM à venir]</p>
              </div>
            )}
          </>
        )}
      </div>

      <PPMFormSlideOver
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        ligne={selectedLigne}
        onSave={handleSaveForm}
        onDelete={deleteLigne}
      />
    </div>
  );
}
