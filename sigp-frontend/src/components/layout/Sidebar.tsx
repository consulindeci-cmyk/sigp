import { Link, useLocation } from 'react-router-dom';

export function Sidebar() {
  const location = useLocation();
  const path = location.pathname;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="mark">GP</div>
        <div>
          <span className="word">GPD ERP</span>
          <span className="sub">Gestion de Programme</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <Link to="/dashboard" className={`nav-item ${path.includes('/dashboard') ? 'active' : ''}`}>
          <span className="nav-ico">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="3" width="7" height="9" rx="1.5"/>
              <rect x="14" y="3" width="7" height="5" rx="1.5"/>
              <rect x="14" y="12" width="7" height="9" rx="1.5"/>
              <rect x="3" y="16" width="7" height="5" rx="1.5"/>
            </svg>
          </span>
          Tableau de bord
        </Link>
        <Link to="/projects" className={`nav-item ${path.includes('/projects') ? 'active' : ''}`}>
          <span className="nav-ico">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/>
            </svg>
          </span>
          Projets
        </Link>
        <Link to="/users" className={`nav-item ${path.includes('/users') ? 'active' : ''}`}>
          <span className="nav-ico">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="9" cy="8" r="3.2"/>
              <path d="M2.5 20c0-3.5 2.9-6 6.5-6s6.5 2.5 6.5 6"/>
              <circle cx="17.5" cy="8.5" r="2.6"/>
              <path d="M15.8 14.3c2.8.3 4.7 2.4 4.7 5.7"/>
            </svg>
          </span>
          Utilisateurs
        </Link>
        <Link to="/documents" className={`nav-item ${path.includes('/documents') ? 'active' : ''}`}>
          <span className="nav-ico">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/>
              <path d="M14 3v4h4"/>
              <path d="M8.5 12h7M8.5 15.5h7M8.5 8.5h3"/>
            </svg>
          </span>
          Documents
        </Link>
        <Link to="/settings" className={`nav-item ${path.includes('/settings') ? 'active' : ''}`}>
          <span className="nav-ico">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 13.5a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H2.5a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.5V2.5a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h.1a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5 1h.2a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>
            </svg>
          </span>
          Paramètres
        </Link>
      </nav>

      <div className="sidebar-foot">
        <div className="avatar-sm">MN</div>
        <div className="who">
          <div className="name">Mariam N'Diaye</div>
          <div className="role">Directrice de Programme</div>
        </div>
      </div>
    </aside>
  );
}
