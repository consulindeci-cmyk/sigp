import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// AppShell — layout racine de l'application
// ---------------------------------------------------------------------------
export function AppShell() {
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden text-foreground">
      {/* Desktop Sidebar (Static, collapsible) */}
      <div
        className={cn(
          'hidden md:flex flex-col border-r border-border bg-sidebar transition-all duration-300 ease-in-out shrink-0 relative z-50',
          sidebarOpen ? 'w-64' : 'w-16'
        )}
      >
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay (Drawer) */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        >
          <div
            className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar shadow-modal animate-in slide-in-from-left duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar isMobile />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar />
        <main
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-muted/10"
          id="main-content"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PageHeader — composant générique d'en-tête de page
// Exporté séparément pour compatibilité avec tous les modules.
// ---------------------------------------------------------------------------
export interface PageHeaderProps {
  /** Titre principal de la page (h1) */
  title: string;
  /** Sous-titre / description contextuelle */
  subtitle?: string;
  /** Actions (boutons) affichées à droite */
  actions?: React.ReactNode;
  /** Classes CSS additionnelles sur le wrapper */
  className?: string;
}

export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4',
        className
      )}
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  );
}
