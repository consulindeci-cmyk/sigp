import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useUIStore } from '@/stores/uiStore'

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { activeProjectId, setActiveProject } = useUIStore()
  
  const links = [
    { name: 'Dashboard', to: activeProjectId ? `/projects/${activeProjectId}/dashboard` : '/dashboard', isProjectMenu: false },
    { name: 'Projets', to: '/projects', isProjectMenu: false },
    { name: 'Cadre logique', to: activeProjectId ? `/projects/${activeProjectId}/logframe` : '/logframe', isProjectMenu: true },
    { name: 'PTBA', to: activeProjectId ? `/projects/${activeProjectId}/ptba` : '/ptba', isProjectMenu: true },
    { name: 'Budget & finances', to: activeProjectId ? `/projects/${activeProjectId}/budget` : '/budget', isProjectMenu: true },
    { name: 'Journal opérations', to: activeProjectId ? `/projects/${activeProjectId}/journal` : '/journal', isProjectMenu: true },
    { name: 'Valeur acquise EVM', to: activeProjectId ? `/projects/${activeProjectId}/moteur-evm` : '/moteur-evm', isProjectMenu: true },
    { name: 'Passation marchés', to: activeProjectId ? `/projects/${activeProjectId}/ppm` : '/ppm', isProjectMenu: true },
    { name: 'Risques', to: activeProjectId ? `/projects/${activeProjectId}/risks` : '/risks', isProjectMenu: true },
    { name: 'Rapports', to: activeProjectId ? `/projects/${activeProjectId}/reports` : '/reports', isProjectMenu: true },
    { name: 'Utilisateurs', to: '/settings', isProjectMenu: false }
  ]

  return (
    <aside className="w-[260px] bg-[#0A1628] flex flex-col shrink-0 h-full">
      <div className="px-6 pt-8 pb-4">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">MENU</span>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto mt-2 pb-6">
        {links.map((link) => {
          let isActive = false
          if (link.name === 'Projets') {
            // "Projets" ne doit s'allumer que sur la page exacte /projects
            isActive = location.pathname === '/projects'
          } else {
            const lastPart = link.to.split('/').pop()
            if (lastPart) {
              isActive = location.pathname.includes(`/${lastPart}`)
            }
          }
            
          return (
            <NavLink 
              key={link.name} 
              to={link.to}
              className={
                isActive 
                  ? 'block px-4 py-3 rounded-xl font-bold text-sm shadow-sm bg-[#2563EB] text-white'
                  : 'block px-4 py-2 text-sm font-medium transition-all text-gray-300 hover:text-white underline underline-offset-4 decoration-white/30 hover:decoration-white'
              }
            >
              {link.name}
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
          className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-lg text-sm transition-colors flex justify-center items-center gap-2"
        >
          <span>←</span> Menu général
        </button>
      </div>
    </aside>
  )
}
