export default function TabReports() {
  return (
    <div className="tab-panel active" id="tab-reports">
      <div className="page-head" style={{ marginBottom: '14px' }}>
        <div><div className="section-label" style={{ margin: 0 }}>Centre de Rapports</div></div>
        <div className="page-actions">
          <button className="btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>Rapports Planifiés</button>
          <button className="btn btn-primary"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>Générer un Rapport</button>
        </div>
      </div>

      <div className="report-grid">
        <div className="report-card">
          <span className="rc-ico navy"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2v20M17 6.5c0-1.7-2-3-5-3s-5 1.3-5 3 2 2.7 5 3 5 1.5 5 3.2-2 3-5 3-5-1.3-5-3"/></svg></span>
          <div className="rc-title">Rapports Financiers</div>
          <div className="rc-sub">Exécution budgétaire, décaissements, contributions bailleurs</div>
        </div>
        <div className="report-card">
          <span className="rc-ico green"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg></span>
          <div className="rc-title">Rapports PTBA</div>
          <div className="rc-sub">Avancement du plan de travail annuel par composante</div>
        </div>
        <div className="report-card">
          <span className="rc-ico navy"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M7 3h10l1 4H6l1-4Z"/><path d="M6 7h12l-1 13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1L6 7Z"/></svg></span>
          <div className="rc-title">Rapports de Passation des Marchés</div>
          <div className="rc-sub">Statut des contrats, respect des délais</div>
        </div>
        <div className="report-card">
          <span className="rc-ico amber"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 17h18M6 17V10m6 7V3h-6v14m-6 0V6H3v11"/></svg></span>
          <div className="rc-title">Rapports M&E</div>
          <div className="rc-sub">Suivi du cadre logique, mise à jour des indicateurs</div>
        </div>
      </div>
    </div>
  );
}
