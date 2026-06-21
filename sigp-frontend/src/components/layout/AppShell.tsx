import { useEffect } from 'react'
import { Outlet, Navigate, useNavigate, useLocation, useMatch } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { useProject } from '@/hooks/useProjects'
import { Menu, Bell, User, X } from 'lucide-react'

export function AppShell() {
  const { isAuthenticated, isAuthChecked } = useAuthStore()
  const { activeProjectId, activeProjectName, setActiveProject, setSidebarOpen } = useUIStore()
  const navigate = useNavigate()
  const location = useLocation()

  const { isError } = useProject(activeProjectId || '')
  
  // Extraire l'ID du projet depuis l'URL (ex: /projects/123/dashboard)
  const projectMatch = useMatch('/projects/:id/*')
  const urlProjectId = projectMatch?.params.id
  
  // Charger les détails du projet de l'URL pour obtenir son nom
  const { data: urlProject } = useProject(urlProjectId || '')

  useEffect(() => {
    // 1. Validation automatique du projet fantôme (supprimé en base)
    if (isError && activeProjectId) {
      setActiveProject(null, null)
    }
    
    // 2. Synchronisation URL -> Zustand
    if (urlProjectId && urlProjectId !== activeProjectId && urlProject) {
      setActiveProject(urlProjectId, urlProject.nom_projet)
    }
  }, [isError, activeProjectId, urlProjectId, urlProject, setActiveProject])

  // Attendre la vérification du cookie avant toute redirection
  if (!isAuthChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F5F6F8]">
        <div className="w-8 h-8 border-4 border-[#1d9e75]/30 border-t-[#1d9e75] rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />

  const getPageTitle = () => {
    if (location.pathname.includes('/logframe')) return 'Cadre logique'
    if (location.pathname.includes('/projects')) return 'Gestion des projets'
    return 'Dashboard général'
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F6F8]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* ── HEADER ── */}
        <header className="shrink-0 flex items-center justify-between px-4 lg:px-6 py-3 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 -ml-1.5 rounded-lg text-gray-500 hover:bg-gray-100 lg:hidden"
            >
              <Menu size={20} />
            </button>
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-[#0A1628] flex items-center justify-center rounded">
              <span className="text-white font-bold text-xs lg:text-sm tracking-widest">GPD</span>
            </div>
            <h1 className="font-bold text-[#0A1628] text-base lg:text-lg hidden md:block">
              Gestion de Projets de Développement
            </h1>
          </div>
          
          <div className="text-gray-500 font-medium text-sm hidden xl:block absolute left-1/2 -translate-x-1/2">
            {getPageTitle()}
          </div>
          
          <div className="flex items-center gap-2 lg:gap-3">
            {activeProjectId ? (
              <div className="flex items-center bg-[#2563EB] text-white rounded-lg overflow-hidden shadow-sm h-9 lg:h-10">
                <span className="px-3 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm font-semibold max-w-[120px] lg:max-w-none truncate">
                  <span className="hidden lg:inline">Projet actif : </span>{activeProjectName}
                </span>
                <button 
                  onClick={() => {
                    setActiveProject(null, null)
                    navigate('/dashboard')
                  }}
                  className="px-2 lg:px-3 h-full bg-blue-700 hover:bg-blue-800 transition-colors flex items-center justify-center border-l border-blue-600"
                  title="Quitter le projet"
                >
                  <X size={14} className="lg:hidden" />
                  <span className="text-xs font-bold uppercase tracking-wider hidden lg:inline">Quitter ✕</span>
                </button>
              </div>
            ) : (
              <div className="bg-gray-100 text-gray-500 px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-semibold hidden sm:block">
                Aucun projet actif
              </div>
            )}
            
            <button className="flex items-center justify-center w-9 h-9 lg:w-auto lg:h-auto lg:bg-[#F97316] text-[#F97316] lg:text-white lg:px-4 lg:py-2 rounded-lg text-sm font-semibold transition-colors lg:hover:bg-orange-600 hover:bg-orange-50 bg-transparent">
              <Bell size={18} className="lg:hidden" />
              <span className="hidden lg:inline">Notifications</span>
            </button>
            <button onClick={() => navigate('/settings')} className="flex items-center justify-center w-9 h-9 lg:w-auto lg:h-auto lg:bg-[#0F766E] text-[#0F766E] lg:text-white lg:px-4 lg:py-2 rounded-lg text-sm font-semibold transition-colors lg:hover:bg-teal-800 hover:bg-teal-50 bg-transparent">
              <User size={18} className="lg:hidden" />
              <span className="hidden lg:inline">Profil</span>
            </button>
          </div>
        </header>

        {/* ── Page Content ── */}
        <main className="flex-1 overflow-y-auto bg-[#F5F6F8]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

// ── PageHeader ─────────────────────────────────────────────────
interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between px-4 lg:px-6 py-4 border-b border-gray-200 gap-4 bg-white shrink-0">
      <div className="flex-1 min-w-0">
        <h1 className="text-lg lg:text-xl font-bold text-[#0A1628] truncate">{title}</h1>
        {subtitle && <p className="text-xs lg:text-sm text-gray-500 mt-1 truncate">{subtitle}</p>}
      </div>
      {actions && (
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 sigp-scrollbar shrink-0">
          {actions}
        </div>
      )}
    </div>
  )
}
