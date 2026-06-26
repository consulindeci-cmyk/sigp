export default function TabDocuments() {
  return (
    <div className="tab-panel active" id="tab-pdocuments">
      <div className="page-head" style={{ marginBottom: '14px' }}>
        <div><div className="section-label" style={{ margin: 0 }}>Documents du Projet</div></div>
        <div className="page-actions">
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', width: '15px', height: '15px', color: 'var(--slate-light)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
            <input type="text" placeholder="Rechercher des documents…" style={{ height: '36px', border: '1px solid var(--line)', borderRadius: '7px', padding: '0 12px 0 32px', fontSize: '13px', width: '220px', outline: 'none' }} />
          </div>
          <button className="btn btn-primary"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 16V4m0 0 4 4m-4-4-4 4"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/></svg>Uploader Document</button>
        </div>
      </div>

      <div className="doc-cat-grid">
        <div className="doc-cat-card active"><span className="dcc-count">14</span>Contrats</div>
        <div className="doc-cat-card"><span className="dcc-count">22</span>Rapports</div>
        <div className="doc-cat-card"><span className="dcc-count">6</span>TDR</div>
        <div className="doc-cat-card"><span className="dcc-count">31</span>Dossiers d'Appel d'Offres</div>
        <div className="doc-cat-card"><span className="dcc-count">18</span>Comptes-rendus</div>
        <div className="doc-cat-card"><span className="dcc-count">47</span>Photos</div>
        <div className="doc-cat-card"><span className="dcc-count">9</span>Études</div>
        <div className="doc-cat-card"><span className="dcc-count">4</span>Documents d'Audit</div>
      </div>

      <div className="upload-zone">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 16V4m0 0 4 4m-4-4-4 4"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/></svg>
        <div className="uz-title">Glissez et déposez vos fichiers ici</div>
        <div className="uz-sub">ou cliquez pour parcourir — PDF, Word, Excel, images jusqu'à 50 Mo</div>
      </div>

      <div className="panel">
        <div className="panel-head"><span className="panel-title">Tous les Documents<span className="muted">152 fichiers</span></span></div>
        <div className="panel-body tight" id="pdoc-table">
          <div className="file-row">
            <div className="file-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg></div>
            <div className="file-main">
              <div className="file-name">Contrat_C-014-A_Signé.pdf</div>
              <div className="file-meta">Ajouté par Hassan Diallo · Hier à 14:30 · 2.4 Mo</div>
            </div>
            <span className="file-tag">Contrats</span>
            <div className="file-actions">
              <button className="icon-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></button>
              <button className="icon-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
