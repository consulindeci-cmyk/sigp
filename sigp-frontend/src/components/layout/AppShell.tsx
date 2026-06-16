import { useState, useRef, useEffect } from 'react'
import { Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { useAuthStore } from '@/stores/authStore'
import { Bell, Search, Plus, ChevronRight } from 'lucide-react'

// ── Breadcrumb map ──────────────────────────────────────────────
const routeLabels: Record<string, string> = {
  dashboard: 'Tableau de bord',
  projects: 'Projets',
  settings: 'Paramètres',
  'saisie-poa': 'Saisie POA',
  'moteur-evm': 'Moteur EVM',
  logframe: 'Cadre Logique',
  ptba: 'PTBA',
  budget: 'Budget',
  ppm: 'PPM',
  risks: 'Risques',
  wbs: 'WBS',
}

function Breadcrumb() {
  const location = useLocation()
  const segments = location.pathname.split('/').filter(Boolean).filter(s => !/^[0-9a-f-]{20,}$/i.test(s))
  const crumbs = segments.map(s => routeLabels[s] ?? s)

  return (
    <nav className="flex items-center gap-1.5 text-sm">
      <span className="text-[#94A3B8] hover:text-white cursor-pointer transition-colors">Accueil</span>
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <ChevronRight size={12} className="text-[#1E293B]" />
          <span className={i === crumbs.length - 1 ? 'text-white font-semibold' : 'text-[#94A3B8]'}>
            {crumb}
          </span>
        </span>
      ))}
    </nav>
  )
}

// ── AppShell ────────────────────────────────────────────────────
export function AppShell() {
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const [notifOpen, setNotifOpen] = useState(false)
  const [search, setSearch] = useState('')
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!isAuthenticated) return <Navigate to="/login" replace />

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#0A0F1E' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* ── HEADER ── */}
        <header className="shrink-0 flex items-center gap-4 px-6 py-3.5 border-b border-[#1E293B] bg-[#0A0F1E]">
          {/* Breadcrumb */}
          <div className="flex-1 min-w-0">
            <Breadcrumb />
          </div>

          {/* Search bar */}
          <div className="relative hidden md:flex items-center">
            <Search size={14} className="absolute left-3 text-[#94A3B8] pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-48 lg:w-64 bg-[#101827] border border-[#1E293B] rounded-xl pl-9 pr-4 py-2
                text-sm text-white placeholder:text-[#94A3B8]/60
                focus:outline-none focus:border-[#10B981]/50 focus:ring-2 focus:ring-[#10B981]/10
                transition-all duration-200"
            />
          </div>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button onClick={() => setNotifOpen(v => !v)}
              className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-[#101827] border border-[#1E293B] text-[#94A3B8] hover:text-white hover:border-[#10B981]/30 transition-all duration-200">
              <Bell size={16} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#10B981] rounded-full ring-2 ring-[#0A0F1E]" />
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-[#101827] border border-[#1E293B] rounded-2xl shadow-2xl shadow-black/50 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-[#1E293B] flex items-center justify-between">
                  <h3 className="text-white text-sm font-bold">Notifications</h3>
                  <span className="text-[10px] text-[#10B981] font-semibold bg-[#10B981]/10 px-2 py-0.5 rounded-full">3 nouvelles</span>
                </div>
                <div className="divide-y divide-[#1E293B]">
                  {[
                    { icon: '🔴', msg: 'Risque critique détecté — Projet PAEP', time: 'Il y a 5 min' },
                    { icon: '🟡', msg: 'SPI < 0.9 sur 2 projets', time: 'Il y a 1h' },
                    { icon: '🟢', msg: 'Rapport Q2 généré avec succès', time: 'Il y a 3h' },
                  ].map((n, i) => (
                    <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors">
                      <span className="text-base shrink-0 mt-0.5">{n.icon}</span>
                      <div>
                        <p className="text-white text-xs font-medium">{n.msg}</p>
                        <p className="text-[#94A3B8] text-[10px] mt-0.5">{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Nouveau Projet button */}
          <button
            onClick={() => navigate('/projects')}
            className="flex items-center gap-2 px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white font-semibold text-sm rounded-xl transition-all duration-200 shadow-lg shadow-[#10B981]/20 hover:shadow-[#10B981]/30 active:scale-95">
            <Plus size={15} />
            <span className="hidden sm:inline">Nouveau Projet</span>
          </button>
        </header>

        {/* ── Page Content ── */}
        <main className="flex-1 overflow-y-auto" style={{ backgroundColor: '#0A0F1E' }}>
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
    <div className="flex items-start justify-between px-6 py-4 border-b border-[#1E293B]">
      <div>
        <h1 className="text-base font-bold text-white">{title}</h1>
        {subtitle && <p className="text-xs text-[#94A3B8] mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
