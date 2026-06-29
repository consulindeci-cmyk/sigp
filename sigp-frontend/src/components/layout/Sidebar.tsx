import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/overlays/DropdownMenu';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
}

interface SidebarProps {
  isMobile?: boolean;
}

// ---------------------------------------------------------------------------
// Navigation items
// ---------------------------------------------------------------------------
const navItems: NavItem[] = [
  { to: '/dashboard',  label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/projects',   label: 'Projets',          icon: FolderKanban    },
  { to: '/users',      label: 'Utilisateurs',     icon: Users           },
  { to: '/documents',  label: 'Documents',        icon: FileText        },
  { to: '/settings',   label: 'Paramètres',       icon: Settings        },
];

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------
export function Sidebar({ isMobile = false }: SidebarProps) {
  const location = useLocation();
  const path = location.pathname;
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUIStore();
  const { logout } = useAuthStore();

  // Sur mobile, la sidebar est toujours visuellement « ouverte » dans son drawer
  const isExpanded = isMobile ? true : sidebarOpen;

  const handleMobileClick = () => {
    if (isMobile) setSidebarOpen(false);
  };

  return (
    // ⚠ `relative` est obligatoire ici pour que le bouton toggle (absolute -right-3)
    // soit positionné par rapport à ce wrapper et non à un ancêtre.
    <div className="relative flex flex-col h-full bg-sidebar text-sidebar-foreground">

      {/* ── Brand Header ──────────────────────────────────────────────── */}
      <div
        className={cn(
          'flex items-center h-16 border-b border-sidebar-border px-4 transition-all duration-300 shrink-0',
          isExpanded ? 'justify-between' : 'justify-center'
        )}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center justify-center h-8 w-8 rounded-md bg-primary text-primary-foreground font-bold shrink-0 text-sm">
            GP
          </div>
          {isExpanded && (
            <div className="flex flex-col animate-in fade-in duration-300 whitespace-nowrap overflow-hidden">
              <span className="text-sm font-bold tracking-tight text-sidebar-foreground leading-tight">
                GPD ERP
              </span>
              <span className="text-[10px] text-sidebar-foreground/60 uppercase tracking-wider">
                Gestion de Programme
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Navigation ────────────────────────────────────────────────── */}
      <nav
        className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5"
        aria-label="Navigation principale"
      >
        {navItems.map((item) => {
          const isActive = path.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={handleMobileClick}
              title={!isExpanded ? item.label : undefined}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 group relative',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}
            >
              {/* Icône */}
              <item.icon
                className={cn(
                  'h-5 w-5 shrink-0 transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80'
                )}
              />

              {/* Label (mode expanded) */}
              {isExpanded && (
                <span className="text-sm animate-in fade-in duration-200 whitespace-nowrap truncate">
                  {item.label}
                </span>
              )}

              {/* Tooltip (mode collapsed) — z-index élevé + overflow visible */}
              {!isExpanded && (
                <div
                  className={cn(
                    'pointer-events-none absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2',
                    'px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap',
                    'bg-popover text-popover-foreground border border-border shadow-dropdown',
                    'opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-[60]',
                    // Flèche gauche
                    'before:content-[""] before:absolute before:right-full before:top-1/2 before:-translate-y-1/2',
                    'before:border-4 before:border-transparent before:border-r-border'
                  )}
                  role="tooltip"
                >
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Utilisateur / Footer ───────────────────────────────────────── */}
      <div className="p-4 border-t border-sidebar-border shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn('w-full flex items-center gap-3 hover:bg-sidebar-accent/50 p-1.5 -m-1.5 rounded-md transition-colors', !isExpanded && 'justify-center')}>
              <div className="h-9 w-9 rounded-full bg-sidebar-accent flex items-center justify-center text-sm font-semibold shrink-0 border border-sidebar-border text-sidebar-foreground">
                MN
              </div>
              {isExpanded && (
                <div className="flex flex-col overflow-hidden animate-in fade-in duration-300 text-left">
                  <span className="text-sm font-medium truncate text-sidebar-foreground">
                    Mariam N'Diaye
                  </span>
                  <span className="text-xs text-sidebar-foreground/50 truncate">
                    Directrice de Programme
                  </span>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" className="w-56" sideOffset={10}>
            <DropdownMenuItem onClick={() => logout()} className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Déconnexion</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── Bouton Toggle (Desktop uniquement) ────────────────────────── */}
      {/* absolute -right-3 fonctionne car le wrapper parent a `relative` */}
      {!isMobile && (
        <button
          onClick={toggleSidebar}
          aria-label={sidebarOpen ? 'Réduire la sidebar' : 'Élargir la sidebar'}
          className={cn(
            'absolute -right-3 top-[4.5rem]',
            'h-6 w-6 rounded-full',
            'border border-sidebar-border bg-sidebar text-sidebar-foreground',
            'flex items-center justify-center',
            'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            'shadow-card transition-colors z-10'
          )}
        >
          {sidebarOpen
            ? <ChevronLeft  className="h-3 w-3" />
            : <ChevronRight className="h-3 w-3" />
          }
        </button>
      )}
    </div>
  );
}
