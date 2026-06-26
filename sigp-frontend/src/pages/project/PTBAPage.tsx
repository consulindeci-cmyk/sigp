import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { FileText, Calendar, ListTree, Activity, Clock, CheckCircle2, AlertCircle, LayoutGrid, BarChart2, GitCommit, ChevronDown, Flame, TrendingUp } from 'lucide-react';
import { usePTBA, useWorkflowPTBA } from '@/hooks/usePTBA';
import { useUIStore } from '@/stores/uiStore';
import { formatMoney } from '@/utils/format';
import PTBAMatrix from '@/components/project/ptba/views/PTBAMatrix';
import type { PTBA } from '@/types';

export default function PTBAPage() {
  const { id: urlProjectId } = useParams();
  const { activeProjectId } = useUIStore();
  const resolvedProjectId = urlProjectId || activeProjectId || '';

  const [annee, setAnnee] = useState<number>(new Date().getFullYear());
  const [versionSelectionnee, setVersionSelectionnee] = useState<string>('latest');
  const [activeTab, setActiveTab] = useState<'MATRIX' | 'CALENDAR' | 'GANTT'>('MATRIX');
  
  const { data: ptbaResponse, isLoading, error } = usePTBA(resolvedProjectId, annee);
  const workflowMutation = useWorkflowPTBA(resolvedProjectId);

  // Local state for real-time KPI updates when editing the matrix
  const [localPtba, setLocalPtba] = useState<PTBA | null>(null);

  React.useEffect(() => {
    if (ptbaResponse?.data) setLocalPtba(ptbaResponse?.data);
  }, [ptbaResponse?.data]);

  const ptba = localPtba;

  if (!resolvedProjectId) {
    return (
      <div className="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        <div className="es-title">Aucun projet sélectionné</div>
        <div className="es-sub">Veuillez sélectionner un projet pour afficher son PTBA.</div>
      </div>
    );
  }

  const renderStatusBadge = (statut?: string) => {
    switch (statut) {
      case 'APPROUVE': return <span className="chip chip-success">Approuvé</span>;
      case 'BROUILLON': return <span className="chip chip-slate">Brouillon</span>;
      case 'EN_PREPARATION': return <span className="chip" style={{ background: 'var(--blue-50)', color: 'var(--blue-700)' }}>En préparation</span>;
      case 'SOUMIS': return <span className="chip chip-warning">Soumis</span>;
      case 'EN_REVISION': return <span className="chip chip-danger">En Révision</span>;
      case 'ARCHIVE': return <span className="chip chip-slate">Archivé</span>;
      default: return <span className="chip">{statut}</span>;
    }
  };

  const handleActionWorkflow = (action: 'SOUMETTRE' | 'APPROUVER' | 'REJETER') => {
    if (!ptba) return;
    
    let targetStatus = ptba.statut;
    if (action === 'SOUMETTRE') targetStatus = 'SOUMIS';
    if (action === 'APPROUVER') targetStatus = 'APPROUVE';
    if (action === 'REJETER') targetStatus = 'REJETE';
    
    workflowMutation.mutate({ ptbaId: ptba.id, nouveauStatut: targetStatus, commentaire: `Action : ${action}` });
  };

  return (
    <div style={{ padding: '0 0 40px' }}>
      
      {/* HEADER AVANCÉ (Année & Version) */}
      <div className="page-head" style={{ marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h1 className="page-title">PTBA {annee}</h1>
            {ptba && renderStatusBadge(ptba.statut)}
            
            {/* Version Selector */}
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface)', border: '1px solid var(--line)', padding: '2px 8px', borderRadius: '4px', gap: '6px' }}>
              <GitCommit size={14} color="var(--slate)" />
              <select 
                value={versionSelectionnee} 
                onChange={e => setVersionSelectionnee(e.target.value)}
                style={{ border: 'none', background: 'transparent', fontSize: '12px', fontWeight: 600, color: 'var(--navy-900)', outline: 'none', cursor: 'pointer' }}
              >
                <option value="latest">{ptba?.nom_version || 'Version Actuelle'} (Active)</option>
                <option value="v1.0">PTBA 2026 v1.0 (Archive)</option>
              </select>
            </div>
            
          </div>
          <p className="page-sub">Plan de Travail et Budget Annuel - Planification multidimensionnelle</p>
        </div>
        <div className="page-actions">
          <select className="filter-select" value={annee} onChange={e => setAnnee(Number(e.target.value))}>
            <option value={2024}>Année 2024</option>
            <option value={2025}>Année 2025</option>
            <option value={2026}>Année 2026</option>
          </select>
          <button className="btn">
            <FileText size={15} /> Export
          </button>
          
          {/* MOCK WORKFLOW ACTIONS */}
          {ptba?.statut === 'BROUILLON' && (
            <button className="btn btn-primary" onClick={() => handleActionWorkflow('SOUMETTRE')} disabled={workflowMutation.isPending}>
              <CheckCircle2 size={15} /> Soumettre pour approbation
            </button>
          )}
          {ptba?.statut === 'SOUMIS' && (
            <>
              <button className="btn" onClick={() => handleActionWorkflow('REJETER')} disabled={workflowMutation.isPending} style={{ color: 'var(--red)' }}>
                Rejeter
              </button>
              <button className="btn btn-primary" onClick={() => handleActionWorkflow('APPROUVER')} disabled={workflowMutation.isPending} style={{ background: 'var(--green-600)', borderColor: 'var(--green-600)' }}>
                <CheckCircle2 size={15} /> Approuver (vMajeure)
              </button>
            </>
          )}
        </div>
      </div>

      {/* DASHBOARD (KPIs & Placeholders Avancés) */}
      <div className="kpi-grid" style={{ marginBottom: '16px' }}>
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Budget Planifié</span>
            <div className="kpi-icon navy"><BarChart2 size={16} /></div>
          </div>
          <div className="kpi-value">{ptba ? formatMoney(ptba.budget_total) : '-'}</div>
          <div className="kpi-foot">
            <div className="progress-track" style={{ height: '4px', width: '60px' }}>
              <div className="progress-fill navy" style={{ width: '100%' }}></div>
            </div>
            <span>Base de la Planned Value</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Engagé sur PTBA</span>
            <div className="kpi-icon amber"><Clock size={16} /></div>
          </div>
          <div className="kpi-value">{ptba ? formatMoney(5000000) : '-'}</div>
          <div className="kpi-foot">
            <div className="progress-track" style={{ height: '4px', width: '60px' }}>
              <div className="progress-fill amber" style={{ width: '3.3%' }}></div>
            </div>
            <span>3.3% du plan annuel engagé</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Décaissements PTBA</span>
            <div className="kpi-icon green"><CheckCircle2 size={16} /></div>
          </div>
          <div className="kpi-value">{ptba ? formatMoney(2000000) : '-'}</div>
          <div className="kpi-foot">
            <div className="progress-track" style={{ height: '4px', width: '60px' }}>
              <div className="progress-fill green" style={{ width: '1.3%' }}></div>
            </div>
            <span>Taux d'absorption: 1.3%</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Activités Planifiées</span>
            <div className="kpi-icon"><Activity size={16} /></div>
          </div>
          <div className="kpi-value">{ptba?.lignes?.length || 0}</div>
          <div className="kpi-foot">
            <span style={{ color: 'var(--red)' }}><AlertCircle size={12} style={{ display: 'inline', verticalAlign: 'text-bottom' }}/> 0 critique(s) en retard</span>
          </div>
        </div>
      </div>

      {/* DASHBOARD GRAPHICS PLACEHOLDERS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="panel" role="figure" aria-label="Graphique Courbe en S de la Planned Value" style={{ padding: '20px', minHeight: '200px', display: 'flex', flexDirection: 'column' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontWeight: 600, color: 'var(--navy-900)' }} aria-hidden="true">
             <TrendingUp size={16} color="var(--navy-500)" />
             Courbe en S (Planned Value)
           </div>
           <div style={{ flex: 1, border: '1px dashed var(--line)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--slate)' }} aria-hidden="true">
              [Graphique S-Curve Cumulatif - Prévu pour l'Étape 4]
           </div>
        </div>
        <div className="panel" role="figure" aria-label="Heatmap d'Intensité Budgétaire Mensuelle" style={{ padding: '20px', minHeight: '200px', display: 'flex', flexDirection: 'column' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontWeight: 600, color: 'var(--navy-900)' }} aria-hidden="true">
             <Flame size={16} color="var(--orange)" />
             Heatmap d'Intensité Budgétaire
           </div>
           <div style={{ flex: 1, border: '1px dashed var(--line)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--slate)' }} aria-hidden="true">
              [Matrice colorimétrique mensuelle - Prévu pour l'Étape 4]
           </div>
        </div>
      </div>

      {/* TABS */}
      <div className="tabs" style={{ marginBottom: '20px' }}>
        <button className={`tab ${activeTab === 'MATRIX' ? 'active' : ''}`} onClick={() => setActiveTab('MATRIX')}>
          <LayoutGrid size={15} /> Matrice (Annuelle & Mensuelle)
        </button>
        <button className={`tab ${activeTab === 'CALENDAR' ? 'active' : ''}`} onClick={() => setActiveTab('CALENDAR')}>
          <Calendar size={15} /> Calendrier Mensuel
        </button>
        <button className={`tab ${activeTab === 'GANTT' ? 'active' : ''}`} onClick={() => setActiveTab('GANTT')}>
          <ListTree size={15} /> Gantt & Chronologie
        </button>
      </div>

      {/* CONTENT PLACEHOLDERS */}
      <div className="panel">
        <div className="panel-body">
          {isLoading ? (
            <div className="empty-state" style={{ padding: '60px 0' }}>
              <div className="spinner" style={{ width: '32px', height: '32px', border: '3px solid var(--line-soft)', borderTopColor: 'var(--navy-900)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            </div>
          ) : error ? (
             <div className="empty-state">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
               <div className="es-title" style={{ color: 'var(--red)' }}>Erreur de chargement</div>
               <div className="es-sub">Impossible de charger le PTBA.</div>
             </div>
          ) : !ptba ? (
             <div className="empty-state">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
               <div className="es-title">Aucun PTBA pour {annee}</div>
               <div className="es-sub">Aucun plan n'a encore été généré pour cette année.</div>
               <div style={{ marginTop: '16px' }}>
                 <button className="btn btn-primary">Générer à partir du WBS</button>
               </div>
             </div>
          ) : activeTab === 'MATRIX' ? (
            <div>
              {/* OUTILS DE PRODUCTIVITÉ (Étape 3) */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', background: 'var(--slate-50)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--line-soft)' }}>
                 <button className="btn btn-outline" style={{ fontSize: '12px' }} disabled title="Sera implémenté via hook useBulkEdit">
                   Édition Multiple (Bulk)
                 </button>
                 <button className="btn btn-outline" style={{ fontSize: '12px' }} disabled title="Lissage automatique du budget sur 12 mois">
                   Lissage Automatique
                 </button>
                 <button className="btn btn-outline" style={{ fontSize: '12px' }} disabled title="Copier un trimestre vers un autre">
                   Copier Trimestre
                 </button>
                 <div style={{ flex: 1 }}></div>
                 <button className="btn btn-outline" style={{ fontSize: '12px' }} disabled>
                   Importer Excel
                 </button>
              </div>
              <PTBAMatrix ptba={ptba} onUpdatePTBA={setLocalPtba} />
            </div>
          ) : (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--slate)' }}>
              <div style={{ marginBottom: '16px' }}>
                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="48" height="48" style={{ color: 'var(--line-strong)' }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
              </div>
              <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink)' }}>Développement en cours</p>
              <p style={{ marginTop: '8px', maxWidth: '400px', margin: '8px auto 0' }}>La vue {activeTab} sera développée lors d'une prochaine étape.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
