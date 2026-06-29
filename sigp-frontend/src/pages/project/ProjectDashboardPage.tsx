import { PageHeader } from '@/components/layout/PageHeader';
import { useParams, Link } from 'react-router-dom'
import { AlertTriangle, Wallet, Activity, Target, ShieldAlert, Loader2, Landmark, Coins } from 'lucide-react'
import { StatCard } from '@/components/ui/data-display/StatCard'
import { StatusBadge } from '@/components/shared/Badges'

import { useProject } from '@/hooks/useProjects'
import { useProjectSummary } from '@/hooks/useDashboard'
import { usePTBA } from '@/hooks/usePTBA'
import { useRisks } from '@/hooks/useRisks'
import { usePPM } from '@/hooks/usePPM'
import { formatCurrency, formatPercent } from '@/lib/utils'

export default function ProjectDashboardPage() {
  const { id: projectId = '' } = useParams()

  const { data: project, isLoading: projectLoading } = useProject(projectId)
  const { data: summary, isLoading: summaryLoading } = useProjectSummary(projectId)
  const currentYear = new Date().getFullYear();
  const { data: ptbaData, isLoading: ptbaLoading } = usePTBA(projectId, currentYear)
  const { data: risksData, isLoading: risksLoading } = useRisks(projectId)
  const { lignes: ppmData, isLoading: ppmLoading } = usePPM(projectId)

  const isLoading = projectLoading || summaryLoading || ptbaLoading || risksLoading || ppmLoading

  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground mt-4 font-medium">Chargement de la vue hélicoptère...</p>
      </div>
    )
  }

  const budgetTotal = summary?.budget_total ?? 0
  const montantEngage = summary?.montant_engage ?? 0
  const montantDecaisse = summary?.montant_decaisse ?? 0
  const solde = summary?.solde_disponible ?? 0
  const avancementGlobal = (summary as any)?.taux_avancement_global_pct ?? 0

  const activites = ptbaData?.data?.lignes ?? []
  const activitesTotal = activites.length
  const activitesTerminees = 0;
  const activitesRetard = 0;

  const risques = risksData?.data ?? []
  const risquesCritiques = risques.filter(r => (r.criticite as any) === 'ELEVEE' || (r.criticite as any) === 'CRITIQUE').length

  const marches = ppmData ?? []
  const marchesBloques = marches.filter((m: any) => m.statut === 'BLOQUE' || m.statut === 'EN_RETARD' || m.statut === 'ANNULE').length

  const alertes: string[] = []
  if (risquesCritiques > 0) alertes.push(`${risquesCritiques} risque(s) critique(s) ou élevé(s) actif(s).`)
  if (activitesRetard > 0) alertes.push(`${activitesRetard} activité(s) du PTBA en retard.`)
  if (marchesBloques > 0) alertes.push(`${marchesBloques} marché(s) en retard ou bloqué(s).`)
  if (solde < 0) alertes.push(`Alerte financière : Le solde disponible est négatif (${formatCurrency(solde, project?.devise)}).`)

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border bg-card">
        <div>
          <PageHeader title={`
            {project?.nom_projet ?? 'Vue globale'}
          `} description={`
            {project?.code_projet} · {project?.bailleur_principal}
          `} />
        </div>
        {project && <StatusBadge statut={project.statut} />}
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-auto w-full p-4 md:p-6 space-y-6">

        {/* Alertes Opérationnelles */}
        {alertes.length > 0 && (
          <div className="bg-card border-l-4 border-destructive rounded-lg p-4 border border-border">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="text-destructive h-4 w-4" />
              <h3 className="text-sm font-semibold text-foreground">Alertes Projet</h3>
            </div>
            <ul className="list-disc list-inside space-y-1 text-foreground">
              {alertes.map((alerte, idx) => (
                <li key={idx} className="font-medium text-destructive">{alerte}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Section Budget & Finances */}
        <div className="bg-card rounded-lg p-5 border border-border">
          <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
            <Wallet className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Situation Financière Globale</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Budget Alloué"
              value={formatCurrency(budgetTotal, project?.devise)}
              icon={<Landmark className="h-4 w-4" />}
              iconVariant="primary"
            />
            <StatCard
              title="Montant Engagé"
              value={formatCurrency(montantEngage, project?.devise)}
              icon={<Activity className="h-4 w-4" />}
              iconVariant="warning"
            />
            <StatCard
              title="Montant Décaissé"
              value={formatCurrency(montantDecaisse, project?.devise)}
              icon={<Coins className="h-4 w-4" />}
              iconVariant="success"
            />
            <StatCard
              title="Solde Disponible"
              value={formatCurrency(solde, project?.devise)}
              icon={<Wallet className="h-4 w-4" />}
              iconVariant={solde >= 0 ? 'success' : 'destructive'}
            />
          </div>
        </div>

        {/* Section Avancement & Contrôle */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-lg p-5 border border-border">
            <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
              <Target className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Avancement &amp; PTBA</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                title="Avancement Global"
                value={formatPercent(avancementGlobal)}
                icon={<Target className="h-4 w-4" />}
                iconVariant="primary"
                description="Taux d'avancement physique"
              />
              <StatCard
                title="Activités Planifiées"
                value={activitesTotal}
                icon={<Activity className="h-4 w-4" />}
                iconVariant="success"
                description={`${activitesTerminees} terminée(s)`}
              />
            </div>
          </div>

          <div className="bg-card rounded-lg p-5 border border-border">
            <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
              <ShieldAlert className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Contrôle &amp; Exécution</h3>
            </div>
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex justify-between items-center">
                <h3 className="text-sm font-semibold text-foreground">Passation des marchés</h3>
                <Link to={`/projects/${projectId}/ppm`} className="text-sm font-medium text-primary hover:text-primary/80">Voir tout</Link>
              </div>
              <div className="divide-y divide-border">
                {marches.slice(0, 3).map((m: any) => (
                  <div key={m.id} className="p-4 hover:bg-muted/5 flex justify-between items-center transition-colors">
                    <div>
                      <p className="font-semibold text-foreground">{m.description || m.reference_marche}</p>
                      <p className="text-sm text-muted-foreground mt-1">{m.methode} • {m.statut}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">{formatCurrency(m.montant_estime_base || 0, 'XOF')}</p>
                      <p className="text-xs text-muted-foreground">{m.dates_cles?.attribution_prevue || 'À définir'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
