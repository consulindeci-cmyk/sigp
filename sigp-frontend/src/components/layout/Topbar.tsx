import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  type NotificationDto,
  type TypeNotification,
} from '@/hooks/useNotifications';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import {
  Search, Bell, Menu, X,
  FolderOpen, FileText, Settings, LayoutDashboard, Users,
  AlertTriangle, CheckCircle2, Clock, LogOut, ChevronRight,
  User as UserIcon, Info,
} from 'lucide-react';
import { Button } from '@/components/ui/forms/Button';
import { Badge } from '@/components/ui/data-display/Badge';
import { cn } from '@/lib/utils';
import { useCurrentUserProfile } from '@/hooks/useUserProfile';
import { useProjects } from '@/hooks/useProjects';
import type { ProjectApiDto } from '@/lib/projectAdapter';
import { userAvatarStyle } from '@/components/users/userAvatarStyle';

// ─── Types ────────────────────────────────────────────────────────────────────

type NotifVariant = 'destructive' | 'success' | 'warning' | 'info';

interface NotifItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  read: boolean;
  variant: NotifVariant;
}

interface SearchResult {
  id: string;
  type: 'projet' | 'page';
  title: string;
  subtitle: string;
  route: string;
  icon: React.ComponentType<{ className?: string }>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_NAV: Omit<SearchResult, 'id' | 'type'>[] = [
  { title: 'Tableau de bord', subtitle: "Vue d'ensemble et KPIs", route: '/dashboard', icon: LayoutDashboard },
  { title: 'Projets',         subtitle: 'Portefeuille de projets', route: '/projects',  icon: FolderOpen      },
  { title: 'Documents',       subtitle: 'Bibliothèque documentaire', route: '/documents', icon: FileText      },
  { title: 'Utilisateurs',    subtitle: 'Gestion des comptes',     route: '/users',     icon: Users           },
  { title: 'Paramètres',      subtitle: 'Configuration',           route: '/settings',  icon: Settings        },
];

const SECTION_TITLE: Record<string, string> = {
  '/dashboard': 'Tableau de bord',
  '/projects':  'Projets',
  '/users':     'Utilisateurs',
  '/documents': 'Documents',
  '/settings':  'Paramètres',
};

const NOTIF_ICONS: Record<NotifVariant, React.ComponentType<{ className?: string }>> = {
  destructive: AlertTriangle,
  success:     CheckCircle2,
  warning:     Clock,
  info:        Info,
};

// ─── Hook: click-outside ─────────────────────────────────────────────────────

function useClickOutside<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  enabled: boolean,
  onClose: () => void,
) {
  useEffect(() => {
    if (!enabled) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [ref, enabled, onClose]);
}

// ─── GlobalSearch overlay ─────────────────────────────────────────────────────

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const [query, setQuery]     = useState('');
  const inputRef              = useRef<HTMLInputElement>(null);
  const navigate              = useNavigate();
  const { data: projectsData } = useProjects();
  const projectList: ProjectApiDto[] = projectsData?.data ?? [];

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    function handle(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (open) document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [open, onClose]);

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const projetResults: SearchResult[] = projectList
      .filter((p: ProjectApiDto) =>
        p.nom.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        (p.bailleurPrincipal ?? '').toLowerCase().includes(q),
      )
      .slice(0, 6)
      .map((p: ProjectApiDto) => ({
        id:       `proj-${p.id}`,
        type:     'projet' as const,
        title:    p.nom,
        subtitle: `${p.code} · ${p.bailleurPrincipal ?? ''}`,
        route:    `/projects/${p.id}`,
        icon:     FolderOpen,
      }));

    const pageResults: SearchResult[] = PAGE_NAV
      .filter(pg =>
        pg.title.toLowerCase().includes(q) ||
        pg.subtitle.toLowerCase().includes(q),
      )
      .map((pg, i) => ({ ...pg, id: `page-${i}`, type: 'page' as const }));

    return [...projetResults, ...pageResults];
  }, [query, projectList]);

  function go(route: string) {
    navigate(route);
    onClose();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[10vh] px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Recherche globale"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative w-full max-w-2xl bg-card rounded-xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[70vh]">
        {/* Input row */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher des projets, documents, pages..."
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-sm outline-none"
            aria-label="Recherche globale"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Effacer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 text-[10px] font-mono text-muted-foreground ml-1">
            Echap
          </kbd>
        </div>

        {/* Results */}
        <div className="overflow-y-auto">
          {query.trim() === '' ? (
            // Empty state — quick nav
            <div className="p-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-2 mb-2">
                Navigation rapide
              </p>
              {PAGE_NAV.map((pg, i) => {
                const Icon = pg.icon;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => go(pg.route)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/60 transition-colors text-left group"
                  >
                    <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-sm font-medium text-foreground">{pg.title}</span>
                      <span className="text-[11px] text-muted-foreground">{pg.subtitle}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                );
              })}
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <Search className="h-8 w-8 opacity-30" />
              <p className="text-sm">Aucun résultat pour «&nbsp;{query}&nbsp;»</p>
            </div>
          ) : (
            <div className="p-3 flex flex-col gap-1">
              {results.some(r => r.type === 'projet') && (
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-2 mb-1 mt-1">
                  Projets
                </p>
              )}
              {results.filter(r => r.type === 'projet').map(r => {
                const Icon = r.icon;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => go(r.route)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/60 transition-colors text-left group"
                  >
                    <div className="h-8 w-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-sm font-medium text-foreground truncate">{r.title}</span>
                      <span className="text-[11px] text-muted-foreground truncate">{r.subtitle}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                );
              })}

              {results.some(r => r.type === 'page') && (
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-2 mb-1 mt-2">
                  Pages
                </p>
              )}
              {results.filter(r => r.type === 'page').map(r => {
                const Icon = r.icon;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => go(r.route)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/60 transition-colors text-left group"
                  >
                    <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0 group-hover:bg-muted text-muted-foreground">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-sm font-medium text-foreground">{r.title}</span>
                      <span className="text-[11px] text-muted-foreground">{r.subtitle}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t border-border px-4 py-2 flex items-center gap-4 text-[10px] text-muted-foreground">
          <span><kbd className="font-mono">↑↓</kbd> naviguer</span>
          <span><kbd className="font-mono">Entrée</kbd> sélectionner</span>
          <span><kbd className="font-mono">Echap</kbd> fermer</span>
        </div>
      </div>
    </div>
  );
}

// ─── NotificationsPanel ───────────────────────────────────────────────────────

interface NotificationsPanelProps {
  notifs: NotifItem[];
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
  onClose: () => void;
}

function NotificationsPanel({ notifs, onMarkAllRead, onMarkRead, onClose }: NotificationsPanelProps) {
  const navigate  = useNavigate();
  const unread    = notifs.filter(n => !n.read).length;

  function handleViewAll() {
    navigate('/settings');
    onClose();
  }

  return (
    <div
      className={cn(
        'absolute right-0 top-full mt-2 w-80 bg-card rounded-xl shadow-xl border border-border z-[100]',
        'flex flex-col overflow-hidden',
      )}
      role="region"
      aria-label="Notifications"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
          {unread > 0 && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">{unread}</Badge>
          )}
        </div>
        {unread > 0 && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="text-[11px] text-primary hover:text-primary/80 transition-colors font-medium"
          >
            Tout marquer lu
          </button>
        )}
      </div>

      {/* List */}
      <div className="overflow-y-auto max-h-72 divide-y divide-border">
        {notifs.map(n => {
          const Icon = NOTIF_ICONS[n.variant];
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => { onMarkRead(n.id); }}
              className={cn(
                'w-full flex items-start gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left',
                !n.read && 'bg-primary/5',
              )}
              aria-label={`${n.title}: ${n.desc}`}
            >
              <div className={cn(
                'mt-0.5 h-7 w-7 rounded-full flex items-center justify-center shrink-0',
                n.variant === 'destructive' && 'bg-destructive/10 text-destructive',
                n.variant === 'success'     && 'bg-success/10 text-success',
                n.variant === 'warning'     && 'bg-warning/10 text-warning',
                n.variant === 'info'        && 'bg-info/10 text-info',
              )}>
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={cn('text-[12px] font-semibold truncate', !n.read ? 'text-foreground' : 'text-muted-foreground')}>
                    {n.title}
                  </p>
                  {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" aria-label="Non lu" />}
                </div>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">{n.desc}</p>
                <p className="text-[10px] text-muted-foreground/70 mt-0.5">{n.time}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="border-t border-border px-4 py-2.5">
        <button
          type="button"
          onClick={handleViewAll}
          className="w-full text-[12px] text-primary hover:text-primary/80 transition-colors font-medium text-center flex items-center justify-center gap-1"
        >
          Voir les paramètres de notification
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

// ─── UserMenuPanel ────────────────────────────────────────────────────────────

interface UserMenuPanelProps {
  onClose: () => void;
}

function UserMenuPanel({ onClose }: UserMenuPanelProps) {
  const navigate    = useNavigate();
  const { logout }  = useAuthStore();
  const profile     = useCurrentUserProfile();
  const avatarStyle = userAvatarStyle(profile.initiales);

  async function handleLogout() {
    onClose();
    await logout();
    navigate('/login');
  }

  function go(route: string) {
    navigate(route);
    onClose();
  }

  return (
    <div
      className="absolute right-0 top-full mt-2 w-64 bg-card rounded-xl shadow-xl border border-border z-[100] overflow-hidden"
      role="menu"
      aria-label="Menu utilisateur"
    >
      {/* User header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <div className={cn('h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 select-none', avatarStyle)}>
          {profile.initiales}
        </div>
        <div className="flex flex-col min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            {profile.prenom} {profile.nom}
          </p>
          <p className="text-[11px] text-muted-foreground truncate">{profile.roleLabel}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="p-1.5">
        {[
          { icon: UserIcon, label: 'Mon compte',  route: '/settings', desc: 'Profil et sécurité' },
          { icon: Settings, label: 'Paramètres',  route: '/settings', desc: "Configuration de l'application" },
        ].map(item => (
          <button
            key={item.label}
            type="button"
            role="menuitem"
            onClick={() => go(item.route)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/60 transition-colors text-left group"
          >
            <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0" aria-hidden="true" />
            <div className="flex flex-col gap-0 min-w-0">
              <span className="text-sm text-foreground">{item.label}</span>
              <span className="text-[10px] text-muted-foreground">{item.desc}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Separator + logout */}
      <div className="border-t border-border p-1.5">
        <button
          type="button"
          role="menuitem"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors text-left"
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="text-sm">Se déconnecter</span>
        </button>
      </div>
    </div>
  );
}

// ─── Notification adapters ────────────────────────────────────────────────────

const TYPE_VARIANT: Record<TypeNotification, NotifVariant> = {
  RISQUE_CRITIQUE:      'destructive',
  LIVRABLE_EN_RETARD:   'warning',
  BUDGET_DEPASSE:       'destructive',
  EVM_ALERTE_CPI:       'warning',
  EVM_ALERTE_SPI:       'warning',
  DOCUMENT_VALIDE:      'success',
  RAPPORT_PRET:         'success',
  MENTION_COMMENTAIRE:  'info',
  PROJET_STATUT_CHANGE: 'info',
  BUDGET_VALIDE:        'success',
  CONTRAT_EXPIRE:       'warning',
  PAIEMENT_DU:          'warning',
};

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1)   return "À l'instant";
  if (mins < 60)  return `Il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `Il y a ${hrs}h`;
  if (hrs < 48)   return 'Hier';
  return `Il y a ${Math.floor(hrs / 24)} jours`;
}

function adaptNotif(dto: NotificationDto): NotifItem {
  return {
    id:      dto.id,
    title:   dto.titre,
    desc:    dto.message,
    time:    timeAgo(dto.createdAt),
    read:    dto.lue,
    variant: TYPE_VARIANT[dto.type] ?? 'info',
  };
}

// ─── Topbar ───────────────────────────────────────────────────────────────────

export function Topbar() {
  const location                  = useLocation();
  const { setSidebarOpen }        = useUIStore();

  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen,  setNotifOpen]  = useState(false);
  const [userOpen,   setUserOpen]   = useState(false);
  const [notifs,     setNotifs]     = useState<NotifItem[]>([]);

  const { data: apiNotifs }    = useNotifications();
  const markReadMutation       = useMarkNotificationRead();
  const markAllMutation        = useMarkAllNotificationsRead();

  useEffect(() => {
    if (apiNotifs) setNotifs(apiNotifs.map(adaptNotif));
  }, [apiNotifs]);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef  = useRef<HTMLDivElement>(null);

  const unreadCount = notifs.filter(n => !n.read).length;

  const closeNotif = useCallback(() => setNotifOpen(false), []);
  const closeUser  = useCallback(() => setUserOpen(false),  []);

  useClickOutside(notifRef, notifOpen, closeNotif);
  useClickOutside(userRef,  userOpen,  closeUser);

  // Ctrl+K → open search
  useEffect(() => {
    function handle(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, []);

  // Close all on Escape
  useEffect(() => {
    function handle(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setNotifOpen(false);
        setUserOpen(false);
      }
    }
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, []);

  function handleMarkAllRead() {
    const unreadIds = notifs.filter(n => !n.read).map(n => n.id);
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    if (unreadIds.length > 0) markAllMutation.mutate(unreadIds);
  }

  function handleMarkRead(id: string) {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    markReadMutation.mutate(id);
  }

  // Current page title from location
  const path = location.pathname;
  const currentTitle =
    SECTION_TITLE[path] ??
    (path.startsWith('/projects/') ? 'Projets' : 'SIGP');

  const currentUser = useCurrentUserProfile();
  const avatarStyle = userAvatarStyle(currentUser.initiales);

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-x-4 border-b border-border bg-background px-4 sm:gap-x-6 sm:px-6 lg:px-8 z-10 sticky top-0 shadow-sm">
        {/* Mobile menu */}
        <button
          type="button"
          className="-m-2.5 p-2.5 text-muted-foreground hover:text-foreground md:hidden"
          onClick={() => setSidebarOpen(true)}
          aria-label="Ouvrir la sidebar"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="h-6 w-px bg-border md:hidden" aria-hidden="true" />

        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 min-w-0 items-center">

          {/* Breadcrumb */}
          <div className="flex items-center text-sm flex-1 min-w-0">
            <div className="hidden sm:flex items-center gap-2 min-w-0">
              <Link
                to="/dashboard"
                className="font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                SIGP
              </Link>
              <span className="text-muted-foreground shrink-0">/</span>
              <span className="font-semibold text-foreground tracking-tight truncate">{currentTitle}</span>
            </div>
            <div className="sm:hidden">
              <span className="font-semibold text-foreground tracking-tight truncate">{currentTitle}</span>
            </div>
          </div>

          {/* Search trigger */}
          <div className="flex flex-1 items-center justify-end sm:justify-center min-w-0 max-w-lg">
            {/* Desktop: fake input button */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className={cn(
                'hidden sm:flex items-center gap-2 w-full rounded-md border border-border bg-muted/50',
                'px-3 h-9 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors',
              )}
              aria-label="Ouvrir la recherche (Ctrl+K)"
            >
              <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="flex-1 text-left text-[13px]">Rechercher...</span>
              <kbd className="hidden lg:inline-flex h-5 items-center gap-0.5 rounded border border-border bg-background px-1.5 text-[10px] font-mono text-muted-foreground">
                Ctrl K
              </kbd>
            </button>
            {/* Mobile: icon only */}
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden text-muted-foreground"
              onClick={() => setSearchOpen(true)}
              aria-label="Rechercher"
            >
              <Search className="h-5 w-5" />
            </Button>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-x-2 lg:gap-x-3">

            {/* Notifications */}
            <div ref={notifRef} className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="relative text-muted-foreground hover:text-foreground"
                onClick={() => { setNotifOpen(o => !o); setUserOpen(false); }}
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lues)` : ''}`}
                aria-expanded={notifOpen}
              >
                <Bell className="h-5 w-5" aria-hidden="true" />
                {unreadCount > 0 && (
                  <span
                    className="absolute top-1.5 right-1.5 flex h-2 w-2 items-center justify-center"
                    aria-hidden="true"
                  >
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
                  </span>
                )}
              </Button>

              {notifOpen && (
                <NotificationsPanel
                  notifs={notifs}
                  onMarkAllRead={handleMarkAllRead}
                  onMarkRead={handleMarkRead}
                  onClose={closeNotif}
                />
              )}
            </div>

            <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-border" aria-hidden="true" />

            {/* User menu */}
            <div ref={userRef} className="relative">
              <button
                type="button"
                onClick={() => { setUserOpen(o => !o); setNotifOpen(false); }}
                className={cn(
                  'flex items-center gap-x-2 rounded-lg p-1 text-sm font-semibold text-foreground',
                  'hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                )}
                aria-label="Menu utilisateur"
                aria-expanded={userOpen}
                aria-haspopup="menu"
              >
                <div className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs border shrink-0 select-none',
                  avatarStyle,
                )}>
                  {currentUser.initiales}
                </div>
                <span className="hidden lg:block text-sm font-medium text-foreground">
                  {currentUser.prenom}
                </span>
              </button>

              {userOpen && (
                <UserMenuPanel onClose={closeUser} />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Global Search Overlay (fixed, outside header stacking context) */}
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
