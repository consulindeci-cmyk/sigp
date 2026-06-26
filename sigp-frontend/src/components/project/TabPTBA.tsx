import { useState } from 'react';

export default function TabPTBA() {
  const [view, setView] = useState('table');

  return (
    <div className="tab-panel active" id="tab-ptba">
      <div className="page-head" style={{ marginBottom: '14px' }}>
        <div>
          <div className="section-label" style={{ margin: 0 }}>Plan de Travail et Budget Annuel — 2026</div>
        </div>
        <div className="page-actions">
          <div className="view-toggle">
            <button className={`vt-btn ${view === 'table' ? 'active' : ''}`} onClick={() => setView('table')}>Tableau</button>
            <button className={`vt-btn ${view === 'gantt' ? 'active' : ''}`} onClick={() => setView('gantt')}>Diagramme de Gantt</button>
            <button className={`vt-btn ${view === 'calendar' ? 'active' : ''}`} onClick={() => setView('calendar')}>Vue Calendrier</button>
          </div>
          <button className="btn btn-primary"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>Ajouter Activité</button>
        </div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '18px' }}>
        <div className="kpi-card"><div className="kpi-top"><span className="kpi-label">Activités Terminées</span></div><div className="kpi-value" style={{ color: 'var(--green)' }}>58 <span style={{ fontSize: '14px', color: 'var(--slate-light)' }}>/ 76</span></div></div>
        <div className="kpi-card"><div className="kpi-top"><span className="kpi-label">Budget Annuel Prévu</span></div><div className="kpi-value">$8.9M</div></div>
        <div className="kpi-card"><div className="kpi-top"><span className="kpi-label">Budget Annuel Exécuté</span></div><div className="kpi-value">$5.7M <span style={{ fontSize: '13px', color: 'var(--slate-light)' }}>64%</span></div></div>
      </div>

      {view === 'table' && (
        <div id="ptba-view-table">
          <div className="panel">
            <div className="panel-body tight">
              <table className="data-table">
                <thead><tr>
                  <th>Code Activité</th><th style={{ minWidth: '220px' }}>Activité</th><th>Composante</th><th>Responsable</th>
                  <th>T1</th><th>T2</th><th>T3</th><th>T4</th><th>Budget</th>
                </tr></thead>
                <tbody>
                  <tr>
                    <td className="cell-mono">ACT-1.1.1</td>
                    <td className="cell-strong">Étude d'impact environnemental</td>
                    <td>1. Infrastructure</td>
                    <td>Dr. M. Sarr</td>
                    <td><div className="qcell done">✔</div></td>
                    <td><div className="qcell pending"></div></td>
                    <td><div className="qcell pending"></div></td>
                    <td><div className="qcell pending"></div></td>
                    <td className="cell-mono">$150K</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {view === 'gantt' && (
        <div id="ptba-view-gantt">
          <div className="panel">
            <div className="panel-body">
              <div className="h-48 flex items-center justify-center text-slate">Diagramme de Gantt (Placeholder)</div>
            </div>
          </div>
        </div>
      )}

      {view === 'calendar' && (
        <div id="ptba-view-calendar">
          <div className="panel">
            <div className="panel-body">
              <div className="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>
                <div className="es-title">Vue calendrier</div>
                <div className="es-sub">Basculez vers Tableau ou Gantt pour voir les activités programmées.</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
