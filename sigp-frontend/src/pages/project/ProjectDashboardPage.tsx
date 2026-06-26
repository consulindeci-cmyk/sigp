import React from 'react'
import { useParams } from 'react-router-dom'
import { AlertTriangle, Wallet, Activity, Target, ShieldAlert, FileText, Loader2, Landmark, Coins } from 'lucide-react'
import { PageHeader } from '@/components/layout/AppShell'
import { KPICard } from '@/components/shared/KPICard'
import { StatusBadge } from '@/components/shared/Badges'

// Hooks existants (Aucun EVM)
import { useProject } from '@/hooks/useProjects'
import { useProjectSummary } from '@/hooks/useDashboard'
import { usePTBA } from '@/hooks/usePTBA'
import { useRisks } from '@/hooks/useRisks'
import { usePPM } from '@/hooks/usePPM'
import { formatCurrency, formatPercent } from '@/lib/utils'

export default function ProjectDashboardPage() {
  const { id: projectId = '' } = useParams()
  
  // 1. Récupération des données métiers réelles
  const { data: project, isLoading: projectLoading } = useProject(projectId)
  const { data: summary, isLoading: summaryLoading } = useProjectSummary(projectId)
  const currentYear = new Date().getFullYear();
  const { data: ptbaData, isLoading: ptbaLoading } = usePTBA(projectId, currentYear)
  const { data: risksData, isLoading: risksLoading } = useRisks(projectId)
  const { data: ppmData, isLoading: ppmLoading } = usePPM(projectId)

  const isLoading = projectLoading || summaryLoading || ptbaLoading || risksLoading || ppmLoading

  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#2563EB]" />
        <p className="text-gray-500 mt-4 font-medium">Chargement de la vue hélicoptère...</p>
      </div>
    )
  }

  // 2. Traitement des données pour les blocs
  
  // -- Budget
  const budgetTotal = summary?.budget_total ?? 0
  const montantEngage = summary?.montant_engage ?? 0
  const montantDecaisse = summary?.montant_decaisse ?? 0
  const solde = summary?.solde_disponible ?? 0
  const avancementGlobal = (summary as any)?.taux_avancement_global_pct ?? 0

  // -- PTBA
  const activites = ptbaData?.data?.lignes ?? []
  const activitesTotal = activites.length
  // Note: Les statuts des activités n'existent plus sur la ligne PTBA elle-même dans la nouvelle architecture. On mock à 0 pour éviter les erreurs TS.
  const activitesTerminees = 0; // activites.filter(a => a.statut === 'TERMINE').length
  const activitesRetard = 0; // activites.filter(a => a.statut === 'EN_RETARD').length

  // -- Risques
  const risques = risksData?.data ?? []
  const risquesTotal = risques.length
  // Gestion de la casse ou des termes potentiels de la BDD
  const risquesCritiques = risques.filter(r => (r.criticite as any) === 'ELEVEE' || (r.criticite as any) === 'CRITIQUE').length

  // -- Marchés
  const marches = ppmData?.data ?? []
  const marchesTotal = marches.length
  const marchesBloques = marches.filter(m => (m.statut as string) === 'BLOQUE' || (m.statut as string) === 'EN_RETARD' || m.statut === 'RESILIE').length

  // 3. Construction des Alertes Métier
  const alertes: string[] = []
  
  if (risquesCritiques > 0) {
    alertes.push(`${risquesCritiques} risque(s) critique(s) ou élevé(s) actif(s).`)
  }
  if (activitesRetard > 0) {
    alertes.push(`${activitesRetard} activité(s) du PTBA en retard.`)
  }
  if (marchesBloques > 0) {
    alertes.push(`${marchesBloques} marché(s) en retard ou bloqué(s).`)
  }
  if (solde < 0) {
    alertes.push(`Alerte financière : Le solde disponible est négatif (${formatCurrency(solde, project?.devise)}).`)
  }

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <PageHeader
        title={`Dashboard — ${project?.nom_projet ?? 'Vue globale'}`}
        subtitle={`${project?.code_projet} · ${project?.bailleur_principal}`}
        actions={
          project && <StatusBadge statut={project.statut} />
        }
      />

      <div className="flex-1 overflow-x-auto overflow-y-auto w-full p-4 md:p-6 space-y-6">
        
        {/* Section Alertes Opérationnelles */}
        {alertes.length > 0 && (
          <div className="bg-white border-l-4 border-red-500 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="text-red-500 w-6 h-6" />
              <h3 className="text-lg font-bold text-[#0A1628]">Alertes Projet</h3>
            </div>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              {alertes.map((alerte, idx) => (
                <li key={idx} className="font-medium text-red-600">{alerte}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Section 1 : Budget & Finances (Macro) */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-6 border-b pb-4">
            <Wallet className="w-5 h-5 text-[#2563EB]" />
            <h3 className="text-lg font-bold text-[#0A1628]">Situation Financière Globale</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              label="Budget Alloué"
              value={formatCurrency(budgetTotal, project?.devise)}
              icon={Landmark}
              color="blue"
            />
            <KPICard
              label="Montant Engagé"
              value={formatCurrency(montantEngage, project?.devise)}
              icon={Activity}
              color="yellow"
            />
            <KPICard
              label="Montant Décaissé"
              value={formatCurrency(montantDecaisse, project?.devise)}
              icon={Coins}
              color="green"
            />
            <KPICard
              label="Solde Disponible"
              value={formatCurrency(solde, project?.devise)}
              icon={Wallet}
              color={solde >= 0 ? "green" : "red"}
            />
          </div>
        </div>

        {/* Section 2 : Avancement & PTBA */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-6 border-b pb-4">
              <Target className="w-5 h-5 text-[#2563EB]" />
              <h3 className="text-lg font-bold text-[#0A1628]">Avancement & PTBA</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col justify-center items-center text-center">
                <p className="text-sm font-semibold text-gray-500 mb-2">Avancement Global</p>
                <p className="text-3xl font-bold text-[#2563EB]">{formatPercent(avancementGlobal)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col justify-center items-center text-center">
                <p className="text-sm font-semibold text-gray-500 mb-2">Activités Planifiées</p>
                <p className="text-3xl font-bold text-[#0F766E]">{activitesTotal}</p>
                <p className="text-xs text-gray-400 mt-1">{activitesTerminees} terminée(s)</p>
              </div>
            </div>
          </div>

          {/* Section 3 : Risques & Marchés */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-6 border-b pb-4">
              <ShieldAlert className="w-5 h-5 text-[#2563EB]" />
              <h3 className="text-lg font-bold text-[#0A1628]">Contrôle & Exécution</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col justify-center items-center text-center">
                <p className="text-sm font-semibold text-gray-500 mb-2">Registre des Risques</p>
                <p className="text-3xl font-bold text-orange-600">{risquesTotal}</p>
                <p className="text-xs text-red-500 mt-1 font-medium">{risquesCritiques} critique(s)</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col justify-center items-center text-center">
                <p className="text-sm font-semibold text-gray-500 mb-2">Passation de Marchés</p>
                <p className="text-3xl font-bold text-[#4B5563]">{marchesTotal}</p>
                <p className="text-xs text-red-500 mt-1 font-medium">{marchesBloques} bloqué(s)/en retard</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
