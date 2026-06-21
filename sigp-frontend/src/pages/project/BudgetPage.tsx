import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useUIStore } from '@/stores/uiStore'
import { useBudgetSummary, useBudgetLines } from '@/hooks/useBudget'
import { Loader2, Wallet, PlusCircle } from 'lucide-react'

// Utilitaire de formatage
const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n)

// Fonction de couleur dynamique pour les barres de progression
const getProgressColor = (percent: number) => {
  if (percent >= 90) return 'bg-[#DC2626]' // Rouge (Critique)
  if (percent >= 80) return 'bg-[#F97316]' // Orange (Vigilance)
  return 'bg-[#16A34A]' // Vert (OK)
}

// Fonction de couleur textuelle pour les alertes du tableau
const getAlertColor = (alerte: string) => {
  if (alerte === 'CRITIQUE') return 'text-[#DC2626]'
  if (alerte === 'VIGILANCE') return 'text-[#F97316]'
  return 'text-[#16A34A]'
}

export default function BudgetFinancePage() {
  const { id: urlProjectId } = useParams()
  const { activeProjectId } = useUIStore()
  const resolvedProjectId = urlProjectId || activeProjectId || ''
  const navigate = useNavigate()

  const { data: summary, isLoading: isLoadingSummary } = useBudgetSummary(resolvedProjectId)
  const { data: linesData, isLoading: isLoadingLines } = useBudgetLines(resolvedProjectId)

  if (!resolvedProjectId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#F5F6F8] p-6 h-full">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center max-w-md">
          <h2 className="text-xl font-bold text-[#0A1628] mb-2">Aucun projet sélectionné</h2>
          <p className="text-gray-500 mb-6">
            Veuillez sélectionner un projet depuis le menu pour afficher le budget.
          </p>
        </div>
      </div>
    )
  }

  const isLoading = isLoadingSummary || isLoadingLines

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F5F6F8] h-full">
        <Loader2 className="w-10 h-10 animate-spin text-[#2563EB]" />
      </div>
    )
  }

  // Vérification de l'Empty State
  // S'assurer que typescript est satisfait avec `as any` temporaire si `budgetStatus` n'est pas encore dans le type
  const isBudgetEmpty = (summary as any)?.budgetStatus === 'EMPTY'

  return (
    <div className="flex-1 overflow-x-hidden overflow-y-auto bg-[#F5F6F8]">
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-8 space-y-8">
        
        {/* SECTION 1 — EN-TÊTE */}
        <div className="flex flex-col text-left">
          <h1 className="text-3xl font-bold text-[#0A1628] mb-1">
            Budget & suivi financier
          </h1>
          <p className="text-[#6B7280] text-sm">
            Contrôle des budgets, engagements, décaissements, soldes et seuils d'alerte.
          </p>
        </div>

        {isBudgetEmpty ? (
          // EMPTY STATE METIER
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center text-center mt-12">
            <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mb-6">
              <Wallet size={32} />
            </div>
            <h2 className="text-2xl font-bold text-[#0A1628] mb-2">Aucun budget défini pour ce projet</h2>
            <p className="text-[#6B7280] max-w-md mb-8">
              Veuillez créer des lignes budgétaires pour visualiser la consommation et les indicateurs financiers de votre projet.
            </p>
            <button 
              onClick={() => alert("Fonction de création de budget à venir")} 
              className="flex items-center gap-2 bg-[#2563EB] hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold transition-colors shadow-sm"
            >
              <PlusCircle size={20} />
              Créer un budget
            </button>
          </div>
        ) : (
          // INTERFACE ACTIVE
          <>
            {/* SECTION 2 — KPI FINANCIERS */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col justify-center">
                <span className="text-[#6B7280] text-sm font-medium mb-1">Initial</span>
                <span className="text-2xl font-bold text-[#2563EB]">{fmt(summary?.budget_total || 0)}</span>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col justify-center">
                <span className="text-[#6B7280] text-sm font-medium mb-1">Engagé</span>
                <span className="text-2xl font-bold text-[#F97316]">{fmt(summary?.montant_engage || 0)}</span>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col justify-center">
                <span className="text-[#6B7280] text-sm font-medium mb-1">Décaissé</span>
                <span className="text-2xl font-bold text-[#16A34A]">{fmt(summary?.montant_decaisse || 0)}</span>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col justify-center">
                <span className="text-[#6B7280] text-sm font-medium mb-1">Disponible</span>
                <span className="text-2xl font-bold text-[#16A34A]">{fmt(summary?.solde_disponible || 0)}</span>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col justify-center">
                <span className="text-[#6B7280] text-sm font-medium mb-1">Taux conso.</span>
                <span className="text-2xl font-bold text-[#F97316]">{summary?.taux_consommation_pct || 0}%</span>
              </div>
            </div>

            {/* SECTION 3 — DEUX CARTES CÔTE À CÔTE */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              
              {/* CARTE A : Consommation par rubrique */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
                <h2 className="text-lg font-bold text-[#0A1628] mb-6">
                  Consommation par rubrique
                </h2>
                <div className="space-y-6 flex-1">
                  {summary?.consommation_par_rubrique?.map((item, idx) => {
                    const progress = item.taux_consommation_pct > 100 ? 100 : item.taux_consommation_pct
                    return (
                      <div key={idx}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-semibold text-[#0A1628]">{item.rubrique}</span>
                          <span className="text-sm font-bold text-[#0A1628]">{item.taux_consommation_pct}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-3">
                          <div 
                            className={`h-full rounded-full ${getProgressColor(item.taux_consommation_pct)}`} 
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* CARTE B : Détail financier */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
                <h2 className="text-lg font-bold text-[#0A1628] mb-6">
                  Détail financier
                </h2>
                
                <div className="overflow-y-auto max-h-[350px] border border-gray-100 rounded-xl relative">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-[#0A1628] text-white">
                        <th className="px-4 py-3 text-sm font-bold w-1/3">Rubrique</th>
                        <th className="px-4 py-3 text-sm font-bold">Budget</th>
                        <th className="px-4 py-3 text-sm font-bold">Engagé</th>
                        <th className="px-4 py-3 text-sm font-bold">Alerte</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {linesData?.data?.map((ligne, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4 text-sm font-medium text-[#0A1628]">
                            {ligne.rubrique || 'Non définie'}
                          </td>
                          <td className="px-4 py-4 text-sm font-mono text-[#6B7280]">
                            {fmt(ligne.cout_total)}
                          </td>
                          <td className="px-4 py-4 text-sm font-mono text-[#6B7280]">
                            {fmt(ligne.montant_engage)}
                          </td>
                          <td className={`px-4 py-4 text-sm font-bold ${getAlertColor(ligne.niveau_alerte)}`}>
                            {ligne.niveau_alerte === 'CRITIQUE' ? 'Critique' : ligne.niveau_alerte === 'VIGILANCE' ? 'Vigilance' : 'OK'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="text-[#6B7280] text-xs italic mt-4">
                  Règle : alerte orange &gt; 80%, rouge &gt; 90% ou dépassement du budget.
                </p>
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  )
}
