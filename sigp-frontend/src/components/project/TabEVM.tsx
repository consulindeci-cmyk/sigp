export default function TabEVM() {
  return (
    <div className="tab-panel active" id="tab-evm">
      <div className="page-head" style={{ marginBottom: '14px' }}>
        <div><div className="section-label" style={{ margin: 0 }}>Gestion de la Valeur Acquise (EVM)</div></div>
        <div className="page-actions">
          <button className="btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v13m0 0 4-4m-4 4-4-4"/><path d="M4 17v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/></svg>Exporter Rapport EVM</button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card"><div className="kpi-top"><span className="kpi-label">IPC Global</span></div><div className="kpi-value" style={{ color: 'var(--amber)' }}>0.91</div><div className="kpi-foot">Léger dépassement de coût</div></div>
        <div className="kpi-card"><div className="kpi-top"><span className="kpi-label">IPD Global</span></div><div className="kpi-value" style={{ color: 'var(--red)' }}>0.79</div><div className="kpi-foot">En retard sur le planning</div></div>
        <div className="kpi-card"><div className="kpi-top"><span className="kpi-label">Estimation à l'Achèvement (EAC)</span></div><div className="kpi-value">$27.0M</div><div className="kpi-foot">vs $24.6M (Budget initial)</div></div>
        <div className="kpi-card"><div className="kpi-top"><span className="kpi-label">Score de Performance</span></div><div className="kpi-value" style={{ color: 'var(--amber)' }}>B−</div><div className="kpi-foot">IPC/IPD combinés</div></div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <span className="panel-title">Courbe en S<span className="muted">Valeur Planifiée (VP) · Valeur Acquise (VA) · Coût Réel (CR), cumul en millions USD</span></span>
        </div>
        <div className="panel-body" id="evm-scurve">
          <div className="h-48 bg-canvas flex items-center justify-center text-slate rounded">Courbe en S</div>
        </div>
      </div>

      <div className="row-2">
        <div className="panel">
          <div className="panel-head"><span className="panel-title">Tendance IPC</span></div>
          <div className="panel-body" id="evm-cpi-trend"><div className="h-40 bg-canvas flex items-center justify-center text-slate rounded">Graphe IPC</div></div>
        </div>
        <div className="panel">
          <div className="panel-head"><span className="panel-title">Tendance IPD</span></div>
          <div className="panel-body" id="evm-spi-trend"><div className="h-40 bg-canvas flex items-center justify-center text-slate rounded">Graphe IPD</div></div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><span className="panel-title">Indicateurs EVM<span className="muted">À date (Juin 2026)</span></span></div>
        <div className="panel-body tight">
          <table className="data-table">
            <thead><tr><th>Indicateur</th><th>Définition</th><th>Valeur</th><th>Statut</th></tr></thead>
            <tbody>
              <tr>
                <td className="cell-strong">Écart de Coût (CV)</td>
                <td>Valeur Acquise - Coût Réel</td>
                <td className="cell-mono" style={{ color: 'var(--amber)' }}>-$1.2M</td>
                <td>Défavorable</td>
              </tr>
              <tr>
                <td className="cell-strong">Écart de Délai (SV)</td>
                <td>Valeur Acquise - Valeur Planifiée</td>
                <td className="cell-mono" style={{ color: 'var(--red)' }}>-$2.8M</td>
                <td>Défavorable</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
