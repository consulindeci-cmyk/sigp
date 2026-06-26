import { Link, useLocation } from 'react-router-dom';

export function Topbar() {
  const location = useLocation();

  // Basic breadcrumbs logic
  const path = location.pathname;
  let currentTitle = "Tableau de bord";
  if (path.includes('projects')) currentTitle = "Projets";
  if (path.includes('users')) currentTitle = "Utilisateurs";
  if (path.includes('documents')) currentTitle = "Documents";
  if (path.includes('settings')) currentTitle = "Paramètres";

  return (
    <header className="topbar">
      <div className="breadcrumbs" id="breadcrumbs">
        <Link to="/dashboard">GPD ERP</Link>
        <span className="sep">/</span>
        <span className="current">{currentTitle}</span>
      </div>
      <div className="global-search">
        <svg className="gs-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input type="text" placeholder="Rechercher des projets, contrats, documents…" />
      </div>
      <div className="topbar-right">
        <button className="icon-btn" title="Notifications">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M6 8a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 6.5H4.5C4.5 13.5 6 12 6 8Z" />
            <path d="M9.5 18.5a2.5 2.5 0 0 0 5 0" />
          </svg>
          <span className="notif-dot"></span>
        </button>
        <button className="icon-btn" title="Aide">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="9" />
            <path d="M9.5 9a2.5 2.5 0 1 1 3.6 2.3c-.8.4-1.1 1-1.1 1.9v.3" />
            <circle cx="12" cy="16.8" r="0.4" fill="currentColor" />
          </svg>
        </button>
      </div>
    </header>
  );
}
