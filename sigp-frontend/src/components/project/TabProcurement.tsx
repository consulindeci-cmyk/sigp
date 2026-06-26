import { useState } from 'react';

export default function TabProcurement() {
  const [view, setView] = useState('plan');

  return (
    <div className="tab-panel active" id="tab-procurement">
      <div className="page-head" style={{ marginBottom: '14px' }}>
        <div><div className="section-label" style={{ margin: 0 }}>Plan de Passation des Marchés</div></div>
        <div className="page-actions">
          <div className="view-toggle">
            <button className={`vt-btn ${view === 'plan' ? 'active' : ''}`} onClick={() => setView('plan')}>Plan de Passation</button>
            <button className={`vt-btn ${view === 'contracts' ? 'active' : ''}`} onClick={() => setView('contracts')}>Suivi des Contrats</button>
            <button className={`vt-btn ${view === 'approval' ? 'active' : ''}`} onClick={() => setView('approval')}>Circuit d'Approbation</button>
            <button className={`vt-btn ${view === 'calendar' ? 'active' : ''}`} onClick={() => setView('calendar')}>Calendrier</button>
          </div>
          <button className="btn btn-primary"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>Nouveau Marché</button>
        </div>
      </div>

      <div className="row-2" style={{ marginBottom: '18px' }}>
        <div className="panel">
          <div className="panel-head"><span className="panel-title">Statut des Contrats</span></div>
          <div className="panel-body" id="proc-chart-status">
            <div className="h-40 bg-canvas flex items-center justify-center text-slate rounded">Graphe statuts</div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-head"><span className="panel-title">Chronologie des Passations<span className="muted">Prévu vs signé, 2026</span></span></div>
          <div className="panel-body" id="proc-chart-timeline">
            <div className="h-40 bg-canvas flex items-center justify-center text-slate rounded">Graphe timeline</div>
          </div>
        </div>
      </div>

      {view === 'plan' && (
        <div id="proc-view-plan">
          <div className="panel">
            <div className="panel-body tight">
              <table className="data-table">
                <thead><tr>
                  <th>Réf Marché</th><th style={{ minWidth: '220px' }}>Description</th><th>Méthode</th>
                  <th>Montant Estimé</th><th>Montant Contrat</th><th>Date Prévue</th><th>Date Signature</th><th>Statut</th>
                </tr></thead>
                <tbody>
                  <tr>
                    <td className="cell-mono">PROC-001</td>
                    <td className="cell-strong">Acquisition de transformateurs</td>
                    <td>Appel d'Offres Ouvert</td>
                    <td>$2.5M</td>
                    <td>$2.4M</td>
                    <td>15/02/2026</td>
                    <td>10/03/2026</td>
                    <td><span className="chip closed">Signé</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Placeholder pour les autres vues */}
      {view !== 'plan' && (
         <div className="panel"><div className="panel-body"><div className="empty-state">
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>
           <div className="es-title">Vue {view}</div>
           <div className="es-sub">Contenu de la vue en cours de développement...</div>
         </div></div></div>
      )}
    </div>
  );
}
