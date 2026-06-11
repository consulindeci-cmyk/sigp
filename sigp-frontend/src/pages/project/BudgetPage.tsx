import { useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/AppShell'
import { KPICard } from '@/components/shared/KPICard'
import { useBudget, useProjectSummary } from '@/hooks/useDashboard'
import { useProject } from '@/hooks/useProjects'
import { formatCurrency, formatPercent } from '@/lib/utils'

export default function BudgetPage() {
  const { id: projectId = '' } = useParams()
  const { data: project } = useProject(projectId)
  const { data: budgetData, isLoading: budgetLoading } = useBudget(projectId)
  const { data: summary, isLoading: summaryLoading } = useProjectSummary(projectId)

  const isLoading = budgetLoading || summaryLoading
  const lignes = budgetData?.data ?? []

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={`Suivi Budgétaire — ${project?.code_projet ?? '...'}`}
        subtitle="Suivi des décaissements et engagements"
      />

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-sigp-muted" /></div>
      ) : (
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-4 gap-4">
            <KPICard
              label="Budget Total"
              value={formatCurrency(summary?.budget_total ?? 0, project?.devise)}
              color="blue"
            />
            <KPICard
              label="Montant Engagé"
              value={formatCurrency(summary?.montant_engage ?? 0, project?.devise)}
              color="yellow"
            />
            <KPICard
              label="Montant Décaissé"
              value={formatCurrency(summary?.montant_decaisse ?? 0, project?.devise)}
              color="green"
            />
            <div className="kpi-card flex flex-col gap-2">
              <p className="text-xs text-sigp-muted uppercase tracking-wider">Taux d'exécution</p>
              <p className="text-2xl font-bold text-sigp-text">{formatPercent(summary?.taux_consommation_pct ?? 0)}</p>
              <div className="w-full h-2 bg-navy-600 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sigp-green rounded-full transition-all"
                  style={{ width: `${summary?.taux_consommation_pct ?? 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Tableau */}
          <div className="bg-navy-800 border border-navy-500 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-navy-500">
              <h2 className="text-sm font-semibold text-sigp-text">Lignes Budgétaires</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="excel-table">
                <thead>
                  <tr>
                    <th>Code Ligne</th>
                    <th>Désignation</th>
                    <th>Catégorie</th>
                    <th className="text-right">Budget Prévu</th>
                    <th className="text-right">Engagé</th>
                    <th className="text-right">Décaissé</th>
                    <th className="text-right">Solde</th>
                    <th className="text-center">Taux Décais.</th>
                  </tr>
                </thead>
                <tbody>
                  {lignes.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-sigp-muted">
                        Aucune ligne budgétaire.
                      </td>
                    </tr>
                  ) : (
                    lignes.map((l: any) => {
                      const prevu = parseFloat(l.montant_prevu)
                      const engage = parseFloat(l.montant_engage)
                      const decaisse = parseFloat(l.montant_decaisse)
                      const solde = prevu - decaisse
                      const taux = prevu > 0 ? (decaisse / prevu) * 100 : 0

                      return (
                        <tr key={l.id}>
                          <td className="font-mono text-sigp-blue">{l.code_ligne}</td>
                          <td>{l.designation}</td>
                          <td><span className="px-2 py-0.5 rounded bg-navy-600 text-xs">{l.categorie}</span></td>
                          <td className="text-right font-mono">{formatCurrency(prevu, project?.devise)}</td>
                          <td className="text-right font-mono text-sigp-yellow">{formatCurrency(engage, project?.devise)}</td>
                          <td className="text-right font-mono text-sigp-green">{formatCurrency(decaisse, project?.devise)}</td>
                          <td className="text-right font-mono">{formatCurrency(solde, project?.devise)}</td>
                          <td className="text-center">
                            <div className="flex items-center gap-2 justify-center">
                              <span className="font-mono text-xs w-8">{formatPercent(taux)}</span>
                              <div className="w-16 h-1.5 bg-navy-600 rounded-full overflow-hidden">
                                <div className="h-full bg-sigp-green" style={{ width: `${taux}%` }} />
                              </div>
                            </div>
                          </td>
                        </tr>
                      )
                    })
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
