export default function TabLogframe() {
  return (
    <div className="tab-panel active" id="tab-logframe">
      <div className="page-head" style={{ marginBottom: '14px' }}>
        <div><div className="section-label" style={{ margin: 0 }}>Matrice du Cadre Logique</div></div>
        <div className="page-actions">
          <button className="btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v13m0 0 4-4m-4 4-4-4"/><path d="M4 17v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/></svg>Exporter</button>
          <button className="btn btn-primary"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>Ajouter un Indicateur</button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-body tight">
          <table className="data-table">
            <thead><tr>
              <th style={{ minWidth: '110px' }}>Niveau</th><th style={{ minWidth: '200px' }}>Indicateur</th><th>Référence (Baseline)</th><th>Cible</th>
              <th style={{ minWidth: '180px' }}>Source de Vérification</th><th style={{ minWidth: '180px' }}>Hypothèses</th><th style={{ minWidth: '160px' }}>Risques</th>
            </tr></thead>
            <tbody>
              <tr>
                <td><span className="level-tag impact">Impact</span></td>
                <td className="cell-strong">Taux d'accès à l'électricité en milieu rural</td>
                <td>12% (2022)</td>
                <td>25% (2026)</td>
                <td>Rapports nationaux d'énergie</td>
                <td>Stabilité macro-économique</td>
                <td><span className="chip closed">Faible</span></td>
              </tr>
              <tr>
                <td><span className="level-tag outcome">Effet</span></td>
                <td className="cell-strong">Nombre de foyers raccordés</td>
                <td>0</td>
                <td>50,000</td>
                <td>Rapports d'opérateurs</td>
                <td>Abonnements abordables</td>
                <td><span className="chip at-risk">Modéré</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
