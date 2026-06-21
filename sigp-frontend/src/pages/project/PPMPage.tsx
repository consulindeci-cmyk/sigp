import React from 'react'
import { useParams } from 'react-router-dom'
import { FileText, Send, ClipboardCheck, PenTool, Briefcase, Loader2 } from 'lucide-react'
import { usePPM } from '@/hooks/usePPM'
import { useProject } from '@/hooks/useProjects'
import { formatCurrency } from '@/lib/utils'

const STEPS = [
  { label: 'Préparation', color: '#2563EB', icon: FileText },
  { label: 'Publication', color: '#F97316', icon: Send },
  { label: 'Évaluation', color: '#0F766E', icon: ClipboardCheck },
  { label: 'Signature', color: '#16A34A', icon: PenTool },
  { label: 'Exécution', color: '#0A1628', icon: Briefcase },
]

const DUMMY_MARCHES = [
  { id: '1', description: 'Construction 50 forages', type: 'Travaux', methode: 'AOI', revue: 'A priori', datePrevue: '15/01/2026', dateSignature: '30/03/2026', montant: 400000, statut: 'Signé' },
  { id: '2', description: 'Audit financier', type: 'Consultant', methode: 'SFQC', revue: 'A posteriori', datePrevue: '01/09/2026', dateSignature: '15/11/2026', montant: 30000, statut: 'Prévu' },
  { id: '3', description: 'Équipements solaires', type: 'Fournitures', methode: 'AON', revue: 'A priori', datePrevue: '10/05/2026', dateSignature: '—', montant: 250000, statut: 'En cours' },
]

function getStatutColor(statut: string) {
  const s = statut.toLowerCase()
  if (s.includes('signé')) return 'text-indigo-600 bg-indigo-50'
  if (s.includes('prévu') || s.includes('planifie')) return 'text-blue-600 bg-blue-50'
  if (s.includes('en cours')) return 'text-amber-600 bg-amber-50'
  if (s.includes('annule') || s.includes('resilie')) return 'text-red-600 bg-red-50'
  return 'text-gray-600 bg-gray-100'
}

export default function PPMPage() {
  const { id: projectId = '' } = useParams()
  const { data: project } = useProject(projectId)
  const { data: ppmData, isLoading } = usePPM(projectId)

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#F5F6F8]">
        <Loader2 className="w-10 h-10 animate-spin text-[#2563EB]" />
      </div>
    )
  }

  // Utilisation des données de l'API si disponibles, sinon Fallback démo
  const rawMarches = ppmData?.data ?? []
  
  const displayData = rawMarches.length > 0 
    ? rawMarches.map((m: any) => ({
        id: m.id,
        description: m.description_marche,
        type: m.type_marche,
        methode: m.methode,
        revue: 'A priori', // Par défaut car non présent dans l'API actuelle
        datePrevue: m.date_prevue ? new Date(m.date_prevue).toLocaleDateString('fr-FR') : '—',
        dateSignature: '—',
        montant: Number(m.montant_estime) || 0,
        statut: m.statut === 'PLANIFIE' ? 'Prévu' : m.statut === 'EN_COURS' ? 'En cours' : m.statut === 'SIGNE' ? 'Signé' : m.statut
      }))
    : DUMMY_MARCHES

  return (
    <div className="flex flex-col min-h-full bg-[#F5F6F8] p-6 lg:p-8">
      
      {/* 1. En-tête de page */}
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-[#0A1628] leading-tight">
          Passation des marchés
        </h1>
        <p className="text-[#6B7280] mt-1.5 text-sm font-medium">
          Suivi du PPM : méthode, revue, dates prévues, signatures, montants et statuts.
        </p>
      </div>

      {/* 2. Tableau */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-[#0A1628] text-white">
              <tr>
                <th className="px-6 py-4 font-bold tracking-wide">Marché</th>
                <th className="px-6 py-4 font-bold tracking-wide">Type</th>
                <th className="px-6 py-4 font-bold tracking-wide">Méthode</th>
                <th className="px-6 py-4 font-bold tracking-wide">Revue</th>
                <th className="px-6 py-4 font-bold tracking-wide">Date prévue</th>
                <th className="px-6 py-4 font-bold tracking-wide">Signature</th>
                <th className="px-6 py-4 font-bold tracking-wide text-right">Montant</th>
                <th className="px-6 py-4 font-bold tracking-wide">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayData.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                  <td className="px-6 py-4 font-medium text-gray-900">{row.description}</td>
                  <td className="px-6 py-4 text-gray-600">{row.type}</td>
                  <td className="px-6 py-4 font-semibold text-gray-700">{row.methode}</td>
                  <td className="px-6 py-4 text-gray-600">{row.revue}</td>
                  <td className="px-6 py-4 text-gray-600">{row.datePrevue}</td>
                  <td className="px-6 py-4 text-gray-600">{row.dateSignature}</td>
                  <td className="px-6 py-4 font-mono font-medium text-gray-900 text-right">
                    {formatCurrency(row.montant, project?.devise ?? 'XOF').replace('FCFA', '').trim()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStatutColor(row.statut)}`}>
                      {row.statut}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Carte Frise de suivi des marchés */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 lg:p-8 mt-auto">
        <h3 className="text-lg font-bold text-[#0A1628] mb-10">
          Frise de suivi des marchés
        </h3>
        
        <div className="relative flex justify-between items-start max-w-4xl mx-auto mb-10 px-4">
          {/* Ligne grise connectrice */}
          <div className="absolute top-6 left-10 right-10 h-[2px] bg-gray-200 -z-0"></div>
          
          {/* Étapes */}
          {STEPS.map((step, idx) => (
            <div key={idx} className="relative z-10 flex flex-col items-center gap-3 bg-white px-2">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm transition-transform hover:scale-105"
                style={{ backgroundColor: step.color }}
              >
                <step.icon size={22} strokeWidth={2.5} />
              </div>
              <span className="text-sm font-bold text-gray-800">
                {step.label}
              </span>
            </div>
          ))}
        </div>
        
        <p className="text-center text-[#6B7280] text-sm font-medium">
          Interaction : un clic sur un marché ouvre la fiche détaillée avec pièces justificatives, avis de non-objection et contrat.
        </p>
      </div>

    </div>
  )
}
