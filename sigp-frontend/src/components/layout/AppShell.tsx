import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AppShell() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <Topbar />
        <main className="content" id="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// Dummy export to prevent TypeScript errors in old pages
export function PageHeader({ title, subtitle, actions }: any) {
  return null;
}

