import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/forms/Button';
import { StatCard } from '@/components/ui/data-display/StatCard';
import { ProgressBar } from '@/components/ui/data-display/ProgressBar';
import { ChartPlaceholder } from '@/components/ui/charts/ChartPlaceholder';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/Card';
import { 
  Download, 
  Plus, 
  LayoutGrid, 
  Activity, 
  CheckCircle2, 
  AlertTriangle,
  Banknote,
  Wallet,
  FileSignature,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();

  const headerActions = (
    <>
      <Button variant="outline" leftIcon={<Download className="h-4 w-4" />}>
        Exporter
      </Button>
      <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate('/projects/new')}>
        Nouveau Projet
      </Button>
    </>
  );

  return (
    <DashboardLayout
      header={
        <PageHeader 
          title="Tableau de bord du portefeuille" 
          subtitle="Vue d'ensemble multi-projets — 24 juin 2026" 
          actions={headerActions}
          className="bg-background border-b border-border px-6 py-6 sm:px-8 m-0"
        />
      }
    >
      {/* KPI Row 1 - Projets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total des Projets"
          value="42"
          icon={<LayoutGrid className="h-5 w-5 text-primary" />}
          iconVariant="primary"
          trend={{ value: 3, label: "vs trimestre précédent", isPositive: true }}
        />
        <StatCard 
          title="Projets Actifs"
          value="31"
          icon={<Activity className="h-5 w-5 text-success" />}
          iconVariant="success"
          description="73.8% du portefeuille"
        />
        <StatCard 
          title="Projets Terminés"
          value="7"
          icon={<CheckCircle2 className="h-5 w-5 text-muted-foreground" />}
          iconVariant="default"
          description="16.7% du portefeuille"
        />
        <StatCard 
          title="Projets en Retard"
          value="4"
          icon={<AlertTriangle className="h-5 w-5 text-destructive" />}
          iconVariant="destructive"
          trend={{ value: 1, label: "nécessite une attention", isPositive: false }}
        />
      </div>

      {/* KPI Row 2 - Finances & Risques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Budget Global"
          value="$284.6M"
          icon={<Banknote className="h-5 w-5 text-primary" />}
          iconVariant="primary"
          description="réparti sur 9 bailleurs"
        />
        <StatCard 
          title="Budget Décaissé"
          value="$176.2M"
          icon={<Wallet className="h-5 w-5 text-success" />}
          iconVariant="success"
          description="61.9% taux de décaissement"
        />
        <StatCard 
          title="Contrats de Marchés"
          value="118"
          icon={<FileSignature className="h-5 w-5 text-primary" />}
          iconVariant="primary"
          description="23 en circuit d'approbation"
        />
        <StatCard 
          title="Risques Critiques"
          value="9"
          icon={<ShieldAlert className="h-5 w-5 text-destructive" />}
          iconVariant="destructive"
          description="sur 6 projets"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              Tendances de Décaissement
              <span className="block text-xs font-normal text-muted-foreground mt-1">Cumul, 12 derniers mois</span>
            </CardTitle>
            <Button variant="ghost" size="sm" className="h-8">Voir le rapport</Button>
          </CardHeader>
          <CardContent>
            <ChartPlaceholder type="line" title="Évolution des décaissements" description="Données financières en attente" heightClass="h-64" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Aperçu du Statut des Projets</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartPlaceholder type="donut" title="Statuts globaux" description="Connexion au portefeuille requise" heightClass="h-64" />
          </CardContent>
        </Card>
      </div>

      {/* Breakdowns Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>
              Répartition du Budget
              <span className="block text-xs font-normal text-muted-foreground mt-1">Par bailleur</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Banque Mondiale", value: "$96.4M", percent: 80, color: "primary" },
              { label: "Union Européenne", value: "$71.2M", percent: 60, color: "primary" },
              { label: "USAID", value: "$48.9M", percent: 40, color: "primary" },
              { label: "AFD", value: "$33.6M", percent: 30, color: "primary" },
              { label: "PNUD", value: "$21.1M", percent: 20, color: "primary" },
              { label: "Autres bailleurs", value: "$13.4M", percent: 15, color: "default" },
            ].map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm font-medium mb-1.5">
                  <span className="text-foreground">{item.label}</span>
                  <span className="text-foreground">{item.value}</span>
                </div>
                <ProgressBar value={item.percent} color={item.color as any} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Risks Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>
              Répartition des Risques
              <span className="block text-xs font-normal text-muted-foreground mt-1">Par catégorie</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Financiers", value: 14, percent: 70, color: "destructive" },
              { label: "Opérationnels", value: 11, percent: 55, color: "warning" },
              { label: "Passation des marchés", value: 9, percent: 45, color: "primary" },
              { label: "Environnementaux & Sociaux", value: 6, percent: 30, color: "success" },
              { label: "Politiques / Gouvernance", value: 5, percent: 25, color: "default" },
            ].map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm font-medium mb-1.5">
                  <span className="text-foreground">{item.label}</span>
                  <span className="text-foreground">{item.value}</span>
                </div>
                <ProgressBar value={item.percent} color={item.color as any} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Lists Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Activités Récentes</CardTitle>
            <Button variant="link" size="sm" className="h-8 pr-0">Voir tout <ArrowRight className="ml-1 h-3 w-3" /></Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {[
                { title: "PTBA T2 2026 validé", meta: "PROJ-014 - Électrification Rurale Phase II", time: "Il y a 2h", color: "bg-success" },
                { title: "Contrat signé — Travaux publics lot 3", meta: "PROJ-009 - Approvisionnement en Eau Urbaine", time: "Il y a 5h", color: "bg-primary" },
                { title: "Révision budgétaire soumise au bailleur", meta: "PROJ-021 - Renforcement des Systèmes de Santé", time: "Il y a 1j", color: "bg-warning" },
                { title: "Nouveau risque enregistré : exposition aux devises", meta: "PROJ-014 - Électrification Rurale Phase II", time: "Il y a 1j", color: "bg-primary" },
                { title: "Rapport trimestriel bailleur exporté (PDF)", meta: "PROJ-003 - Chaînes de Valeur Agricoles", time: "Il y a 2j", color: "bg-success" },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors">
                  <div className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${item.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.meta}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{item.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Échéances à Venir</CardTitle>
            <Button variant="link" size="sm" className="h-8 pr-0">Calendrier <ArrowRight className="ml-1 h-3 w-3" /></Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {[
                { title: "Ouverture des offres — Mini-réseaux solaires lot 1", meta: "PROJ-014", time: "Demain", color: "bg-destructive" },
                { title: "Rapport financier T2 dû à la délégation UE", meta: "PROJ-021", time: "Dans 3 jours", color: "bg-warning" },
                { title: "Début de la mission de revue à mi-parcours", meta: "PROJ-009", time: "Dans 6 jours", color: "bg-primary" },
                { title: "Audit annuel — Début des travaux sur le terrain", meta: "PROJ-003", time: "Dans 11 jours", color: "bg-muted-foreground" },
                { title: "Atelier de préparation PTBA 2027", meta: "Tout le portefeuille", time: "Dans 18 jours", color: "bg-muted-foreground" },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors">
                  <div className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${item.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.meta}</p>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">{item.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      <Card className="border-destructive/20 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alertes
            <span className="text-xs font-normal text-destructive/80 ml-2">Nécessitant une action</span>
          </CardTitle>
          <Button variant="ghost" size="sm" className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10">Voir tout</Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-destructive/10">
            {[
              { 
                title: "IPC sous le seuil (0.84) — Approvisionnement en Eau Urbaine", 
                meta: "Dépassement des coûts en hausse sur 3 mois consécutifs",
                type: "critical" 
              },
              { 
                title: "IPD sous le seuil (0.79) — Électrification Rurale Phase II", 
                meta: "Retard de calendrier sur les activités du chemin critique",
                type: "critical" 
              },
              { 
                title: "3 contrats de passation en attente d'approbation > 14 jours", 
                meta: "Goulot d'étranglement dans le flux d'approbation — Examen du Responsable Financier nécessaire",
                type: "warning" 
              },
              { 
                title: "Taux de décaissement sous la cible annuelle", 
                meta: "Renforcement des Systèmes de Santé — 41% décaissé à la mi-année",
                type: "warning" 
              },
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors">
                <div className={`p-2 rounded-md shrink-0 ${item.type === 'critical' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}`}>
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.meta}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

    </DashboardLayout>
  );
}
