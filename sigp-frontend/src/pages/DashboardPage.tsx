import { Link } from 'react-router-dom'
import { FolderOpen, Activity, TrendingUp, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/AppShell'
import { KPICard } from '@/components/shared/KPICard'
import { StatusBadge } from '@/components/shared/Badges'
import { useDashboard } from '@/hooks/useDashboard'
import { useProjects } from '@/hooks/useProjects'
import { formatCurrency, formatDate } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function DashboardPage() {
  const { data: dashboard, isLoading: dashLoading } = useDashboard()
  const { data: projetsData, isLoading: projLoading } = useProjects({ limit: 10 })
  const projets = projetsData?.data ?? []

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Dashboard Global"
        subtitle="Vue d'ensemble de tous les projets de développement"
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* KPIs */}
        {dashLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-sigp-muted" /></div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              label="Projets Actifs"
              value={dashboard?.projets?.actifs ?? projets.filter(p => p.statut === 'ACTIF').length}
              subtitle={`${dashboard?.projets?.total ?? projets.length} projets au total`}
              icon={FolderOpen}
              color="blue"
            />
            <KPICard
              label="CPI Moyen"
              value={dashboard?.evm_global?.cpi?.toFixed(2) ?? '—'}
              subtitle="Indice performance coût"
              icon={Activity}
              color={
                (dashboard?.evm_global?.cpi ?? 1) >= 1 ? 'green'
                : (dashboard?.evm_global?.cpi ?? 1) >= 0.9 ? 'yellow' : 'red'
              }
            />
            <KPICard
              label="SPI Moyen"
              value={dashboard?.evm_global?.spi?.toFixed(2) ?? '—'}
              subtitle="Indice performance délais"
              icon={TrendingUp}
              color={
                (dashboard?.evm_global?.spi ?? 1) >= 1 ? 'green'
                : (dashboard?.evm_global?.spi ?? 1) >= 0.9 ? 'yellow' : 'red'
              }
            />
            <KPICard
              label="En Retard"
              value={dashboard?.projets?.en_retard ?? 0}
              subtitle="Projets SPI < 0.9"
              icon={AlertTriangle}
              color={(dashboard?.projets?.en_retard ?? 0) > 0 ? 'red' : 'green'}
            />
          </div>
        )}

        {/* Tableau des projets */}
        <div className="bg-navy-800 border border-navy-500 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-navy-500">
            <h2 className="text-sm font-semibold text-sigp-text">Projets</h2>
            <Link to="/projects" className="text-xs text-sigp-blue hover:text-sigp-blue-light flex items-center gap-1">
              Voir tous <ArrowRight size={12} />
            </Link>
          </div>

          {projLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-sigp-muted" />
            </div>
          ) : projets.length === 0 ? (
            <div className="text-center py-12 text-sigp-muted text-sm">
              Aucun projet. <Link to="/projects" className="text-sigp-blue hover:underline">Créer un projet</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="excel-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Nom du Projet</th>
                    <th>Bailleur</th>
                    <th>Date Début</th>
                    <th>Date Fin</th>
                    <th>Budget</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projets.map((p) => (
                    <tr key={p.id}>
                      <td className="font-mono text-sigp-blue font-medium">{p.code_projet}</td>
                      <td className="max-w-xs truncate font-medium text-sigp-text">{p.nom_projet}</td>
                      <td className="text-sigp-muted">{p.bailleur_principal}</td>
                      <td className="font-mono text-sigp-muted">{formatDate(p.date_debut)}</td>
                      <td className="font-mono text-sigp-muted">{formatDate(p.date_fin)}</td>
                      <td className="font-mono text-right">{formatCurrency(p.budget_total, p.devise)}</td>
                      <td><StatusBadge statut={p.statut} /></td>
                      <td>
                        <Link
                          to={`/projects/${p.id}`}
                          className="text-xs text-sigp-blue hover:text-sigp-blue-light flex items-center gap-1"
                        >
                          Ouvrir <ArrowRight size={10} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Bar chart budgets */}
        {projets.length > 0 && (
          <div className="bg-navy-800 border border-navy-500 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-sigp-text mb-4">Budget par Projet</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={projets.slice(0, 8).map(p => ({
                name: p.code_projet,
                budget: parseFloat(p.budget_total),
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2D3A52" />
                <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={{ stroke: '#2D3A52' }} tickLine={false} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={{ stroke: '#2D3A52' }} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1A2640', border: '1px solid #2D3A52', borderRadius: 8 }}
                  labelStyle={{ color: '#94A3B8' }}
                  itemStyle={{ color: '#2563EB' }}
                />
                <Bar dataKey="budget" fill="#2563EB" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
