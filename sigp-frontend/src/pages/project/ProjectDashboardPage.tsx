import { useParams } from 'react-router-dom'
import { AlertTriangle, TrendingUp, DollarSign, Activity, Clock, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/AppShell'
import { KPICard } from '@/components/shared/KPICard'
import { EVMBadge, StatusBadge } from '@/components/shared/Badges'
import { SCurveChart } from '@/components/shared/SCurveChart'
import { useEvm, useEvmTrend, useEvmTasks } from '@/hooks/useEvm'
import { useProject } from '@/hooks/useProjects'
import { useProjectSummary } from '@/hooks/useDashboard'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, RadialBarChart, RadialBar, Legend } from 'recharts'

export default function ProjectDashboardPage() {
  const { id: projectId = '' } = useParams()
  const { data: project } = useProject(projectId)
  const { data: evm, isLoading: evmLoading } = useEvm(projectId)
  const { data: trend, isLoading: trendLoading } = useEvmTrend(projectId)
  const { data: evmTasks } = useEvmTasks(projectId)
  const { data: summary } = useProjectSummary(projectId)

  const alertes = evmTasks?.filter(t => t.cv < 0 || t.spi < 0.9) ?? []
  const scurveData = trend?.evolution_mensuelle ?? []
  const tasksLoading = evmLoading

  // Données dépassement budget par tâche (top 8)
  const overrunData = (evmTasks ?? [])
    .filter(t => t.ac > 0)
    .sort((a, b) => (b.ac - b.ev) - (a.ac - a.ev))
    .slice(0, 8)
    .map(t => ({ name: t.code_tache, overrun: Math.max(0, t.ac - t.ev), planned: t.ev }))

  const avancementGlobal = evmTasks && evmTasks.length > 0
    ? Math.round(evmTasks.reduce((s, t) => s + t.avancement, 0) / evmTasks.length)
    : 0

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={`Dashboard — ${project?.nom_projet ?? '...'}`}
        subtitle={`${project?.code_projet} · ${project?.bailleur_principal}`}
        actions={
          project && <StatusBadge statut={project.statut} />
        }
      />

      <div className="flex-1 overflow-x-auto overflow-y-auto w-full p-4 md:p-6 space-y-4 md:space-y-6">
        {/* KPIs principaux */}
        {tasksLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-sigp-muted" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <KPICard
                label="BAC"
                value={evm ? formatCurrency(evm.bac, project?.devise) : '—'}
                subtitle="Budget à l'achèvement"
                icon={DollarSign}
                color="blue"
              />
              <KPICard
                label="EV (Valeur Acquise)"
                value={evm ? formatCurrency(evm.ev, project?.devise) : '—'}
                icon={Activity}
                color="green"
              />
              <KPICard
                label="AC (Coût Réel)"
                value={evm ? formatCurrency(evm.ac, project?.devise) : '—'}
                icon={DollarSign}
                color={evm && evm.ac > evm.ev ? 'red' : 'yellow'}
              />
              <KPICard
                label="EAC (Coût Final Estimé)"
                value={evm ? formatCurrency(evm.eac, project?.devise) : '—'}
                subtitle={evm ? `VAC: ${formatCurrency(evm.vac, project?.devise)}` : ''}
                color={evm && evm.vac >= 0 ? 'green' : 'red'}
              />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {/* CPI */}
              <div className="kpi-card flex flex-col gap-2">
                <p className="text-xs text-sigp-muted uppercase tracking-wider">CPI — Perf. Coût</p>
                {evm ? <EVMBadge value={evm.cpi} size="lg" /> : <span className="text-sigp-muted">—</span>}
                <p className="text-xs text-sigp-muted">{(evm?.cpi ?? 0) >= 1 ? '✓ Dans le budget' : '✗ Dépassement'}</p>
              </div>
              {/* SPI */}
              <div className="kpi-card flex flex-col gap-2">
                <p className="text-xs text-sigp-muted uppercase tracking-wider">SPI — Perf. Délais</p>
                {evm ? <EVMBadge value={evm.spi} size="lg" /> : <span className="text-sigp-muted">—</span>}
                <p className="text-xs text-sigp-muted">{(evm?.spi ?? 0) >= 1 ? '✓ Dans les délais' : '✗ En retard'}</p>
              </div>
              {/* Avancement */}
              <div className="kpi-card flex flex-col gap-2">
                <p className="text-xs text-sigp-muted uppercase tracking-wider">Avancement Global</p>
                <p className="text-2xl font-bold text-sigp-text">{avancementGlobal}%</p>
                <div className="w-full h-2 bg-navy-600 rounded-full overflow-hidden">
                  <div className="h-full bg-sigp-blue rounded-full transition-all" style={{ width: `${avancementGlobal}%` }} />
                </div>
              </div>
              {/* Solde */}
              <div className="kpi-card flex flex-col gap-2">
                <p className="text-xs text-sigp-muted uppercase tracking-wider">Solde Disponible</p>
                <p className={`text-2xl font-bold ${summary && summary.solde_disponible >= 0 ? 'text-sigp-green' : 'text-sigp-red'}`}>
                  {summary ? formatCurrency(summary.solde_disponible, project?.devise) : '—'}
                </p>
                {summary && <p className="text-xs text-sigp-muted">{formatPercent(summary.taux_consommation_pct)} consommé</p>}
              </div>
            </div>

            {/* Courbe en S + Bar chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-navy-800 border border-navy-500 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-sigp-text mb-1">Courbe en S — PV / EV / AC</h3>
                <p className="text-xs text-sigp-muted mb-3">Évolution mensuelle des indicateurs EVM</p>
                {trendLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="animate-spin text-sigp-muted" /></div>
                ) : (
                  <SCurveChart data={scurveData} />
                )}
              </div>

              <div className="bg-navy-800 border border-navy-500 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-sigp-text mb-1">Dépassements Budgétaires</h3>
                <p className="text-xs text-sigp-muted mb-3">Coût réel vs valeur acquise par tâche</p>
                {overrunData.length === 0 ? (
                  <div className="flex items-center justify-center h-40 text-sigp-green text-sm">
                    ✓ Aucun dépassement détecté
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={overrunData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2D3A52" />
                      <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={{ stroke: '#2D3A52' }} tickLine={false} />
                      <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={{ stroke: '#2D3A52' }} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#1A2640', border: '1px solid #2D3A52', borderRadius: 8 }} labelStyle={{ color: '#94A3B8' }} />
                      <Bar dataKey="planned" name="EV Planifié" fill="#2563EB" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="overrun" name="Dépassement" fill="#EF4444" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Alertes */}
            {alertes.length > 0 && (
              <div className="bg-navy-800 border border-sigp-red/30 rounded-lg overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-sigp-red/20 bg-sigp-red/5">
                  <AlertTriangle size={14} className="text-sigp-red" />
                  <h3 className="text-sm font-semibold text-sigp-red">{alertes.length} Alerte(s) Critique(s)</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="excel-table min-w-max">
                    <thead>
                      <tr>
                        <th>Code Tâche</th>
                        <th>Description</th>
                        <th className="text-center">CPI</th>
                        <th className="text-center">SPI</th>
                        <th className="text-right">CV</th>
                        <th>Problème</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alertes.map(t => (
                        <tr key={t.tache_id}>
                          <td className="font-mono text-sigp-red">{t.code_tache}</td>
                          <td className="max-w-xs truncate">{t.description}</td>
                          <td className="text-center"><EVMBadge value={t.cpi} size="sm" /></td>
                          <td className="text-center"><EVMBadge value={t.spi} size="sm" /></td>
                          <td className="text-right font-mono text-sigp-red">{formatNumber(t.cv, 0)}</td>
                          <td className="text-xs text-sigp-muted">
                            {t.cv < 0 && 'Dépassement budget '}
                            {t.spi < 0.9 && 'Retard significatif'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
