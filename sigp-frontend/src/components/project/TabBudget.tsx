export default function TabBudget() {
  return (
    <div className="tab-panel active" id="tab-budget">
      <div className="page-head" style={{ marginBottom: '14px' }}>
        <div><div className="section-label" style={{ margin: 0 }}>Budget & Finance</div></div>
        <div className="page-actions">
          <button className="btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v13m0 0 4-4m-4 4-4-4"/><path d="M4 17v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/></svg>Exporter</button>
          <button className="btn btn-primary"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>Ajouter Ligne Budgétaire</button>
        </div>
      </div>

      <div className="row-2">
        <div className="panel">
          <div className="panel-head"><span className="panel-title">Budget vs Réel<span className="muted">Par trimestre, en millions USD</span></span></div>
          <div className="panel-body" id="bf-chart-vsactual">
            <div className="h-40 bg-canvas flex items-center justify-center text-slate rounded">Graphe Budget vs Réel</div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-head"><span className="panel-title">Taux de Consommation<span className="muted">Décaissement mensuel</span></span></div>
          <div className="panel-body" id="bf-chart-burn">
            <div className="h-40 bg-canvas flex items-center justify-center text-slate rounded">Graphe Burn Rate</div>
          </div>
        </div>
      </div>
      <div className="row-2">
        <div className="panel">
          <div className="panel-head"><span className="panel-title">Allocation Budgétaire<span className="muted">Par composante</span></span></div>
          <div className="panel-body" id="bf-chart-allocation">
            <div className="h-40 bg-canvas flex items-center justify-center text-slate rounded">Graphe d'allocation</div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-head"><span className="panel-title">Contribution Bailleurs</span></div>
          <div className="panel-body" id="bf-chart-donor">
            <div className="h-40 bg-canvas flex items-center justify-center text-slate rounded">Graphe bailleurs</div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><span className="panel-title">Lignes Budgétaires</span></div>
        <div className="panel-body tight">
          <table className="data-table">
            <thead><tr>
              <th style={{ minWidth: '200px' }}>Ligne Budgétaire</th><th>Qté</th><th>Coût Unitaire</th><th>Budget Prévu</th>
              <th>Engagé</th><th>Décaissé</th><th>Solde</th><th>Taux de Conso.</th>
            </tr></thead>
            <tbody>
              <tr>
                <td className="cell-strong">1.1 Équipements de réseau</td>
                <td>1</td>
                <td>$5.2M</td>
                <td>$5.2M</td>
                <td>$4.8M</td>
                <td>$3.1M</td>
                <td>$2.1M</td>
                <td><div className="progress-wrap"><div className="progress-track"><div className="progress-fill navy" style={{ width: '59%' }}></div></div><span className="pct">59%</span></div></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
