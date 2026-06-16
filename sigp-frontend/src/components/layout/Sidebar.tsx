import { useState, useRef, useEffect } from 'react'
import { NavLink, useParams, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FolderOpen, ClipboardList, BarChart3,
  TrendingUp, DollarSign, AlertTriangle, Target, Calendar,
  GitBranch, FileText, ChevronRight, LogOut, Menu, X,
  Settings, Bell, Search, Plus, ChevronDown, User2,
} from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { useProject } from '@/hooks/useProjects'
import { cn } from '@/lib/utils'

const globalNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/projects',  icon: FolderOpen,       label: 'Projets'         },
  { to: '/settings',  icon: Settings,          label: 'Paramètres'      },
]

const projectNav = [
  { to: 'dashboard',  icon: BarChart3,      label: 'Dashboard Projet' },
  { to: 'saisie-poa', icon: ClipboardList,  label: 'Saisie POA'       },
  { to: 'moteur-evm', icon: TrendingUp,     label: 'Moteur EVM'       },
  { to: 'logframe',   icon: Target,         label: 'Cadre Logique'    },
  { to: 'ptba',       icon: Calendar,       label: 'PTBA'             },
  { to: 'budget',     icon: DollarSign,     label: 'Budget Détaillé'  },
  { to: 'ppm',        icon: FileText,       label: 'PPM'              },
  { to: 'risks',      icon: AlertTriangle,  label: 'Risques'          },
  { to: 'wbs',        icon: GitBranch,      label: 'WBS'              },
]

function NavItem({ to, icon: Icon, label, end }: { to: string; icon: any; label: string; end?: boolean }) {
  const { toggleSidebar } = useUIStore()
  return (
    <NavLink
      to={to}
      end={end}
      onClick={() => {
        if (window.innerWidth < 768) toggleSidebar()
      }}
      className={({ isActive }) => cn(
        'group relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200',
        isActive
          ? 'bg-[#10B981]/10 text-[#10B981]'
          : 'text-[#94A3B8] hover:text-white hover:bg-white/5'
      )}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[#10B981] rounded-r-full" />
          )}
          <Icon size={16} className="shrink-0" />
          <span className="truncate text-[13px]">{label}</span>
        </>
      )}
    </NavLink>
  )
}

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const { user, logout } = useAuthStore()
  const { id: projectId } = useParams()
  const { data: project } = useProject(projectId ?? '')
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const initials = `${user?.prenom?.[0] ?? 'A'}${user?.nom?.[0] ?? 'D'}`

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed md:relative flex flex-col bg-[#0A0F1E] border-r border-[#1E293B] transition-transform duration-300 md:transition-all shrink-0 h-full z-50',
        sidebarOpen ? 'translate-x-0 w-64 md:w-60' : '-translate-x-full md:translate-x-0 md:w-16'
      )}>

        {/* ── Logo ── */}
        <div className="flex items-center gap-3 px-3 py-4 border-b border-[#1E293B] shrink-0">
          <div className="w-9 h-9 bg-gradient-to-br from-[#10B981] to-[#059669] rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-[#10B981]/20">
            <span className="text-white font-black text-sm tracking-tighter">GP</span>
          </div>
          {(sidebarOpen || window.innerWidth < 768) && (
            <div className={cn("min-w-0 flex-1", !sidebarOpen && "md:hidden")}>
              <p className="text-white font-bold text-sm leading-none">DevProject</p>
              <p className="text-[#94A3B8] text-[10px] mt-0.5">Gestion de Projets</p>
            </div>
          )}
          <button onClick={toggleSidebar}
            className="ml-auto text-[#94A3B8] hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5 md:block hidden">
            {sidebarOpen ? <X size={15} /> : <Menu size={15} />}
          </button>
          <button onClick={toggleSidebar}
            className="ml-auto text-[#94A3B8] hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5 md:hidden block">
            <X size={15} />
          </button>
        </div>

        {/* ── Navigation principale ── */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1 min-h-0">
          {globalNav.map(({ to, icon, label }) =>
            sidebarOpen ? (
              <NavItem key={to} to={to} icon={icon} label={label} end={to === '/dashboard'} />
            ) : (
              <NavLink key={to} to={to} title={label}
                className={({ isActive }) => cn(
                  'flex items-center justify-center w-10 h-10 mx-auto rounded-xl transition-all duration-200 hidden md:flex',
                  isActive ? 'bg-[#10B981]/10 text-[#10B981]' : 'text-[#94A3B8] hover:text-white hover:bg-white/5'
                )}>
                {({ isActive }) => {
                  const Icon = icon
                  return <Icon size={18} className={isActive ? 'text-[#10B981]' : ''} />
                }}
              </NavLink>
            )
          )}

          {/* ── Nav projet actif ── */}
          {projectId && (
            <>
              <div className={cn('pt-4 pb-2', sidebarOpen ? 'px-1' : 'flex justify-center')}>
                {sidebarOpen ? (
                  <div className="flex items-center gap-1.5">
                    <ChevronRight size={11} className="text-[#10B981]" />
                    <span className="text-[10px] text-[#10B981] uppercase tracking-widest font-bold truncate">
                      {project?.code_projet ?? 'Projet'}
                    </span>
                  </div>
                ) : (
                  <div className="w-6 h-px bg-[#1E293B] hidden md:block" />
                )}
              </div>
              <div className="space-y-0.5">
                {projectNav.map(({ to, icon, label }) =>
                  sidebarOpen ? (
                    <NavItem key={to} to={`/projects/${projectId}/${to}`} icon={icon} label={label} />
                  ) : (
                    <NavLink key={to} to={`/projects/${projectId}/${to}`} title={label}
                      className={({ isActive }) => cn(
                        'flex items-center justify-center w-10 h-10 mx-auto rounded-xl transition-all duration-200 hidden md:flex',
                        isActive ? 'bg-[#10B981]/10 text-[#10B981]' : 'text-[#94A3B8] hover:text-white hover:bg-white/5'
                      )}>
                      {({ isActive }) => {
                        const Icon = icon
                        return <Icon size={16} className={isActive ? 'text-[#10B981]' : ''} />
                      }}
                    </NavLink>
                  )
                )}
              </div>
            </>
          )}
        </nav>

        {/* ── Utilisateur ── */}
        <div className="shrink-0 border-t border-[#1E293B] p-2 relative" ref={menuRef}>
          <button
            onClick={() => setUserMenuOpen(v => !v)}
            className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-white/5 transition-all duration-200 group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#6366F1] flex items-center justify-center shrink-0 text-white text-xs font-bold shadow-md">
              {initials}
            </div>
            {sidebarOpen && (
              <>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-white text-xs font-semibold truncate">{user?.prenom} {user?.nom}</p>
                  <p className="text-[#94A3B8] text-[10px] truncate">{user?.role ?? 'Administrateur'}</p>
                </div>
                <ChevronDown size={13} className={cn('text-[#94A3B8] transition-transform duration-200', userMenuOpen && 'rotate-180')} />
              </>
            )}
          </button>

          {/* User dropdown */}
          {userMenuOpen && (
            <div className={cn(
              'absolute bottom-full mb-2 bg-[#101827] border border-[#1E293B] rounded-2xl shadow-2xl shadow-black/40 overflow-hidden z-50',
              sidebarOpen ? 'left-2 right-2' : 'left-14 w-48'
            )}>
              <div className="px-4 py-3 border-b border-[#1E293B]">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#6366F1] flex items-center justify-center text-white text-sm font-bold mx-auto mb-2">
                  {initials}
                </div>
                <p className="text-white text-xs font-semibold text-center">{user?.prenom} {user?.nom}</p>
                <p className="text-[#94A3B8] text-[10px] text-center">{user?.email ?? 'admin@sigp.ci'}</p>
              </div>
              <div className="p-1.5">
                <button onClick={() => { navigate('/settings'); setUserMenuOpen(false); if (window.innerWidth < 768) toggleSidebar(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-[#94A3B8] hover:text-white hover:bg-white/5 transition-all">
                  <User2 size={14} /> Profil
                </button>
                <button onClick={() => { navigate('/settings'); setUserMenuOpen(false); if (window.innerWidth < 768) toggleSidebar(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-[#94A3B8] hover:text-white hover:bg-white/5 transition-all">
                  <Settings size={14} /> ⚙️ Paramètres
                </button>
                <div className="my-1 border-t border-[#1E293B]" />
                <button onClick={() => { logout(); if (window.innerWidth < 768) toggleSidebar(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all">
                  <LogOut size={14} /> ↩️ Déconnexion
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
