import { Link } from 'react-router-dom';

export default function ProjectsPage() {
  return (
    <section className="screen active" id="screen-project-list">
      <div className="page-head">
        <div>
          <div className="page-title">Projets</div>
          <div className="page-sub">42 projets répartis sur 9 bailleurs et 14 pays</div>
        </div>
        <div className="page-actions">
          <button className="btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v13m0 0 4-4m-4 4-4-4"/><path d="M4 17v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/></svg>
            Exporter
          </button>
          <Link to="/projects/new" className="btn btn-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            Nouveau Projet
          </Link>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-top"><span className="kpi-label">Total des Projets</span></div>
          <div className="kpi-value">42</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-top"><span className="kpi-label">Actifs</span></div>
          <div className="kpi-value" style={{ color: 'var(--green)' }}>31</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-top"><span className="kpi-label">Terminés</span></div>
          <div className="kpi-value" style={{ color: 'var(--slate)' }}>7</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-top"><span className="kpi-label">Budget du Portefeuille</span></div>
          <div className="kpi-value">$284.6M</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-body" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', padding: '14px 18px' }}>
          <select className="filter-select"><option>Bailleur : Tous</option><option>Banque Mondiale</option><option>Union Européenne</option><option>USAID</option><option>AFD</option><option>PNUD</option></select>
          <select className="filter-select"><option>Pays : Tous</option><option>Sénégal</option><option>Côte d'Ivoire</option><option>Mali</option><option>Bénin</option><option>Niger</option></select>
          <select className="filter-select"><option>Région : Toutes</option><option>Afrique de l'Ouest</option><option>Afrique Centrale</option><option>Afrique de l'Est</option></select>
          <select className="filter-select"><option>Secteur : Tous</option><option>Infrastructure</option><option>Santé</option><option>Agriculture</option><option>Énergie</option><option>Eau & Assainissement</option></select>
          <select className="filter-select"><option>Année : Toutes</option><option>2026</option><option>2025</option><option>2024</option></select>
          <select className="filter-select"><option>Statut : Tous</option><option>En bonne voie</option><option>À risque</option><option>En retard</option><option>Clôturé</option></select>
          <button className="btn" style={{ marginLeft: 'auto' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M7 12h10M10 18h4"/></svg>
            Plus de filtres
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-body tight">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th><th>Nom du Projet</th><th>Bailleur</th><th>Chef de Projet</th>
                <th>Date Début</th><th>Date Fin</th><th>Budget</th><th>Statut</th><th>Profil</th><th>Progression</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="cell-mono">PROJ-014</td>
                <td className="cell-strong"><Link to="/projects/14" className="cell-link">Électrification Rurale Phase II</Link></td>
                <td>AFD</td>
                <td>Hassan Diallo</td>
                <td>01/2023</td>
                <td>12/2026</td>
                <td className="cell-mono">$24.6M</td>
                <td><span className="chip delayed">En retard</span></td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '30px', height: '4px', background: 'var(--line)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `35%`, height: '100%', background: 'var(--amber)' }}></div>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--amber)' }}>35%</span>
                  </div>
                </td>
                <td>
                  <div className="progress-wrap">
                    <div className="progress-track"><div className="progress-fill red" style={{ width: '76%' }}></div></div>
                    <span className="pct">76%</span>
                  </div>
                </td>
                <td><button className="btn">Gérer</button></td>
              </tr>
              {/* Other rows omitted for brevity */}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '14px' }}>
        <div style={{ fontSize: '12.5px', color: 'var(--slate)' }}>Affichage de 1 à 10 sur 42 projets</div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button className="btn" style={{ padding: '0 11px', height: '32px' }}>‹ Préc</button>
          <button className="btn btn-primary" style={{ padding: '0 11px', height: '32px', width: '32px', justifyContent: 'center' }}>1</button>
          <button className="btn" style={{ padding: '0 11px', height: '32px', width: '32px', justifyContent: 'center' }}>2</button>
          <button className="btn" style={{ padding: '0 11px', height: '32px', width: '32px', justifyContent: 'center' }}>3</button>
          <button className="btn" style={{ padding: '0 11px', height: '32px', width: '32px', justifyContent: 'center' }}>4</button>
          <button className="btn" style={{ padding: '0 11px', height: '32px' }}>Suiv ›</button>
        </div>
      </div>
    </section>
  );
}
