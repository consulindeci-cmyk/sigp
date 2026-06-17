import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Calendar, Loader2, RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/layout/AppShell'
import { EVMBadge } from '@/components/shared/Badges'
import { KPICard } from '@/components/shared/KPICard'
import { useEvm, useEvmTasks } from '@/hooks/useEvm'
import { useProject } from '@/hooks/useProjects'
import { formatCurrency, formatNumber, getEvmBg } from '@/lib/utils'
import { cn } from '@/lib/utils'

export default function MoteurEVMPage() {
  const { id: projectId = '' } = useParams()
  const [dateControle, setDateControle] = useState('')

  const { data: project } = useProject(projectId)
  const { data: evm, isLoading: evmLoading, refetch } = useEvm(projectId, dateControle || undefined)
  const { data: evmTasks, isLoading: tasksLoading } = useEvmTasks(projectId, dateControle || undefined)

  const isLoading = evmLoading || tasksLoading

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={`Moteur EVM — ${project?.code_projet ?? '...'}`}
        subtitle="Calcul automatique Earned Value Management"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-navy-700 border border-navy-500 rounded-md px-2.5 py-1.5">
              <Calendar size={13} className="text-sigp-muted" />
              <input
                type="date"
                value={dateControle}
                onChange={e => setDateControle(e.target.value)}
                className="bg-transparent text-xs text-sigp-text outline-none"
                title="Date de contrôle"
              />
            </div>
            <button onClick={() => refetch()} className="btn-ghost flex items-center gap-1.5 text-xs">
              <RefreshCw size={13} /> Recalculer
            </button>
          </div>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-sigp-muted" /></div>
      ) : (
        <div className="flex-1 overflow-auto w-full p-4 md:p-6 space-y-4 md:space-y-6">
          {/* KPIs EVM globaux */}
          {evm && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <KPICard label="BAC (Budget)" value={formatCurrency(evm.bac, project?.devise)} color="blue" />
                <KPICard label="EV (Valeur Acquise)" value={formatCurrency(evm.ev, project?.devise)} color="green" />
                <KPICard label="AC (Coût Réel)" value={formatCurrency(evm.ac, project?.devise)} color="yellow" />
                <KPICard label="PV (Valeur Planifiée)" value={formatCurrency(evm.pv, project?.devise)} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="kpi-card">
                  <p className="text-xs text-sigp-muted uppercase tracking-wider mb-2">CPI</p>
                  <EVMBadge value={evm.cpi} size="lg" />
                  <p className="text-xs text-sigp-muted mt-1">Indice Perf. Coût</p>
                </div>
                <div className="kpi-card">
                  <p className="text-xs text-sigp-muted uppercase tracking-wider mb-2">SPI</p>
                  <EVMBadge value={evm.spi} size="lg" />
                  <p className="text-xs text-sigp-muted mt-1">Indice Perf. Délais</p>
                </div>
                <KPICard
                  label="CV (Écart Coût)"
                  value={formatCurrency(evm.cv, project?.devise)}
                  color={evm.cv >= 0 ? 'green' : 'red'}
                />
                <KPICard
                  label="SV (Écart Délai)"
                  value={formatCurrency(evm.sv, project?.devise)}
                  color={evm.sv >= 0 ? 'green' : 'red'}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <KPICard label="EAC (Coût Final Estimé)" value={formatCurrency(evm.eac, project?.devise)} color="blue" />
                <KPICard label="VAC (Variance à Complétion)" value={formatCurrency(evm.vac, project?.devise)} color={evm.vac >= 0 ? 'green' : 'red'} />
                <KPICard label="Date de contrôle" value={dateControle || 'Aujourd\'hui'} />
              </div>
            </>
          )}

          {/* Tableau EVM par tâche */}
          <div className="bg-navy-800 border border-navy-500 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-navy-500">
              <h2 className="text-sm font-semibold text-sigp-text">Analyse EVM par Tâche</h2>
              <p className="text-xs text-sigp-muted mt-0.5">Colonnes calculées automatiquement — non éditables</p>
            </div>
            <div className="overflow-x-auto">
              <table className="excel-table min-w-max">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th className="min-w-[160px]">Description</th>
                    <th>Phase WBS</th>
                    <th className="text-center">Avanc.</th>
                    <th className="text-right">BAC</th>
                    <th className="text-right">PV</th>
                    <th className="text-right">EV</th>
                    <th className="text-right">AC</th>
                    <th className="text-right">CV</th>
                    <th className="text-right">SV</th>
                    <th className="text-center">CPI</th>
                    <th className="text-center">SPI</th>
                    <th className="text-right">EAC</th>
                  </tr>
                </thead>
                <tbody>
                  {!evmTasks || evmTasks.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="text-center py-8 text-sigp-muted">
                        Aucune tâche. Ajoutez des tâches dans la Saisie POA.
                      </td>
                    </tr>
                  ) : (
                    evmTasks.map((t) => (
                      <tr key={t.tache_id}>
                        <td className="font-mono text-sigp-blue font-medium whitespace-nowrap">{t.code_tache}</td>
                        <td className="max-w-[200px] truncate">{t.description}</td>
                        <td className="text-sigp-muted">{t.wbs ?? '—'}</td>
                        <td className="text-center">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="font-mono text-xs">{t.avancement}%</span>
                            <div className="w-12 h-1 bg-navy-600 rounded-full overflow-hidden">
                              <div className="h-full bg-sigp-blue rounded-full" style={{ width: `${t.avancement}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="text-right font-mono">{formatNumber(t.bac, 0)}</td>
                        <td className="text-right font-mono text-sigp-muted">{formatNumber(t.pv, 0)}</td>
                        <td className="text-right font-mono text-sigp-green">{formatNumber(t.ev, 0)}</td>
                        <td className="text-right font-mono text-sigp-yellow">{formatNumber(t.ac, 0)}</td>
                        <td className={cn('text-right font-mono', t.cv >= 0 ? 'text-sigp-green' : 'text-sigp-red')}>
                          {formatNumber(t.cv, 0)}
                        </td>
                        <td className={cn('text-right font-mono', t.sv >= 0 ? 'text-sigp-green' : 'text-sigp-red')}>
                          {formatNumber(t.sv, 0)}
                        </td>
                        <td className="text-center">
                          <span className={cn('px-1.5 py-0.5 rounded text-xs font-mono font-semibold border', getEvmBg(t.cpi))}>
                            {formatNumber(t.cpi, 2)}
                          </span>
                        </td>
                        <td className="text-center">
                          <span className={cn('px-1.5 py-0.5 rounded text-xs font-mono font-semibold border', getEvmBg(t.spi))}>
                            {formatNumber(t.spi, 2)}
                          </span>
                        </td>
                        <td className="text-right font-mono">{formatNumber(t.eac, 0)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
