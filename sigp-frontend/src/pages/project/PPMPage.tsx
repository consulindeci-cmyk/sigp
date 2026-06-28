import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useUIStore } from '@/stores/uiStore';
import { usePPM } from '@/hooks/usePPM';
import { usePPMVersions } from '@/hooks/usePPMVersions';
import { formatMoney } from '@/utils/format';
import { VersionSelector } from '@/components/common/workflow/VersionSelector';
import { PPMMatrix } from '@/components/project/ppm/views/PPMMatrix';
import { PPMFormSlideOver } from '@/components/project/ppm/forms/PPMFormSlideOver';
import { LayoutGrid, GitCommit, TrendingUp } from 'lucide-react';
import { PPMLigne } from '@/types';

export default function PPMPage() {
  const { id: urlProjectId } = useParams();
  const { activeProjectId } = useUIStore();
  const resolvedProjectId = urlProjectId || activeProjectId || '';

  const { versions, activeVersionId, setActiveVersionId, isLoading: isLoadingVersions } = usePPMVersions();
  const { lignes, isLoading: isLoadingPPM, totalEstimeBase, addLigne, updateLigne, deleteLigne } = usePPM(activeVersionId);

  const [activeTab, setActiveTab] = useState<'MATRIX' | 'WORKFLOW' | 'BI'>('MATRIX');
  
  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedLigneId, setSelectedLigneId] = useState<string | null>(null);

  const isLoading = isLoadingVersions || isLoadingPPM;

  if (!resolvedProjectId) {
    return (
      <div className="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        <div className="es-title">Aucun projet sélectionné</div>
        <div className="es-sub">Veuillez sélectionner un projet pour afficher le Plan de Passation des Marchés.</div>
      </div>
    );
  }

  const activeVersion = versions.find(v => v.id === activeVersionId);

  const renderStatusBadge = (statut?: string) => {
    switch (statut) {
      case 'APPROUVE': return <span className="chip chip-success">Approuvé</span>;
      case 'BROUILLON': return <span className="chip chip-slate">Brouillon</span>;
      case 'SOUMIS': return <span className="chip chip-warning">Soumis</span>;
      case 'VALIDATION_BAILLEUR': return <span className="chip chip-warning">Attente ANO</span>;
      case 'CLOTURE': return <span className="chip chip-slate">Clôturé</span>;
      default: return <span className="chip">{statut || 'N/A'}</span>;
    }
  };

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
    <div className="page-container">
      {/* Header compact façon ERP */}
      <div className="page-header">
        <div className="ph-top">
          <div className="ph-title-group">
            <h1 className="ph-title">Plan de Passation des Marchés (PPM)</h1>
            {renderStatusBadge(activeVersion?.statut)}
          </div>
          
          <div className="ph-actions">
            <button className="btn btn-secondary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              Exporter Excel
            </button>
            <button className="btn btn-primary" onClick={() => handleOpenForm()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
              Nouveau Marché
            </button>
          </div>
        </div>

        {/* KPI Strip & Version Selector */}
        <div className="ph-bottom">
          <div className="kpi-strip">
            <div className="kpi-item">
              <div className="kpi-label">Montant Total Estimé (PPM)</div>
              <div className="kpi-value text-slate-800">
                {formatMoney(totalEstimeBase)}
              </div>
            </div>
            <div className="kpi-item">
              <div className="kpi-label">Lignes de Marché</div>
              <div className="kpi-value">{lignes.length} {lignes.length > 1 ? 'Lignes' : 'Ligne'}</div>
            </div>
          </div>
          
          <div className="ph-tools">
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
        </div>
      </div>

      {/* Navigation Onglets */}
      <div className="tabs-container">
        <button 
          className={`tab-button ${activeTab === 'MATRIX' ? 'active' : ''}`}
          onClick={() => setActiveTab('MATRIX')}
        >
          <LayoutGrid size={16} />
          Matrice Globale
        </button>
        <button 
          className={`tab-button ${activeTab === 'WORKFLOW' ? 'active' : ''}`}
          onClick={() => setActiveTab('WORKFLOW')}
        >
          <GitCommit size={16} />
          Workflow d'Approbation
        </button>
        <button 
          className={`tab-button ${activeTab === 'BI' ? 'active' : ''}`}
          onClick={() => setActiveTab('BI')}
        >
          <TrendingUp size={16} />
          Analytics PPM
        </button>
      </div>

      {/* Contenu principal */}
      <div className="page-content p-4">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="spinner"></div>
            <span className="ml-3 text-slate-500 font-medium">Chargement du PPM...</span>
          </div>
        ) : (
          <>
            {activeTab === 'MATRIX' && (
              <div style={{ height: 'calc(100vh - 220px)', minHeight: '500px', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--line-soft)', overflow: 'hidden' }}>
                <PPMMatrix lignes={lignes} onRowClick={handleOpenForm} />
              </div>
            )}
            
            {activeTab === 'WORKFLOW' && (
              <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--surface)', borderRadius: '8px', border: '1px dashed var(--line-strong)' }}>
                <span style={{ fontSize: '14px', color: 'var(--slate)' }}>[Étape 4 : Workflow d'Approbation à venir]</span>
              </div>
            )}

            {activeTab === 'BI' && (
              <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--surface)', borderRadius: '8px', border: '1px dashed var(--line-strong)' }}>
                <span style={{ fontSize: '14px', color: 'var(--slate)' }}>[Étape 5 : Analytics PPM à venir]</span>
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
