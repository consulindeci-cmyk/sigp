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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'var(--surface)' }}>
      
      {/* HEADER COCKPIT (ERP Bandeau) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', background: 'var(--surface)', borderBottom: '1px solid var(--line-strong)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--navy-900)' }}>PTBA {annee}</h1>
            {ptba && renderStatusBadge(ptba.statut)}
          </div>
          
          <div style={{ width: '1px', height: '16px', background: 'var(--line)' }} />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
            <GitCommit size={13} color="var(--slate)" />
            <select 
              value={versionSelectionnee} 
              onChange={e => setVersionSelectionnee(e.target.value)}
              style={{ border: 'none', background: 'transparent', fontWeight: 600, color: 'var(--navy-900)', outline: 'none', cursor: 'pointer', padding: 0 }}
            >
              <option value="latest">{ptba?.nom_version || 'Version Actuelle'} (Active)</option>
              <option value="v1.0">PTBA 2026 v1.0</option>
            </select>
          </div>

          <div style={{ width: '1px', height: '16px', background: 'var(--line)' }} />

          <div style={{ fontSize: '12px', color: 'var(--slate)' }}>
            Resp: <span style={{ fontWeight: 600, color: 'var(--navy-900)' }}>Baba Traore</span>
          </div>

          <div style={{ width: '1px', height: '16px', background: 'var(--line)' }} />

          <div style={{ fontSize: '12px', color: 'var(--slate)' }}>
            MàJ: <span style={{ fontWeight: 500, color: 'var(--navy-900)' }}>Aujourd'hui, 09:42</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select 
            value={annee} 
            onChange={e => setAnnee(Number(e.target.value))}
            style={{ fontSize: '12px', padding: '4px 8px', border: '1px solid var(--line)', borderRadius: '4px', background: 'var(--canvas)', color: 'var(--ink)' }}
          >
            <option value={2024}>Ex 2024</option>
            <option value={2025}>Ex 2025</option>
            <option value={2026}>Ex 2026</option>
          </select>
          
          {ptba?.statut === 'BROUILLON' && (
            <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '12px' }} onClick={() => handleActionWorkflow('SOUMETTRE')} disabled={workflowMutation.isPending}>
              <CheckCircle2 size={13} /> Soumettre
            </button>
          )}
          {ptba?.statut === 'SOUMIS' && (
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

      {/* DASHBOARD COMPACT & TABS (Flex Column) */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        
        {/* TOP METRICS & WIDGETS ROW */}
        <div style={{ display: 'flex', gap: '16px', padding: '16px', background: 'var(--canvas)', borderBottom: '1px solid var(--line)', flexShrink: 0, flexWrap: 'wrap' }}>
          
          {/* KPI Mini-Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', flex: '1 1 400px' }}>
            <div style={{ background: 'var(--surface)', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--line-soft)', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '11px', color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Budget Planifié</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--navy-900)', fontFamily: 'monospace' }}>{ptba ? formatMoney(ptba.budget_total) : '-'}</div>
              <div style={{ marginTop: '6px', height: '3px', background: 'var(--line-soft)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: '100%', height: '100%', background: 'var(--navy-500)' }} />
              </div>
            </div>
            <div style={{ background: 'var(--surface)', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--line-soft)', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '11px', color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Engagé / Décaissements</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--amber-600)', fontFamily: 'monospace' }}>{ptba ? formatMoney(5000000) : '-'}</div>
              <div style={{ marginTop: '6px', height: '3px', background: 'var(--line-soft)', borderRadius: '2px', overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: '3.3%', height: '100%', background: 'var(--amber-500)' }} title="Engagé" />
                <div style={{ width: '1.3%', height: '100%', background: 'var(--green-500)' }} title="Décaissé" />
              </div>
            </div>
          </div>

          {/* S-Curve Widget Simulé */}
          <div style={{ flex: 1, background: 'var(--surface)', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--line-soft)', boxShadow: '0 1px 2px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }} role="figure" aria-label="Courbe en S d'absorption budgétaire">
             <div style={{ fontSize: '11px', color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><TrendingUp size={12}/> Absorption (S-Curve)</div>
             <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '2px', paddingBottom: '4px' }}>
               {/* Faux graph bar + line */}
               {[10, 15, 25, 40, 55, 65, 80, 85, 90, 95, 98, 100].map((h, i) => (
                 <div key={i} style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'flex-end', position: 'relative' }}>
                   <div style={{ width: '100%', height: `${h}%`, background: 'var(--blue-100)', borderRadius: '2px 2px 0 0' }} />
                   <div style={{ position: 'absolute', bottom: `${h}%`, left: '50%', width: '6px', height: '6px', background: 'var(--blue-600)', borderRadius: '50%', transform: 'translate(-50%, 50%)' }} />
                 </div>
               ))}
             </div>
          </div>

          {/* Heatmap Widget Simulé */}
          <div style={{ flex: 1, background: 'var(--surface)', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--line-soft)', boxShadow: '0 1px 2px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }} role="figure" aria-label="Heatmap Financière">
             <div style={{ fontSize: '11px', color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><Flame size={12}/> Densité d'activité mensuelle</div>
             <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2px', alignItems: 'center' }}>
                {[0.1, 0.2, 0.4, 0.8, 1, 0.7, 0.3, 0.2, 0.6, 0.9, 0.5, 0.1].map((op, i) => (
                  <div key={i} style={{ aspectRatio: '1/1', background: `rgba(249, 115, 22, ${op})`, borderRadius: '2px' }} title={`Mois ${i+1}`} />
                ))}
             </div>
          </div>

        </div>

        {/* TABS (Navigation ERP) */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--line-strong)', background: 'var(--surface)', padding: '0 16px', flexShrink: 0 }}>
          <button style={{ padding: '12px 16px', background: 'none', border: 'none', borderBottom: activeTab === 'MATRIX' ? '2px solid var(--navy-600)' : '2px solid transparent', color: activeTab === 'MATRIX' ? 'var(--navy-900)' : 'var(--slate)', fontWeight: activeTab === 'MATRIX' ? 600 : 500, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setActiveTab('MATRIX')}>
            <LayoutGrid size={14} /> Matrice Financière
          </button>
          <button style={{ padding: '12px 16px', background: 'none', border: 'none', borderBottom: activeTab === 'CALENDAR' ? '2px solid var(--navy-600)' : '2px solid transparent', color: activeTab === 'CALENDAR' ? 'var(--navy-900)' : 'var(--slate)', fontWeight: activeTab === 'CALENDAR' ? 600 : 500, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setActiveTab('CALENDAR')}>
            <Calendar size={14} /> Calendrier Mensuel
          </button>
          <button style={{ padding: '12px 16px', background: 'none', border: 'none', borderBottom: activeTab === 'GANTT' ? '2px solid var(--navy-600)' : '2px solid transparent', color: activeTab === 'GANTT' ? 'var(--navy-900)' : 'var(--slate)', fontWeight: activeTab === 'GANTT' ? 600 : 500, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setActiveTab('GANTT')}>
            <ListTree size={14} /> Gantt & Chronologie
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
               <div className="es-sub">Impossible de charger le PTBA.</div>
             </div>
          ) : !ptba ? (
             <div className="empty-state" style={{ height: '100%' }}>
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32" color="var(--slate)"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
               <div className="es-title">Aucun PTBA pour {annee}</div>
               <div className="es-sub">Aucun plan n'a encore été généré pour cette année.</div>
               <div style={{ marginTop: '16px' }}>
                 <button className="btn btn-primary" style={{ fontSize: '13px', padding: '6px 16px' }}>Générer à partir du WBS</button>
               </div>
             </div>
          ) : activeTab === 'MATRIX' ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* OUTILS DE PRODUCTIVITÉ (Ribbon ERP) */}
              <div style={{ display: 'flex', gap: '8px', padding: '8px 16px', background: 'var(--canvas)', borderBottom: '1px solid var(--line)', flexShrink: 0 }}>
                 <button className="btn btn-outline" style={{ fontSize: '12px', padding: '4px 10px', height: 'auto', background: 'var(--surface)', border: '1px solid var(--line)' }} disabled title="Sera implémenté via hook useBulkEdit">
                   Édition Multiple (Bulk)
                 </button>
                 <button className="btn btn-outline" style={{ fontSize: '12px', padding: '4px 10px', height: 'auto', background: 'var(--surface)', border: '1px solid var(--line)' }} disabled title="Lissage automatique du budget sur 12 mois">
                   Lissage Auto
                 </button>
                 <button className="btn btn-outline" style={{ fontSize: '12px', padding: '4px 10px', height: 'auto', background: 'var(--surface)', border: '1px solid var(--line)' }} disabled title="Copier un trimestre vers un autre">
                   Copier Trim.
                 </button>
                 <div style={{ width: '1px', height: '24px', background: 'var(--line)', margin: '0 4px' }} />
                 <button className="btn btn-outline" style={{ fontSize: '12px', padding: '4px 10px', height: 'auto', background: 'var(--surface)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: '4px' }} disabled>
                   <FileText size={12} /> Exporter XLSX
                 </button>
              </div>
              
              {/* CONTENEUR MATRICE (Prend le reste de l'espace) */}
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <PTBAMatrix ptba={ptba} onUpdatePTBA={setLocalPtba} />
              </div>
            </div>
          ) : (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--slate)', height: '100%' }}>
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
