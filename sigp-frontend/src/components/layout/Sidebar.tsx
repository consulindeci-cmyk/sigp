import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useUIStore } from '@/stores/uiStore'
import { 
  LayoutDashboard, FolderOpen, Target, CalendarDays, Wallet, 
  ClipboardList, TrendingUp, ShoppingCart, ShieldAlert, FileText, Users,
  Menu, ChevronLeft, LogOut
} from 'lucide-react'

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { activeProjectId, sidebarOpen, toggleSidebar, setActiveProject, setSidebarOpen } = useUIStore()
  
  const links = [
    { name: 'Dashboard', to: activeProjectId ? `/projects/${activeProjectId}/dashboard` : '/dashboard', isProjectMenu: false, icon: LayoutDashboard },
    { name: 'Projets', to: '/projects', isProjectMenu: false, icon: FolderOpen },
    { name: 'Cadre logique', to: activeProjectId ? `/projects/${activeProjectId}/logframe` : '/logframe', isProjectMenu: true, icon: Target },
    { name: 'PTBA', to: activeProjectId ? `/projects/${activeProjectId}/ptba` : '/ptba', isProjectMenu: true, icon: CalendarDays },
    { name: 'Budget & finances', to: activeProjectId ? `/projects/${activeProjectId}/budget` : '/budget', isProjectMenu: true, icon: Wallet },
    { name: 'Journal opérations', to: activeProjectId ? `/projects/${activeProjectId}/journal` : '/journal', isProjectMenu: true, icon: ClipboardList },
    { name: 'Valeur acquise EVM', to: activeProjectId ? `/projects/${activeProjectId}/moteur-evm` : '/moteur-evm', isProjectMenu: true, icon: TrendingUp },
    { name: 'Passation marchés', to: activeProjectId ? `/projects/${activeProjectId}/ppm` : '/ppm', isProjectMenu: true, icon: ShoppingCart },
    { name: 'Risques', to: activeProjectId ? `/projects/${activeProjectId}/risks` : '/risks', isProjectMenu: true, icon: ShieldAlert },
    { name: 'Rapports', to: activeProjectId ? `/projects/${activeProjectId}/reports` : '/reports', isProjectMenu: true, icon: FileText },
    { name: 'Utilisateurs', to: '/settings', isProjectMenu: false, icon: Users }
  ]

  return (
    <>
      {/* Overlay Mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Component */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-50 bg-[#0A1628] flex flex-col shrink-0 h-full 
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'w-[260px] translate-x-0' : 'w-[260px] lg:w-[76px] -translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <span className={`text-xs font-bold text-gray-400 uppercase tracking-wider transition-opacity duration-300 ${!sidebarOpen && 'lg:opacity-0'}`}>
            MENU
          </span>
          <button 
            onClick={toggleSidebar}
            className="text-gray-400 hover:text-white transition-colors lg:block hidden p-1 rounded-md hover:bg-white/10"
          >
            <Menu size={18} className={`transition-transform duration-300 ${sidebarOpen ? 'rotate-180' : ''}`} />
          </button>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="text-gray-400 hover:text-white transition-colors lg:hidden p-1 rounded-md hover:bg-white/10"
          >
            <ChevronLeft size={20} />
          </button>
        </div>
        
        <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto mt-2 pb-6 sigp-scrollbar">
          {links.map((link) => {
            let isActive = false
            if (link.name === 'Projets') {
              isActive = location.pathname === '/projects'
            } else {
              const lastPart = link.to.split('/').pop()
              if (lastPart) {
                isActive = location.pathname.includes(`/${lastPart}`)
              }
            }
            const Icon = link.icon
              
            return (
              <NavLink 
                key={link.name} 
                to={link.to}
                onClick={() => {
                  if (window.innerWidth < 1024) setSidebarOpen(false)
                }}
                className={`
                  group relative flex items-center px-3 py-2.5 rounded-xl font-medium text-sm transition-all
                  ${isActive 
                    ? 'bg-[#2563EB] text-white shadow-sm' 
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }
                `}
              >
                <Icon size={18} className={`shrink-0 ${sidebarOpen ? 'mr-3' : 'lg:mx-auto'}`} />
                <span className={`transition-opacity duration-300 ${!sidebarOpen && 'lg:hidden'}`}>
                  {link.name}
                </span>

                {/* Tooltip on collapse */}
                {!sidebarOpen && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-2 py-1 bg-gray-900 text-white text-xs font-medium rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 pointer-events-none lg:block hidden">
                    {link.name}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-1 border-4 border-transparent border-r-gray-900" />
                  </div>
                )}
              </NavLink>
            )
          })}
        </nav>
        
        <div className="p-4 mt-auto border-t border-white/10">
          <button 
            onClick={() => {
              setActiveProject(null, null)
              navigate('/dashboard')
            }} 
            className={`
              w-full bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 rounded-xl text-sm transition-colors flex justify-center items-center gap-2 group relative
            `}
          >
            <LogOut size={16} className={!sidebarOpen ? 'lg:mx-auto shrink-0' : ''} />
            <span className={`transition-opacity duration-300 ${!sidebarOpen && 'lg:hidden'}`}>Menu général</span>

            {!sidebarOpen && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-2 py-1 bg-gray-900 text-white text-xs font-medium rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 pointer-events-none lg:block hidden">
                Menu général
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-1 border-4 border-transparent border-r-gray-900" />
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  )
}

