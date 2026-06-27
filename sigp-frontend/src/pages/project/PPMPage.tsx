import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useUIStore } from '@/stores/uiStore';
import { usePPM } from '@/hooks/usePPM';
import { usePPMVersions } from '@/hooks/usePPMVersions';
import { formatMoney } from '@/utils/format';
import { VersionSelector } from '@/components/common/workflow/VersionSelector';
import { PPMMatrix } from '@/components/project/ppm/views/PPMMatrix';
import { PPMFormSlideOver } from '@/components/project/ppm/forms/PPMFormSlideOver';
import { PPMWorkflowView } from '@/components/project/ppm/views/PPMWorkflowView';
import { PPMBIView } from '@/components/project/ppm/views/PPMBIView';
import { LayoutGrid, GitCommit, TrendingUp } from 'lucide-react';

export default function PPMPage() {
  const { id: urlProjectId } = useParams();
  const { activeProjectId } = useUIStore();
  const resolvedProjectId = urlProjectId || activeProjectId || '';

  const {
    versions, activeVersionId, setActiveVersionId, isLoading: isLoadingVersions,
    executeWorkflowAction, getWorkflowLogs, buildWorkflowSteps, getAvailableActions
  } = usePPMVersions();
  const { lignes, isLoading: isLoadingPPM, totalEstimeBase, biMetrics, addLigne, updateLigne, deleteLigne } = usePPM(activeVersionId);

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

  const handleSaveForm = async (data: any) => {
    if (selectedLigneId) {
      await updateLigne(selectedLigneId, data);
    } else {
      await addLigne(data);
    }
  };

  const selectedLigne = selectedLigneId ? lignes.find(l => l.id === selectedLigneId) : null;

  // Données mémoïsées pour le Workflow (Étape 4) — aucun re-calcul superflu
  const workflowSteps = useMemo(() => {
    if (!activeVersion) return [];
    return buildWorkflowSteps(activeVersion.statut, activeVersion);
  }, [activeVersion, buildWorkflowSteps]);

  const workflowLogs = useMemo(() => {
    if (!activeVersionId) return [];
    return getWorkflowLogs(activeVersionId);
  }, [activeVersionId, getWorkflowLogs, versions]); // versions en dep pour forcer recalcul après action

  const availableActions = useMemo(() => {
    if (!activeVersion) return [];
    return getAvailableActions(activeVersion.statut);
  }, [activeVersion, getAvailableActions]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px', gap: '24px', backgroundColor: 'var(--canvas)' }}>
      {/* Header compact façon ERP */}
      <div style={{ backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '8px', border: '1px solid var(--line-soft)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: 'var(--navy-900)' }}>Plan de Passation des Marchés (PPM)</h1>
            <div>{renderStatusBadge(activeVersion?.statut)}</div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              Exporter Excel
            </button>
            <button className="btn btn-primary" onClick={() => handleOpenForm()} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M12 5v14M5 12h14"/></svg>
              Nouveau Marché
            </button>
          </div>
        </div>

        {/* KPI Strip & Version Selector */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid var(--line-soft)', paddingTop: '20px' }}>
          <div style={{ display: 'flex', gap: '40px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Montant Total Estimé (PPM)</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--navy-900)', lineHeight: 1 }}>
                {formatMoney(totalEstimeBase)}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Lignes de Marché</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--navy-900)', lineHeight: 1 }}>
                {lignes.length} <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--slate)' }}>{lignes.length > 1 ? 'Lignes' : 'Ligne'}</span>
              </div>
            </div>
          </div>
          
          <div>
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
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--line-soft)' }}>
        <button 
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '14px', fontWeight: activeTab === 'MATRIX' ? 600 : 500,
            color: activeTab === 'MATRIX' ? 'var(--blue)' : 'var(--slate)',
            borderBottom: activeTab === 'MATRIX' ? '2px solid var(--blue)' : '2px solid transparent',
            marginBottom: '-1px', transition: 'all 0.2s'
          }}
          onClick={() => setActiveTab('MATRIX')}
        >
          <LayoutGrid size={16} />
          Matrice Globale
        </button>
        <button 
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '14px', fontWeight: activeTab === 'WORKFLOW' ? 600 : 500,
            color: activeTab === 'WORKFLOW' ? 'var(--blue)' : 'var(--slate)',
            borderBottom: activeTab === 'WORKFLOW' ? '2px solid var(--blue)' : '2px solid transparent',
            marginBottom: '-1px', transition: 'all 0.2s'
          }}
          onClick={() => setActiveTab('WORKFLOW')}
        >
          <GitCommit size={16} />
          Workflow d'Approbation
        </button>
        <button 
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '14px', fontWeight: activeTab === 'BI' ? 600 : 500,
            color: activeTab === 'BI' ? 'var(--blue)' : 'var(--slate)',
            borderBottom: activeTab === 'BI' ? '2px solid var(--blue)' : '2px solid transparent',
            marginBottom: '-1px', transition: 'all 0.2s'
          }}
          onClick={() => setActiveTab('BI')}
        >
          <TrendingUp size={16} />
          Analytics PPM
        </button>
      </div>

      {/* Contenu principal */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {isLoading ? (
          <div style={{ display: 'flex', height: '250px', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'var(--slate)', fontSize: '14px', fontWeight: 500 }}>Chargement du PPM...</span>
          </div>
        ) : (
          <>
            {activeTab === 'MATRIX' && (
              <div style={{ height: 'calc(100vh - 220px)', minHeight: '500px', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--line-soft)', overflow: 'hidden' }}>
                <PPMMatrix lignes={lignes} onRowClick={handleOpenForm} />
              </div>
            )}
            
            {activeTab === 'WORKFLOW' && activeVersion && (
              <PPMWorkflowView
                version={activeVersion}
                workflowSteps={workflowSteps}
                workflowLogs={workflowLogs}
                availableActions={availableActions}
                onExecuteAction={(action, payload) =>
                  executeWorkflowAction(activeVersionId, action, payload)
                }
              />
            )}

            {activeTab === 'BI' && (
              <PPMBIView
                biMetrics={biMetrics}
                totalEstimeBase={totalEstimeBase}
                isLoading={isLoadingPPM}
              />
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
