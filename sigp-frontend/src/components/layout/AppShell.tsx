import { useEffect } from 'react'
import { Outlet, Navigate, useNavigate, useLocation, useMatch } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { useProject } from '@/hooks/useProjects'

export function AppShell() {
  const { isAuthenticated } = useAuthStore()
  const { activeProjectId, activeProjectName, setActiveProject } = useUIStore()
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
    // Si l'utilisateur navigue vers un autre projet via l'URL, on force la mise à jour globale
    if (urlProjectId && urlProjectId !== activeProjectId && urlProject) {
      setActiveProject(urlProjectId, urlProject.nom_projet)
    }
  }, [isError, activeProjectId, urlProjectId, urlProject, setActiveProject])

  if (!isAuthenticated) return <Navigate to="/login" replace />

  const getPageTitle = () => {
    if (location.pathname.includes('/logframe')) return 'Cadre logique'
    if (location.pathname.includes('/projects')) return 'Gestion des projets'
    return 'Dashboard général'
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F6F8]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* ── HEADER ── */}
        <header className="shrink-0 flex items-center justify-between px-4 md:px-6 py-3 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#0A1628] flex items-center justify-center rounded">
              <span className="text-white font-bold text-sm tracking-widest">GPD</span>
            </div>
            <h1 className="font-bold text-[#0A1628] text-lg hidden lg:block">
              Gestion de Projets de Développement
            </h1>
          </div>
          
          <div className="text-gray-500 font-medium hidden md:block">
            {getPageTitle()}
          </div>
          
          <div className="flex items-center gap-3">
            {activeProjectId ? (
              <div className="flex items-center bg-[#2563EB] text-white rounded-lg overflow-hidden shadow-sm">
                <span className="px-4 py-2 text-sm font-semibold">
                  Projet actif : {activeProjectName}
                </span>
                <button 
                  onClick={() => {
                    setActiveProject(null, null)
                    navigate('/dashboard')
                  }}
                  className="px-3 py-2 bg-blue-700 hover:bg-blue-800 transition-colors flex items-center justify-center border-l border-blue-600"
                  title="Quitter le projet et retourner au Dashboard Général"
                >
                  <span className="text-xs font-bold uppercase tracking-wider">Quitter ✕</span>
                </button>
              </div>
            ) : (
              <div className="bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-semibold">
                Projet actif : Aucun
              </div>
            )}
            <button className="bg-[#F97316] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors hover:bg-orange-600">
              Notifications
            </button>
            <button onClick={() => navigate('/settings')} className="bg-[#0F766E] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors hover:bg-teal-800">
              Profil
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
    <div className="flex flex-col sm:flex-row sm:items-start justify-between px-4 md:px-6 py-4 border-b border-gray-200 gap-4 bg-white">
      <div>
        <h1 className="text-xl font-bold text-[#0A1628]">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">{actions}</div>}
    </div>
  )
}
