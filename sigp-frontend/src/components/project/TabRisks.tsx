export default function TabRisks() {
  return (
    <div className="tab-panel active" id="tab-risks">
      <div className="page-head" style={{ marginBottom: '14px' }}>
        <div><div className="section-label" style={{ margin: 0 }}>Registre des Risques</div></div>
        <div className="page-actions">
          <button className="btn btn-primary"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>Nouveau Risque</button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card"><div className="kpi-top"><span className="kpi-label">Total des Risques</span></div><div className="kpi-value">11</div></div>
        <div className="kpi-card"><div className="kpi-top"><span className="kpi-label">Critiques</span></div><div className="kpi-value" style={{ color: 'var(--red)' }}>3</div></div>
        <div className="kpi-card"><div className="kpi-top"><span className="kpi-label">Modérés</span></div><div className="kpi-value" style={{ color: 'var(--amber)' }}>5</div></div>
        <div className="kpi-card"><div className="kpi-top"><span className="kpi-label">Faibles</span></div><div className="kpi-value" style={{ color: 'var(--green)' }}>3</div></div>
      </div>

      <div className="row-2-rev">
        <div className="panel">
          <div className="panel-head"><span className="panel-title">Matrice des Risques<span className="muted">Probabilité × Impact</span></span></div>
          <div className="panel-body" id="risk-heatmap">
             <div className="h-48 bg-canvas flex items-center justify-center text-slate rounded">Heatmap des Risques</div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-head"><span className="panel-title">Suivi<span className="muted">Aperçu des statuts</span></span></div>
          <div className="panel-body" id="risk-monitoring">
             <div className="h-48 bg-canvas flex items-center justify-center text-slate rounded">Graphe de suivi</div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><span className="panel-title">Registre des Risques</span></div>
        <div className="panel-body tight">
          <table className="data-table">
            <thead><tr>
              <th style={{ minWidth: '200px' }}>Risque</th><th>Catégorie</th><th>Probabilité</th><th>Impact</th><th>Criticité</th>
              <th>Propriétaire</th><th style={{ minWidth: '220px' }}>Plan d'Atténuation</th><th>Statut</th>
            </tr></thead>
            <tbody>
              <tr>
                <td className="cell-strong">Retard de livraison des transformateurs</td>
                <td>Chaîne d'approvisionnement</td>
                <td>Élevée</td>
                <td>Majeur</td>
                <td><div className="crit-badge" style={{ backgroundColor: 'var(--red)' }}>Critique</div></td>
                <td>Équipe Achats</td>
                <td>Sourcer des fournisseurs alternatifs régionaux</td>
                <td><span className="chip at-risk">Surveillance accrue</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
