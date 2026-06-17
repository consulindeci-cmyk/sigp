import { Link } from 'react-router-dom'
import {
  FolderOpen, Activity, TrendingUp, AlertTriangle,
  ArrowRight, Loader2, Coins, CheckSquare,
  BarChart3, Clock, Download
} from 'lucide-react'
import { StatusBadge } from '@/components/shared/Badges'
import { useDashboard } from '@/hooks/useDashboard'
import { useProjects } from '@/hooks/useProjects'
import { formatCurrency, formatDate } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts'
import { useState } from 'react'

// ── KPI Card premium ───────────────────────────────────────────
function StatCard({
  label, value, subtitle, icon: Icon, color, trend
}: {
  label: string; value: string | number; subtitle?: string
  icon: any; color: string; trend?: number
}) {
  const colors: Record<string, { bg: string; text: string; glow: string }> = {
    green:  { bg: 'bg-[#10B981]/10', text: 'text-[#10B981]', glow: 'shadow-[#10B981]/10' },
    blue:   { bg: 'bg-[#3B82F6]/10', text: 'text-[#3B82F6]', glow: 'shadow-[#3B82F6]/10' },
    yellow: { bg: 'bg-[#F59E0B]/10', text: 'text-[#F59E0B]', glow: 'shadow-[#F59E0B]/10' },
    violet: { bg: 'bg-[#8B5CF6]/10', text: 'text-[#8B5CF6]', glow: 'shadow-[#8B5CF6]/10' },
  }
  const c = colors[color] ?? colors.blue

  return (
    <div className={`
      group relative bg-[#101827] border border-[#1E293B] rounded-2xl p-5
      hover:border-white/10 transition-all duration-300
      hover:shadow-xl ${c.glow} cursor-default
    `}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 ${c.bg} rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
          <Icon size={20} className={c.text} />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${trend >= 0 ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-red-500/10 text-red-400'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="text-2xl md:text-3xl font-black text-white tracking-tight mb-1">{value}</p>
      <p className="text-[#94A3B8] text-xs font-semibold uppercase tracking-wider">{label}</p>
      {subtitle && <p className="text-[#94A3B8]/60 text-[11px] mt-0.5">{subtitle}</p>}
    </div>
  )
}

// ── Filter Tab ─────────────────────────────────────────────────
function FilterTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200
        ${active
          ? 'bg-[#10B981] text-white shadow-lg shadow-[#10B981]/20'
          : 'text-[#94A3B8] hover:text-white hover:bg-white/5 border border-transparent'
        }`}>
      {label}
    </button>
  )
}

// ── Dashboard Page ─────────────────────────────────────────────
export default function DashboardPage() {
  const { data: dashboard, isLoading: dashLoading } = useDashboard()
  const { data: projetsData, isLoading: projLoading } = useProjects({ limit: 20 })
  const projets = projetsData?.data ?? []
  const [filter, setFilter] = useState('Tous')
  const filters = ['Tous', 'ACTIF', 'PREPARATION', 'SUSPENDU', 'CLOTURE']

  const filteredProjets = filter === 'Tous' ? projets : projets.filter(p => p.statut === filter)

  // Chart data
  const chartData = projets.slice(0, 8).map(p => ({
    name: p.code_projet,
    budget: parseFloat(String(p.budget_total)) / 1_000_000,
  }))

  const trendData = [
    { month: 'Jan', evm: 0.85, cpi: 0.92 },
    { month: 'Fév', evm: 0.88, cpi: 0.95 },
    { month: 'Mar', evm: 0.91, cpi: 0.98 },
    { month: 'Avr', evm: 0.87, cpi: 0.94 },
    { month: 'Mai', evm: 0.93, cpi: 1.01 },
    { month: 'Jun', evm: 0.96, cpi: 1.03 },
  ]

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 min-h-full">

      {/* ── Page Title ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">Tableau de bord</h1>
          <p className="text-[#94A3B8] text-sm mt-0.5">Vue d'ensemble de tous les projets de développement</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#10B981]/10 border border-[#10B981]/20 rounded-xl">
            <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-[#10B981] text-xs font-bold">En direct</span>
          </div>
          <button className="flex items-center gap-2 px-3.5 py-1.5 bg-[#101827] border border-[#1E293B] rounded-xl text-[#94A3B8] hover:text-white text-xs font-semibold transition-all">
            <Download size={13} /> Exporter
          </button>
        </div>
      </div>

      {/* ── KPIs ── */}
      {dashLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[#94A3B8]" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Projets actifs"
            value={dashboard?.projets?.actifs ?? projets.filter(p => p.statut === 'ACTIF').length}
            subtitle={`${projets.length} au total`}
            icon={FolderOpen}
            color="green"
            trend={8}
          />
          <StatCard
            label="Budget total"
            value={(() => {
              const total = projets.reduce((s, p) => s + parseFloat(String(p.budget_total) || '0'), 0)
              return total >= 1_000_000 ? `${(total / 1_000_000).toFixed(1)}M F` : formatCurrency(String(total), 'XOF')
            })()}
            subtitle="Toutes devises confondues"
            icon={Coins}
            color="blue"
            trend={12}
          />
          <StatCard
            label="Risques ouverts"
            value={5}
            subtitle="2 critiques"
            icon={AlertTriangle}
            color="yellow"
            trend={-3}
          />
          <StatCard
            label="Tâches totales"
            value={dashboard?.taches?.total ?? 17}
            subtitle={`${dashboard?.taches?.terminees ?? 0} terminées`}
            icon={CheckSquare}
            color="violet"
            trend={5}
          />
        </div>
      )}

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Budget bar chart */}
        <div className="lg:col-span-2 bg-[#101827] border border-[#1E293B] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-white font-bold text-sm">Budget par Projet</h2>
              <p className="text-[#94A3B8] text-xs mt-0.5">En millions de FCFA</p>
            </div>
            <BarChart3 size={18} className="text-[#3B82F6]" />
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0A0F1E', border: '1px solid #1E293B', borderRadius: 12 }}
                  labelStyle={{ color: '#94A3B8', fontSize: 11 }}
                  itemStyle={{ color: '#3B82F6', fontSize: 12 }}
                  formatter={(v) => [`${Number(v).toFixed(2)}M F`, 'Budget']}
                />
                <Bar dataKey="budget" fill="#3B82F6" radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-[#94A3B8] text-sm">
              Aucun projet disponible
            </div>
          )}
        </div>

        {/* EVM Trend */}
        <div className="bg-[#101827] border border-[#1E293B] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-white font-bold text-sm">Tendance EVM</h2>
              <p className="text-[#94A3B8] text-xs mt-0.5">SPI / CPI global</p>
            </div>
            <TrendingUp size={18} className="text-[#10B981]" />
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="evmGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10B981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="cpiGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0.7, 1.1]} tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#0A0F1E', border: '1px solid #1E293B', borderRadius: 12 }}
                labelStyle={{ color: '#94A3B8', fontSize: 11 }} />
              <Area type="monotone" dataKey="evm" stroke="#10B981" strokeWidth={2} fill="url(#evmGrad)" name="SPI" />
              <Area type="monotone" dataKey="cpi" stroke="#3B82F6" strokeWidth={2} fill="url(#cpiGrad)" name="CPI" />
            </AreaChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 rounded bg-[#10B981]" /><span className="text-[#94A3B8] text-[10px]">SPI</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 rounded bg-[#3B82F6]" /><span className="text-[#94A3B8] text-[10px]">CPI</span></div>
          </div>
        </div>
      </div>

      {/* ── Projets Table ── */}
      <div className="bg-[#101827] border border-[#1E293B] rounded-2xl overflow-hidden">
        {/* Table header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-5 py-4 border-b border-[#1E293B] gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-white font-bold text-sm">Projets</h2>
            <span className="text-[10px] font-bold text-[#94A3B8] bg-[#1E293B] px-2 py-0.5 rounded-full">
              {projets.length} total
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter tabs */}
            <div className="hidden md:flex items-center gap-1 bg-[#0A0F1E] border border-[#1E293B] rounded-xl p-1">
              {filters.map(f => (
                <FilterTab key={f} label={f === 'ACTIF' ? 'En cours' : f === 'CLOTURE' ? 'Terminé' : f === 'SUSPENDU' ? 'En attente' : f} active={filter === f} onClick={() => setFilter(f)} />
              ))}
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0A0F1E] border border-[#1E293B] rounded-xl text-[#94A3B8] hover:text-white text-xs transition-all">
              <Download size={12} /> Export
            </button>
            <Link to="/projects" className="flex items-center gap-1 text-xs text-[#10B981] hover:text-[#34D399] font-semibold transition-colors">
              Voir tous <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {/* Table */}
        {projLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[#94A3B8]" /></div>
        ) : filteredProjets.length === 0 ? (
          <div className="text-center py-16 text-[#94A3B8]">
            <FolderOpen size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">Aucun projet.</p>
            <Link to="/projects" className="text-[#10B981] hover:underline text-sm mt-1 inline-block">
              Créer un projet →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr className="border-b border-[#1E293B]">
                  {['Code', 'Nom du Projet', 'Bailleur', 'Début', 'Fin', 'Budget', 'Statut', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider first:pl-5 last:pr-5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]">
                {filteredProjets.map(p => (
                  <tr key={p.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3.5 pl-5">
                      <span className="font-mono text-xs font-bold text-[#3B82F6] bg-[#3B82F6]/10 px-2 py-0.5 rounded-lg whitespace-nowrap">
                        {p.code_projet}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 max-w-[200px]">
                      <p className="text-white font-semibold text-xs truncate">{p.nom_projet}</p>
                    </td>
                    <td className="px-4 py-3.5 text-[#94A3B8] text-xs">{p.bailleur_principal}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 text-[#94A3B8] text-xs">
                        <Clock size={11} />
                        {formatDate(p.date_debut)}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-[#94A3B8] text-xs">{formatDate(p.date_fin)}</td>
                    <td className="px-4 py-3.5 font-mono text-xs font-semibold text-white">
                      {formatCurrency(p.budget_total, p.devise)}
                    </td>
                    <td className="px-4 py-3.5"><StatusBadge statut={p.statut} /></td>
                    <td className="px-4 py-3.5 pr-5">
                      <Link to={`/projects/${p.id}/dashboard`}
                        className="flex items-center gap-1 text-xs text-[#94A3B8] hover:text-[#10B981] font-semibold transition-colors opacity-0 group-hover:opacity-100">
                        Ouvrir <ArrowRight size={11} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Activity ── */}
      <div className="bg-[#101827] border border-[#1E293B] rounded-2xl p-5">
        <h2 className="text-white font-bold text-sm mb-4">Activité récente</h2>
        <div className="space-y-3">
          {[
            { icon: '🟢', msg: 'Tâche T024 marquée Terminée', sub: 'Projet PAEP-CI-2025', time: '5 min' },
            { icon: '🔴', msg: 'Risque R12 escaladé au niveau CRITIQUE', sub: 'Projet INFRA-BM', time: '1h' },
            { icon: '📊', msg: 'EVM recalculé — CPI : 1.03', sub: 'Rapport généré automatiquement', time: '3h' },
            { icon: '💰', msg: 'Budget Q2 validé : 4.3M FCFA', sub: 'Projet AGRI-FIDA-2026', time: '1j' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 py-2 hover:bg-white/5 px-2 rounded-xl cursor-pointer transition-colors group">
              <span className="text-base shrink-0 mt-0.5">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-semibold">{item.msg}</p>
                <p className="text-[#94A3B8] text-[10px] mt-0.5">{item.sub}</p>
              </div>
              <span className="text-[#94A3B8] text-[10px] shrink-0 mt-0.5">Il y a {item.time}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
