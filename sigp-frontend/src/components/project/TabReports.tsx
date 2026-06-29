import { Clock, Plus, DollarSign, Calendar, ShoppingBag, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/forms/Button'

const REPORT_CARDS = [
  {
    icon: DollarSign,
    iconVariant: 'primary',
    title: 'Rapports Financiers',
    desc: 'Exécution budgétaire, décaissements, contributions bailleurs',
  },
  {
    icon: Calendar,
    iconVariant: 'success',
    title: 'Rapports PTBA',
    desc: 'Avancement du plan de travail annuel par composante',
  },
  {
    icon: ShoppingBag,
    iconVariant: 'primary',
    title: 'Rapports de Passation des Marchés',
    desc: 'Statut des contrats, respect des délais',
  },
  {
    icon: BarChart3,
    iconVariant: 'warning',
    title: 'Rapports M&E',
    desc: 'Suivi du cadre logique, mise à jour des indicateurs',
  },
] as const

const iconVariantMap: Record<string, string> = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
}

export default function TabReports() {
  return (
    <div className="flex flex-col gap-4 bg-background">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
        <div>
          <h1 className="text-base font-bold text-foreground">Centre de Rapports</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Générez et planifiez les rapports du projet</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Clock className="h-3.5 w-3.5" />} className="h-8 text-xs">
            Rapports Planifiés
          </Button>
          <Button variant="default" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} className="h-8 text-xs">
            Générer un Rapport
          </Button>
        </div>
      </div>

      {/* ── GRILLE DE RAPPORTS ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {REPORT_CARDS.map(card => {
          const Icon = card.icon
          return (
            <button
              key={card.title}
              className="bg-card border border-border rounded-lg p-5 flex items-start gap-4 text-left hover:border-primary/40 hover:bg-muted/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={card.title}
            >
              <div className={`p-2.5 rounded-lg shrink-0 ${iconVariantMap[card.iconVariant]}`}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-foreground">{card.title}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{card.desc}</p>
              </div>
            </button>
          )
        })}
      </div>

    </div>
  )
}
