export default function SettingsPage() {
  return (
    <section className="screen active" id="screen-settings">
      <div className="page-head">
        <div>
          <div className="page-title">Paramètres</div>
          <div className="page-sub">Configuration système et préférences utilisateur</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary">Enregistrer les modifications</button>
        </div>
      </div>

      <div className="settings-layout">
        <nav className="settings-nav">
          <button className="sn-item active">Profil Utilisateur</button>
          <button className="sn-item">Préférences d'Affichage</button>
          <button className="sn-item">Notifications</button>
          <button className="sn-item">Sécurité & Accès</button>
          <button className="sn-item">Intégrations</button>
        </nav>

        <div className="panel">
          <div className="panel-body">
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink)', marginBottom: '16px' }}>Informations du Profil</h3>
            <div className="form-grid">
              <div className="form-field">
                <label>Nom Complet</label>
                <input type="text" defaultValue="Mariam N'Diaye" />
              </div>
              <div className="form-field">
                <label>Rôle</label>
                <input type="text" defaultValue="Directrice de Programme" disabled />
              </div>
              <div className="form-field full">
                <label>Adresse Email</label>
                <input type="email" defaultValue="m.ndiaye@gpd-erp.org" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
