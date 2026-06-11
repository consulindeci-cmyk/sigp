import { NavLink, useParams } from 'react-router-dom'
import {
  LayoutDashboard, FolderOpen, ClipboardList, BarChart3,
  TrendingUp, DollarSign, AlertTriangle, Target, Calendar,
  GitBranch, ChevronRight, Shield, LogOut, Menu,
} from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { useProject } from '@/hooks/useProjects'
import { cn } from '@/lib/utils'

const globalNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard Global' },
  { to: '/projects', icon: FolderOpen, label: 'Projets' },
]

const projectNav = [
  { to: 'saisie-poa', icon: ClipboardList, label: 'Saisie POA' },
  { to: 'moteur-evm', icon: TrendingUp, label: 'Moteur EVM' },
  { to: 'dashboard', icon: BarChart3, label: 'Dashboard Projet' },
  { to: 'budget', icon: DollarSign, label: 'Budget' },
  { to: 'risks', icon: AlertTriangle, label: 'Risques' },
  { to: 'logframe', icon: Target, label: 'Cadre Logique' },
  { to: 'ptba', icon: Calendar, label: 'PTBA' },
  { to: 'wbs', icon: GitBranch, label: 'WBS' },
]

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const { user, logout } = useAuthStore()
  const { id: projectId } = useParams()
  const { data: project } = useProject(projectId ?? '')

  return (
    <aside
      className={cn(
        'flex flex-col bg-navy-800 border-r border-navy-500 transition-all duration-200 shrink-0',
        sidebarOpen ? 'w-56' : 'w-14'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3 py-4 border-b border-navy-500">
        <div className="w-8 h-8 bg-sigp-blue rounded-lg flex items-center justify-center shrink-0">
          <Shield size={16} className="text-white" />
        </div>
        {sidebarOpen && (
          <div className="min-w-0">
            <p className="text-white font-bold text-sm leading-tight">SIGP</p>
            <p className="text-sigp-muted text-2xs truncate">Gestion de Projets</p>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="ml-auto text-sigp-muted hover:text-sigp-text transition-colors"
        >
          <Menu size={16} />
        </button>
      </div>

      {/* Navigation globale */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {globalNav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => cn('nav-item', isActive && 'active')}
            title={!sidebarOpen ? label : undefined}
          >
            <Icon size={16} className="shrink-0" />
            {sidebarOpen && <span className="truncate">{label}</span>}
          </NavLink>
        ))}

        {/* Navigation projet actif */}
        {projectId && (
          <>
            <div className={cn('pt-3 pb-1', sidebarOpen ? 'px-1' : 'px-0')}>
              {sidebarOpen ? (
                <div className="flex items-center gap-1 text-2xs text-sigp-muted uppercase tracking-wider font-semibold">
                  <ChevronRight size={10} />
                  <span className="truncate">{project?.code_projet ?? 'Projet'}</span>
                </div>
              ) : (
                <div className="w-8 h-px bg-navy-500 mx-auto" />
              )}
            </div>
            {projectNav.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={`/projects/${projectId}/${to}`}
                className={({ isActive }) => cn('nav-item', isActive && 'active')}
                title={!sidebarOpen ? label : undefined}
              >
                <Icon size={15} className="shrink-0" />
                {sidebarOpen && <span className="truncate text-xs">{label}</span>}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* User info + logout */}
      <div className="border-t border-navy-500 p-2">
        {sidebarOpen ? (
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="w-7 h-7 rounded-full bg-sigp-blue/20 flex items-center justify-center shrink-0">
              <span className="text-sigp-blue text-xs font-semibold">
                {user?.prenom?.[0]}{user?.nom?.[0]}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sigp-text text-xs font-medium truncate">
                {user?.prenom} {user?.nom}
              </p>
              <p className="text-sigp-muted text-2xs truncate">{user?.role}</p>
            </div>
            <button onClick={logout} className="text-sigp-muted hover:text-sigp-red transition-colors" title="Déconnexion">
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <button onClick={logout} className="nav-item w-full justify-center" title="Déconnexion">
            <LogOut size={15} />
          </button>
        )}
      </div>
    </aside>
  )
}
