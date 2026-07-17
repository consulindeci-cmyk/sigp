import React, { useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  FileText,
  Settings,
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Project sub-navigation data
// ---------------------------------------------------------------------------

// Tous les modules sont désormais réellement branchés sur Supabase (migration
// terminée le 2026-07-17) — le statut n'a plus vocation à distinguer
// réel/mock, gardé uniquement comme repère visuel neutre par groupe.
export const PROJECT_NAV_GROUPS = [
  {
    title: "Aperçu & Cadrage",
    items: [
      { id: "overview",   label: "Informations Générales", status: "success" },
      { id: "governance", label: "Gouvernance",             status: "success" },
      { id: "logframe",   label: "Cadre Logique",           status: "success" },
      { id: "wbs",        label: "Structure (WBS)",         status: "success" },
    ],
  },
  {
    title: "Planification & Opérations",
    items: [
      { id: "ptba",       label: "PTBA",                   status: "success" },
      { id: "activities", label: "Activités",              status: "success" },
      { id: "journal",    label: "Journal des Opérations", status: "success" },
    ],
  },
  {
    title: "Budget & Finances",
    items: [
      { id: "budget",        label: "Budget",                 status: "success" },
      { id: "funding",       label: "Sources de financement", status: "success" },
      { id: "ppm",           label: "PPM",                    status: "success" },
      { id: "contracts",     label: "Contrats",               status: "success" },
      { id: "disbursements", label: "Décaissements",          status: "success" },
    ],
  },
  {
    title: "Suivi & Contrôle",
    items: [
      { id: "evm",          label: "Indicateurs EVM",   status: "success" },
      { id: "risks",        label: "Risques & Alertes", status: "success" },
      { id: "deliverables", label: "Livrables",         status: "success" },
    ],
  },
  {
    title: "Documentation",
    items: [
      { id: "pdocuments", label: "Documents",         status: "success" },
      { id: "reports",    label: "Rapports",          status: "success" },
      { id: "history",    label: "Historique",        status: "success" },
      { id: "comments",   label: "Commentaires",      status: "success" },
      { id: "settings",   label: "Paramètres Projet", status: "success" },
    ],
  },
] as const;

type ItemStatus = 'success' | 'warning' | 'destructive' | 'default';

function dotColor(status: ItemStatus) {
  switch (status) {
    case 'success':     return 'bg-success';
    case 'warning':     return 'bg-warning';
    case 'destructive': return 'bg-destructive';
    default:            return 'bg-muted-foreground';
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  superAdminOnly?: boolean;
}

interface SidebarProps {
  isMobile?: boolean;
}

// ---------------------------------------------------------------------------
// Navigation items
// ---------------------------------------------------------------------------

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/projects',  label: 'Projets',          icon: FolderKanban   },
  { to: '/users',     label: 'Utilisateurs',     icon: Users          },
  { to: '/documents', label: 'Documents',        icon: FileText       },
  { to: '/organisations', label: 'Organisations', icon: Building2,    superAdminOnly: true },
  { to: '/settings',  label: 'Paramètres',       icon: Settings       },
];

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

export function Sidebar({ isMobile = false }: SidebarProps) {
  const location = useLocation();
  const path = location.pathname;

  const {
    sidebarOpen, toggleSidebar, setSidebarOpen,
    activeProjectId, activeProjectName,
    activeProjectTab, setActiveProjectTab,
  } = useUIStore();
  const [projectNavOpen, setProjectNavOpen] = useState(true);

  const isSuperAdmin = useAuthStore(state => state.user?.role === 'SUPER_ADMIN');
  const visibleNavItems = useMemo(
    () => navItems.filter((item) => !item.superAdminOnly || isSuperAdmin),
    [isSuperAdmin]
  );

  const isExpanded = isMobile ? true : sidebarOpen;
  // Sub-nav visible only when on a project detail page (not the list)
  const isOnProjectDetail = !!activeProjectId && /^\/projects\/.+/.test(path);

  const handleMobileClick = () => {
    if (isMobile) setSidebarOpen(false);
  };

  // ── Mode Fiche Projet : Drawer / Sidebar dédiée exclusivement aux modules du projet ──
  if (isOnProjectDetail && (isMobile || isExpanded)) {
    return (
      <div className="relative flex flex-col h-full bg-sidebar text-sidebar-foreground overflow-hidden">
        {/* En-tête du menu de projet */}
        <div className="p-4 border-b border-sidebar-border bg-sidebar-accent/15 shrink-0 overflow-hidden">
          <Link
            to="/projects"
            onClick={handleMobileClick}
            className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline mb-3 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">Retour à la liste des projets</span>
          </Link>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-md shrink-0">
              {(activeProjectName?.[0] ?? 'P').toUpperCase()}
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <h2 className="text-sm font-bold text-sidebar-foreground truncate leading-tight">
                {activeProjectName ?? 'Détail du Projet'}
              </h2>
              <p className="text-[11px] text-sidebar-foreground/60 truncate mt-0.5">
                Navigation des 19 modules
              </p>
            </div>
          </div>
        </div>

        {/* Liste des modules organisés par groupes */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-4 scrollbar-thin">
          {PROJECT_NAV_GROUPS.map((group) => (
            <div key={group.title} className="space-y-1">
              <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/40 mb-1.5 truncate">
                {group.title}
              </div>
              <div className="space-y-0.5">
                {group.items.map((navItem) => {
                  const isTabActive = activeProjectTab === navItem.id;
                  return (
                    <button
                      key={navItem.id}
                      onClick={() => {
                        setActiveProjectTab(navItem.id);
                        handleMobileClick();
                      }}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-lg flex items-center justify-between gap-2 transition-all duration-150 overflow-hidden min-w-0',
                        isTabActive
                          ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                          : 'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 overflow-hidden flex-1">
                        <div
                          className={cn(
                            'h-2 w-2 rounded-full shrink-0',
                            isTabActive ? 'bg-primary-foreground' : dotColor(navItem.status as ItemStatus)
                          )}
                          aria-hidden="true"
                        />
                        <span className="text-xs truncate">{navItem.label}</span>
                      </div>
                      {isTabActive && (
                        <span className="text-[10px] font-semibold opacity-80 shrink-0">Actif</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer info in drawer */}
        <div className="p-3 border-t border-sidebar-border bg-sidebar/50 text-center shrink-0 overflow-hidden">
          <span className="text-[10px] text-sidebar-foreground/50 truncate block">
            SIGP/GPD ERP — Modules {isMobile ? 'Mobile' : 'Projet'}
          </span>
        </div>

        {/* ── Bouton Toggle (Desktop uniquement) ────────────────────────── */}
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

  return (
    <div className="relative flex flex-col h-full bg-sidebar text-sidebar-foreground">

      {/* ── Brand Header ──────────────────────────────────────────────── */}
      <div
        className={cn(
          'flex items-center h-16 border-b border-sidebar-border px-4 transition-all duration-300 shrink-0 overflow-hidden',
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
        className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-0.5 scrollbar-thin"
        aria-label="Navigation principale"
      >
        {visibleNavItems.map((item) => {
          const isActive = path.startsWith(item.to);
          return (
            <React.Fragment key={item.to}>
              <Link
                to={item.to}
                onClick={() => {
                  handleMobileClick();
                  if (!isExpanded && item.to === '/projects' && isOnProjectDetail) {
                    setSidebarOpen(true);
                  }
                }}
                title={!isExpanded ? item.label : undefined}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 group relative overflow-hidden min-w-0',
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

                {/* Label */}
                {isExpanded && (
                  <span className="text-sm animate-in fade-in duration-200 whitespace-nowrap truncate flex-1">
                    {item.label}
                  </span>
                )}

                {/* Tooltip (collapsed mode) */}
                {!isExpanded && (
                  <div
                    className={cn(
                      'pointer-events-none absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2',
                      'px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap',
                      'bg-popover text-popover-foreground border border-border shadow-dropdown',
                      'opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-[60]',
                      'before:content-[""] before:absolute before:right-full before:top-1/2 before:-translate-y-1/2',
                      'before:border-4 before:border-transparent before:border-r-border'
                    )}
                    role="tooltip"
                  >
                    {item.label}
                  </div>
                )}
              </Link>

              {/* ── Project sub-navigation (below "Projets" item) ──────── */}
              {item.to === '/projects' && isOnProjectDetail && isExpanded && (
                <div className="ml-1 mt-0.5 mb-1">

                  {/* Back to projects list */}
                  <Link
                    to="/projects"
                    className="flex items-center gap-1.5 px-3 py-1 mb-1 rounded-md text-[11px] text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/30 transition-colors"
                  >
                    <ArrowLeft className="h-3 w-3 shrink-0" aria-hidden="true" />
                    Retour aux projets
                  </Link>

                  {/* Project name + collapse toggle */}
                  <button
                    onClick={() => setProjectNavOpen((v) => !v)}
                    className="w-full flex items-center justify-between px-3 py-1.5 rounded-md hover:bg-sidebar-accent/30 transition-colors group"
                    aria-expanded={projectNavOpen}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-4 w-4 rounded-sm bg-primary/20 text-primary flex items-center justify-center text-[8px] font-bold shrink-0">
                        P
                      </div>
                      <span className="text-[11px] font-semibold text-sidebar-foreground/80 truncate">
                        {activeProjectName ?? 'Projet'}
                      </span>
                    </div>
                    <ChevronDown
                      className={cn(
                        'h-3 w-3 text-sidebar-foreground/40 shrink-0 transition-transform duration-200',
                        !projectNavOpen && '-rotate-90'
                      )}
                      aria-hidden="true"
                    />
                  </button>

                  {/* Collapsible groups */}
                  {projectNavOpen && (
                    <div className="mt-1 border-l border-sidebar-border/40 ml-3.5 pl-2">
                      {PROJECT_NAV_GROUPS.map((group) => (
                        <div key={group.title} className="mt-2 first:mt-1">
                          <p className="text-[8px] font-bold uppercase tracking-widest text-sidebar-foreground/30 px-1 mb-0.5">
                            {group.title}
                          </p>
                          {group.items.map((navItem) => {
                            const isTabActive = activeProjectTab === navItem.id;
                            return (
                              <button
                                key={navItem.id}
                                onClick={() => setActiveProjectTab(navItem.id)}
                                className={cn(
                                  'w-full text-left px-2 py-1 rounded-md flex items-center gap-1.5 transition-colors',
                                  isTabActive
                                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold'
                                    : 'text-sidebar-foreground/55 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground'
                                )}
                              >
                                <div
                                  className={cn('h-1.5 w-1.5 rounded-full shrink-0', dotColor(navItem.status as ItemStatus))}
                                  aria-hidden="true"
                                />
                                <span className="text-[11px] truncate">{navItem.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </nav>

      {/* ── Bouton Toggle (Desktop uniquement) ────────────────────────── */}
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
