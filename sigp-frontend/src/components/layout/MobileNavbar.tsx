import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  Users,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';

// ---------------------------------------------------------------------------
// MobileNavbar — Barre de navigation basse pour mobile (md:hidden)
// Remplace le besoin d'un menu hamburger global sur la liste des projets
// ---------------------------------------------------------------------------

const MOBILE_NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects',  label: 'Projets',   icon: FolderKanban    },
  { to: '/documents', label: 'Documents', icon: FileText        },
  { to: '/users',     label: 'Comptes',   icon: Users           },
  { to: '/settings',  label: 'Réglages',  icon: Settings        },
] as const;

export function MobileNavbar() {
  const location = useLocation();
  const path = location.pathname;
  const { setSidebarOpen } = useUIStore();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-lg border-t border-border flex items-center justify-around h-16 px-2 shadow-[0_-2px_10px_rgba(0,0,0,0.08)] transition-all duration-200"
      aria-label="Navigation mobile bas de page"
    >
      {MOBILE_NAV_ITEMS.map((item) => {
        const isActive = path.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setSidebarOpen(false)}
            className={cn(
              'flex flex-col items-center justify-center flex-1 py-1 rounded-lg transition-all duration-150 active:scale-95 group relative select-none',
              isActive
                ? 'text-primary font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {/* Indicateur actif en haut de l'item */}
            {isActive && (
              <span className="absolute top-0 w-8 h-0.5 bg-primary rounded-full animate-in fade-in zoom-in-50 duration-200" />
            )}

            <div
              className={cn(
                'p-1 rounded-full transition-colors',
                isActive ? 'bg-primary/10 text-primary' : 'group-hover:bg-muted/50'
              )}
            >
              <item.icon className={cn('h-5 w-5 shrink-0 transition-transform', isActive && 'scale-105')} />
            </div>

            <span
              className={cn(
                'text-[10px] tracking-tight truncate max-w-full mt-0.5',
                isActive ? 'font-bold text-foreground' : 'font-medium'
              )}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
