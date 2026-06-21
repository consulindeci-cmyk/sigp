import React from 'react'
import { useParams } from 'react-router-dom'
import { useRisks } from '@/hooks/useRisks'
import { Loader2 } from 'lucide-react'

// Données démo utilisées si l'API est vide
const DUMMY_RISQUES = [
  { id: '1', categorie: 'Fiduciaire', description: 'Corruption', probabilite: 1, impact: 3, criticite: 3, plan_mitigation: 'Audits annuels', responsable: 'Financier' },
  { id: '2', categorie: 'Opérationnel', description: 'Retard chantiers', probabilite: 3, impact: 2, criticite: 6, plan_mitigation: 'Suivi hebdo', responsable: 'Chef projet' },
  { id: '3', categorie: 'Climatique', description: 'Sécheresse', probabilite: 2, impact: 3, criticite: 6, plan_mitigation: 'Plan urgence', responsable: 'Coordination' }
]

// Matrice demandée : PxI
const MATRIX = [
  [{ v: 1, c: '#16A34A' }, { v: 2, c: '#16A34A' }, { v: 3, c: '#F97316' }],
  [{ v: 2, c: '#16A34A' }, { v: 4, c: '#F97316' }, { v: 6, c: '#DC2626' }],
  [{ v: 3, c: '#F97316' }, { v: 6, c: '#DC2626' }, { v: 9, c: '#DC2626' }]
]

export default function RisksPage() {
  const { id: projectId = '' } = useParams()
  const { data: risksData, isLoading } = useRisks(projectId)

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#F5F6F8]">
        <Loader2 className="w-10 h-10 animate-spin text-[#2563EB]" />
      </div>
    )
  }

  // Utilisation des données de l'API si disponibles, sinon Fallback démo
  const rawRisques = risksData?.data ?? []
  
  const displayData = rawRisques.length > 0 
    ? rawRisques.map((r: any) => ({
        id: r.id,
        categorie: r.categorie.charAt(0) + r.categorie.slice(1).toLowerCase(),
        description: r.description,
        probabilite: r.probabilite,
        impact: r.impact,
        criticite: r.criticite || (r.probabilite * r.impact),
        plan_mitigation: r.plan_mitigation || '—',
        responsable: r.responsable || '—'
      }))
    : DUMMY_RISQUES

  return (
    <div className="flex flex-col min-h-full bg-[#F5F6F8] p-6 lg:p-8">
      
      {/* 1. En-tête de page */}
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-[#0A1628] leading-tight">
          Matrice des risques
        </h1>
        <p className="text-[#6B7280] mt-1.5 text-sm font-medium">
          Identifier, noter, prioriser et suivre les risques fiduciaires, opérationnels et stratégiques.
        </p>
      </div>

      {/* 2. Deux cartes côte à côte */}
      <div className="grid grid-cols-1 xl:grid-cols-[auto_1fr] gap-6 mb-6">
        
        {/* Carte a) Matrice PxI */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col items-center self-start">
          <h3 className="w-full text-lg font-bold text-[#0A1628] mb-8 text-left">
            Carte criticité : Probabilité × Impact
          </h3>
          
          <div className="flex items-center gap-4">
            {/* Label vertical gauche */}
            <div 
              className="text-sm font-bold text-gray-500 tracking-widest rotate-180" 
              style={{ writingMode: 'vertical-rl' }}
            >
              Probabilité ↑
            </div>
            
            {/* Grille */}
            <div className="flex flex-col gap-3">
              {MATRIX.map((row, i) => (
                <div key={i} className="flex gap-3">
                  {row.map((cell, j) => (
                    <div 
                      key={j} 
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-sm transition-transform hover:scale-105"
                      style={{ backgroundColor: cell.c }}
                    >
                      {cell.v}
                    </div>
                  ))}
                </div>
              ))}
              
              {/* Label bas */}
              <div className="text-sm font-bold text-gray-500 text-center tracking-widest mt-2">
                Impact →
              </div>
            </div>
          </div>
        </div>

        {/* Carte b) Tableau */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full min-h-[400px]">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left whitespace-nowrap min-w-[800px]">
              <thead className="bg-[#0A1628] text-white">
                <tr>
                  <th className="px-6 py-4 font-bold tracking-wide">Catégorie</th>
                  <th className="px-6 py-4 font-bold tracking-wide w-1/3">Risque</th>
                  <th className="px-6 py-4 font-bold tracking-wide text-center">P</th>
                  <th className="px-6 py-4 font-bold tracking-wide text-center">I</th>
                  <th className="px-6 py-4 font-bold tracking-wide text-center">Criticité</th>
                  <th className="px-6 py-4 font-bold tracking-wide">Atténuation</th>
                  <th className="px-6 py-4 font-bold tracking-wide">Responsable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayData.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-600 font-medium">{row.categorie}</td>
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-normal leading-relaxed">{row.description}</td>
                    <td className="px-6 py-4 text-center font-bold text-gray-600">{row.probabilite}</td>
                    <td className="px-6 py-4 text-center font-bold text-gray-600">{row.impact}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-bold text-lg text-[#0A1628]">{row.criticite}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 whitespace-normal leading-relaxed">{row.plan_mitigation}</td>
                    <td className="px-6 py-4 text-gray-600">{row.responsable}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 3. Encart d'alerte */}
      <div className="bg-[#FFF7ED] border border-orange-200 rounded-2xl p-6 flex items-start gap-4">
        <div>
          <h4 className="text-[#F97316] font-bold text-lg mb-1">Alerte automatique</h4>
          <p className="text-orange-900/70 text-sm font-medium">
            Si criticité ≥ 6 : notification au chef de projet et demande de plan d'action.
          </p>
        </div>
      </div>

    </div>
  )
}
