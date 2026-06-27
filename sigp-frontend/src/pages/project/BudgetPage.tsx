import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useUIStore } from '@/stores/uiStore';
import { useBudget, useBudgetVersion, useBudgetWorkflow } from '@/hooks/useBudget';
import { formatMoney } from '@/utils/format';
import { GitCommit, CheckCircle2, AlertCircle, LayoutGrid, Flame, TrendingUp, DollarSign } from 'lucide-react';
import { BudgetMatrix } from '@/components/project/budget/views/BudgetMatrix';
import { BudgetRevisionsView } from '@/components/project/budget/views/BudgetRevisionsView';
import { BudgetAnalyticsDashboard } from '@/components/project/budget/views/BudgetAnalyticsDashboard';
import { VersionSelector } from '@/components/common/workflow/VersionSelector';

export default function BudgetPage() {
  const { id: urlProjectId } = useParams();
  const { activeProjectId } = useUIStore();
  const resolvedProjectId = urlProjectId || activeProjectId || '';

  const [versionSelectionnee, setVersionSelectionnee] = useState<string>('latest');
  const [activeTab, setActiveTab] = useState<'MATRIX' | 'FINANCES' | 'REVISIONS' | 'BI'>('MATRIX');
  
  const { data: budget, isLoading: isLoadingBudget, error: errorBudget } = useBudget(resolvedProjectId);
  const { data: budgetVersion, isLoading: isLoadingVersion } = useBudgetVersion(resolvedProjectId, versionSelectionnee);
  const workflowMutation = useBudgetWorkflow(resolvedProjectId);

  const isLoading = isLoadingBudget || isLoadingVersion;
  const error = errorBudget;

  if (!resolvedProjectId) {
    return (
      <div className="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        <div className="es-title">Aucun projet sélectionné</div>
        <div className="es-sub">Veuillez sélectionner un projet pour afficher son Budget.</div>
      </div>
    );
  }

  const renderStatusBadge = (statut?: string) => {
    switch (statut) {
      case 'APPROUVE': return <span className="chip chip-success">Approuvé</span>;
      case 'BROUILLON': return <span className="chip chip-slate">Brouillon</span>;
      case 'SOUMIS': return <span className="chip chip-warning">Soumis</span>;
      case 'EN_REVISION': return <span className="chip chip-danger">En Révision</span>;
      case 'ARCHIVE': return <span className="chip chip-slate">Archivé</span>;
      default: return <span className="chip">{statut || 'N/A'}</span>;
    }
  };

  const handleActionWorkflow = (action: 'SOUMETTRE' | 'APPROUVER' | 'REJETER') => {
    if (!budget) return;
    
    let targetStatus = budgetVersion?.statut || 'BROUILLON';
    if (action === 'SOUMETTRE') targetStatus = 'SOUMIS';
    if (action === 'APPROUVER') targetStatus = 'APPROUVE';
    
    workflowMutation.mutate({ budgetId: budget.id, nouveauStatut: targetStatus, commentaire: `Action : ${action}` });
  };

  // Agrégations financières depuis la version mockée
  const totalBAC = budgetVersion?.montant_total_revise || 0;
  const totalPreEngage = budgetVersion?.lignes?.reduce((acc, l) => acc + l.montant_pre_engage, 0) || 0;
  const totalEngage = budgetVersion?.lignes?.reduce((acc, l) => acc + l.montant_engage, 0) || 0;
  const totalDecaisse = budgetVersion?.lignes?.reduce((acc, l) => acc + l.montant_decaisse, 0) || 0;
  const totalDisponible = budgetVersion?.lignes?.reduce((acc, l) => acc + l.solde_disponible, 0) || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'var(--surface)' }}>
      
      {/* HEADER COCKPIT (Responsive) */}
      <div className="panel" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
          <div style={{ flex: '1 1 min-content', minWidth: '280px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: 'var(--navy-900)' }}>
                Budget & Suivi Financier
              </h1> 
              {renderStatusBadge(budgetVersion?.statut)}
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <VersionSelector 
              versions={[
                { id: 'latest', label: budgetVersion?.numero_version || 'Actuelle', isActive: true, statut: budgetVersion?.statut || 'BROUILLON' },
                { id: 'v1.0', label: 'v1.0', description: 'Budget Initial', isActive: false, statut: 'ARCHIVE' }
              ]}
              selectedId={versionSelectionnee}
              onChange={setVersionSelectionnee}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {budgetVersion?.statut === 'BROUILLON' && (
              <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '12px' }} onClick={() => handleActionWorkflow('SOUMETTRE')} disabled={workflowMutation.isPending}>
                <CheckCircle2 size={13} /> Soumettre
              </button>
            )}
            {budgetVersion?.statut === 'SOUMIS' && (
              <>
                <button className="btn" style={{ padding: '4px 12px', fontSize: '12px', color: 'var(--red)' }} onClick={() => handleActionWorkflow('REJETER')} disabled={workflowMutation.isPending}>
                  Rejeter
                </button>
                <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '12px', background: 'var(--green-600)', borderColor: 'var(--green-600)' }} onClick={() => handleActionWorkflow('APPROUVER')} disabled={workflowMutation.isPending}>
                  Approuver
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* DASHBOARD COMPACT & TABS (Flex Column) */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        
        <div style={{ display: 'flex', gap: '16px', padding: '16px', background: 'var(--canvas)', borderBottom: '1px solid var(--line)', flexShrink: 0, flexWrap: 'wrap' }}>
          
          {/* KPI Mini-Cards (Densité ERP) */}
          <div style={{ display: 'flex', gap: '12px', flex: '1 1 600px', flexWrap: 'wrap' }}>
            {/* Jauge 1: BAC */}
            <div style={{ flex: '1 1 140px', background: 'var(--surface)', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--line-soft)', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '11px', color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Budget Révisé (BAC)</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--navy-900)', fontFamily: 'monospace' }}>{formatMoney(totalBAC)}</div>
            </div>
            
            {/* Jauge 2: Pré-engagé */}
            <div style={{ flex: '1 1 140px', background: 'var(--surface)', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--line-soft)', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '11px', color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Pré-engagements (DA)</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--amber-600)', fontFamily: 'monospace' }}>{formatMoney(totalPreEngage)}</div>
            </div>
            
            {/* Jauge 3: Engagé */}
            <div style={{ flex: '1 1 140px', background: 'var(--surface)', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--line-soft)', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '11px', color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Engagements (Contrats)</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--orange-600)', fontFamily: 'monospace' }}>{formatMoney(totalEngage)}</div>
            </div>

            {/* Jauge 4: Décaissé */}
            <div style={{ flex: '1 1 140px', background: 'var(--surface)', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--line-soft)', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '11px', color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Décaissements</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--green-600)', fontFamily: 'monospace' }}>{formatMoney(totalDecaisse)}</div>
            </div>

            {/* Jauge 5: Disponible */}
            <div style={{ flex: '1 1 140px', background: 'var(--surface)', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--line-soft)', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '11px', color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Solde Disponible</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--blue-600)', fontFamily: 'monospace' }}>{formatMoney(totalDisponible)}</div>
            </div>
          </div>

          {/* S-Curve Widget Simulé (Plus grand et orienté BI, Responsive) */}
          <div style={{ flex: '1 1 320px', maxWidth: '400px', background: 'var(--surface)', padding: '16px', borderRadius: '8px', border: '1px solid var(--line-soft)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }} role="figure" aria-label="S-Curve Financière">
             <div style={{ fontSize: '11px', color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}><TrendingUp size={14}/> Décaissements (S-Curve)</div>
             <div style={{ flex: 1, minHeight: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--canvas)', borderRadius: '4px', border: '1px dashed var(--line-strong)' }}>
                <span style={{ fontSize: '12px', color: 'var(--slate)', fontWeight: 500 }}>[Widget BI - S-Curve]</span>
             </div>
          </div>

        </div>

        {/* TABS (Navigation ERP) */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--line-strong)', background: 'var(--surface)', padding: '0 16px', flexShrink: 0 }}>
          <button style={{ padding: '12px 16px', background: 'none', border: 'none', borderBottom: activeTab === 'MATRIX' ? '2px solid var(--navy-600)' : '2px solid transparent', color: activeTab === 'MATRIX' ? 'var(--navy-900)' : 'var(--slate)', fontWeight: activeTab === 'MATRIX' ? 600 : 500, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setActiveTab('MATRIX')}>
            <LayoutGrid size={14} /> Matrice Globale
          </button>
          <button style={{ padding: '12px 16px', background: 'none', border: 'none', borderBottom: activeTab === 'FINANCES' ? '2px solid var(--navy-600)' : '2px solid transparent', color: activeTab === 'FINANCES' ? 'var(--navy-900)' : 'var(--slate)', fontWeight: activeTab === 'FINANCES' ? 600 : 500, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setActiveTab('FINANCES')}>
            <DollarSign size={14} /> Suivi des Financements
          </button>
          <button style={{ padding: '12px 16px', background: 'none', border: 'none', borderBottom: activeTab === 'REVISIONS' ? '2px solid var(--navy-600)' : '2px solid transparent', color: activeTab === 'REVISIONS' ? 'var(--navy-900)' : 'var(--slate)', fontWeight: activeTab === 'REVISIONS' ? 600 : 500, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setActiveTab('REVISIONS')}>
            <GitCommit size={14} /> Révisions & Historique
          </button>
          <button style={{ padding: '12px 16px', background: 'none', border: 'none', borderBottom: activeTab === 'BI' ? '2px solid var(--navy-600)' : '2px solid transparent', color: activeTab === 'BI' ? 'var(--navy-900)' : 'var(--slate)', fontWeight: activeTab === 'BI' ? 600 : 500, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setActiveTab('BI')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg> Dashboard BI
          </button>
        </div>

      {/* CONTENT AREA */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'var(--surface)' }}>
          {isLoading ? (
            <div className="empty-state" style={{ padding: '60px 0', height: '100%' }}>
              <div className="spinner" style={{ width: '32px', height: '32px', border: '3px solid var(--line-soft)', borderTopColor: 'var(--navy-900)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            </div>
          ) : error ? (
             <div className="empty-state" style={{ height: '100%' }}>
               <AlertCircle size={32} color="var(--red)" />
               <div className="es-title" style={{ color: 'var(--red)' }}>Erreur de chargement</div>
               <div className="es-sub">Impossible de charger le Budget.</div>
             </div>
          ) : !budgetVersion ? (
             <div className="empty-state" style={{ height: '100%' }}>
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32" color="var(--slate)"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
               <div className="es-title">Aucun Budget actif</div>
               <div className="es-sub">Le budget de ce projet n'a pas encore été initialisé.</div>
             </div>
          ) : activeTab === 'MATRIX' ? (
             <BudgetMatrix budgetVersion={budgetVersion} />
          ) : activeTab === 'REVISIONS' ? (
             <BudgetRevisionsView budgetVersion={budgetVersion} />
          ) : activeTab === 'BI' ? (
             <BudgetAnalyticsDashboard budgetVersion={budgetVersion} />
          ) : (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--slate)', height: '100%' }}>
              <div style={{ marginBottom: '16px' }}>
                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="48" height="48" style={{ color: 'var(--line-strong)' }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
              </div>
              <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink)' }}>Développement de la vue (Étape suivante)</p>
              <p style={{ marginTop: '8px', maxWidth: '400px', margin: '8px auto 0' }}>La vue {activeTab} sera développée lors d'une prochaine étape, conformément au Master Document.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
