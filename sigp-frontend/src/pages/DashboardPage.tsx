import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart, Area,
  LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/forms/Button';
import { StatCard } from '@/components/ui/data-display/StatCard';
import { ProgressBar } from '@/components/ui/data-display/ProgressBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/Card';
import {
  Download, Plus, LayoutGrid, Activity, CheckCircle2, AlertTriangle,
  Banknote, Wallet, FileSignature, ShieldAlert, ArrowRight,
  Flag, Clock, Calendar, TrendingUp,
} from 'lucide-react';
import {
  mockPortfolioKPIs,
  mockEvmData,
  mockDisbursements12Months,
  mockBudgetDistribution,
  mockFundingDistribution,
  mockBudgetByBailleur,
  mockRisksByCategory,
  mockProjectStatusDistribution,
  mockBudgetConsumption,
  mockCriticalActivities,
  mockMainRisks,
  mockMilestones,
  mockEvents,
  mockRecentActivities,
  mockUpcomingDeadlines,
  mockAlerts,
  mockTimelineItems,
} from '@/mocks/dashboardMocks';

// ── Shared tooltip style (Design System tokens) ─────────────────────────────
const tooltipStyle: React.CSSProperties = {
  borderRadius: '8px',
  border: '1px solid var(--border)',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  fontSize: '12px',
  background: 'var(--card)',
  color: 'var(--foreground)',
};

// ── Pie chart color palettes ─────────────────────────────────────────────────
const STATUS_COLORS = [
  'var(--success, #22c55e)',
  'var(--muted-foreground, #94a3b8)',
  'var(--destructive, #ef4444)',
];
const BUDGET_DIST_COLORS = [
  'var(--primary, #2563eb)',
  'var(--success, #22c55e)',
  'var(--warning, #f59e0b)',
];
const FUNDING_COLORS = [
  'var(--navy-700, #1e3a5f)',
  'var(--slate, #64748b)',
];

// ── Tiny reusable section header helper ─────────────────────────────────────
function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div>
        <CardTitle>{title}</CardTitle>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate();

  // ── Derived KPIs (computed, never hardcoded) ─────────────────────────────
  const pctActifs = Math.round(
    (mockPortfolioKPIs.projetsActifs / mockPortfolioKPIs.totalProjets) * 100,
  );
  const pctTermines = Math.round(
    (mockPortfolioKPIs.projetsTermines / mockPortfolioKPIs.totalProjets) * 100,
  );

  const headerActions = (
    <>
      <Button
        variant="outline"
        leftIcon={<Download className="h-4 w-4" aria-hidden="true" />}
        onClick={() => navigate('/projects')}
        aria-label="Exporter le rapport du portefeuille"
      >
        Exporter
      </Button>
      <Button
        leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />}
        onClick={() => navigate('/projects/new')}
        aria-label="Créer un nouveau projet"
      >
        Nouveau Projet
      </Button>
    </>
  );

  return (
    <DashboardLayout
      header={
        <PageHeader
          title="Tableau de bord du portefeuille"
          subtitle="Vue d'ensemble multi-projets — 28 juin 2026"
          actions={headerActions}
          className="bg-background border-b border-border px-6 py-6 sm:px-8 m-0"
        />
      }
    >

      {/* ── KPI Row 1 — Projets ── */}
      <section aria-label="Indicateurs clés — projets">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            title="Total des Projets"
            value={mockPortfolioKPIs.totalProjets}
            icon={<LayoutGrid className="h-5 w-5 text-primary" aria-hidden="true" />}
            iconVariant="primary"
            trend={{ value: 3, label: 'vs trimestre précédent', isPositive: true }}
          />
          <StatCard
            title="Projets Actifs"
            value={mockPortfolioKPIs.projetsActifs}
            icon={<Activity className="h-5 w-5 text-success" aria-hidden="true" />}
            iconVariant="success"
            description={`${pctActifs}% du portefeuille`}
          />
          <StatCard
            title="Projets Terminés"
            value={mockPortfolioKPIs.projetsTermines}
            icon={<CheckCircle2 className="h-5 w-5 text-muted-foreground" aria-hidden="true" />}
            iconVariant="default"
            description={`${pctTermines}% du portefeuille`}
          />
          <StatCard
            title="Projets en Retard"
            value={mockPortfolioKPIs.projetsEnRetard}
            icon={<AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />}
            iconVariant="destructive"
            trend={{ value: 1, label: 'nécessite une attention', isPositive: false }}
          />
        </div>
      </section>

      {/* ── KPI Row 2 — Finances ── */}
      <section aria-label="Indicateurs clés — finances">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            title="Budget Global"
            value={mockPortfolioKPIs.budgetGlobal}
            icon={<Banknote className="h-5 w-5 text-primary" aria-hidden="true" />}
            iconVariant="primary"
            description={`réparti sur ${mockPortfolioKPIs.nombreBailleurs} bailleurs`}
          />
          <StatCard
            title="Budget Décaissé"
            value={mockPortfolioKPIs.budgetDecaisse}
            icon={<Wallet className="h-5 w-5 text-success" aria-hidden="true" />}
            iconVariant="success"
            description={`${mockPortfolioKPIs.tauxDecaissement} taux de décaissement`}
          />
          <StatCard
            title="Contrats de Marchés"
            value={mockPortfolioKPIs.contratsActifs}
            icon={<FileSignature className="h-5 w-5 text-primary" aria-hidden="true" />}
            iconVariant="primary"
            description={`${mockPortfolioKPIs.contratsEnApprobation} en circuit d'approbation`}
          />
          <StatCard
            title="Risques Critiques"
            value={mockPortfolioKPIs.risquesCritiques}
            icon={<ShieldAlert className="h-5 w-5 text-destructive" aria-hidden="true" />}
            iconVariant="destructive"
            description={`sur ${mockPortfolioKPIs.risquesCritiquesProgram}`}
          />
        </div>
      </section>

      {/* ── Disbursements Trend + Project Status ── */}
      <section aria-label="Graphiques principaux">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

          {/* Area chart — Décaissements 12 mois */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <SectionHeader
                title="Tendances de Décaissement"
                subtitle="Décaissements mensuels — 12 derniers mois (M$)"
                action={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 shrink-0"
                    onClick={() => navigate('/projects')}
                    aria-label="Voir le rapport complet de décaissement"
                  >
                    Voir le rapport
                  </Button>
                }
              />
            </CardHeader>
            <CardContent>
              <div
                className="h-64"
                role="img"
                aria-label="Graphique en courbe : tendances de décaissement sur 12 mois"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={mockDisbursements12Months}
                    margin={{ top: 5, right: 8, left: 0, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="disbGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary, #2563eb)" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="var(--primary, #2563eb)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => `${v}M`}
                      width={34}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v: any) => [`${v}M$`, 'Décaissé']}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      name="Décaissé (M$)"
                      stroke="var(--primary, #2563eb)"
                      strokeWidth={2}
                      fill="url(#disbGrad)"
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Donut — Statut des projets */}
          <Card>
            <CardHeader className="pb-3">
              <SectionHeader
                title="Statut des Projets"
                subtitle="Répartition du portefeuille"
              />
            </CardHeader>
            <CardContent>
              <div
                className="h-64"
                role="img"
                aria-label="Graphique en donut : répartition des projets par statut"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mockProjectStatusDistribution}
                      cx="50%"
                      cy="45%"
                      innerRadius={52}
                      outerRadius={78}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {mockProjectStatusDistribution.map((_entry, i) => (
                        <Cell key={`status-${i}`} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v: any, name: any) => [`${v} projets`, name]}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                      iconType="circle"
                      iconSize={8}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── EVM Chart + Budget Consumption ── */}
      <section aria-label="Performance EVM et consommation budgétaire">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

          {/* EVM LineChart */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <SectionHeader
                title="Performance EVM du Portefeuille"
                subtitle="PV / EV / AC cumulés — valeurs en K$"
              />
            </CardHeader>
            <CardContent>
              <div
                className="h-64"
                role="img"
                aria-label="Graphique EVM : courbes Valeur Planifiée, Valeur Acquise, Coût Réel"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={mockEvmData}
                    margin={{ top: 5, right: 8, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => `${v}K`}
                      width={38}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v: any, name: any) => [`${v}K$`, name]}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '11px' }}
                      iconType="circle"
                      iconSize={8}
                    />
                    <Line
                      type="monotone"
                      dataKey="pv"
                      name="PV — Planifié"
                      stroke="var(--muted-foreground, #94a3b8)"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="ev"
                      name="EV — Réalisé"
                      stroke="var(--success, #22c55e)"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="ac"
                      name="AC — Coût réel"
                      stroke="var(--destructive, #ef4444)"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Budget Consumption */}
          <Card>
            <CardHeader className="pb-3">
              <SectionHeader
                title="Consommation Budgétaire"
                subtitle="Engagé & Décaissé sur budget total"
              />
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Budget Total</span>
                <span className="font-bold font-mono text-foreground">
                  ${mockBudgetConsumption.total}M
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Engagé</span>
                  <span className="font-semibold font-mono text-foreground">
                    ${mockBudgetConsumption.engaged}M
                  </span>
                </div>
                <ProgressBar
                  value={mockBudgetConsumption.percentEngaged}
                  color="primary"
                  size="sm"
                  showLabel
                  aria-label={`Budget engagé : ${mockBudgetConsumption.percentEngaged}%`}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Décaissé</span>
                  <span className="font-semibold font-mono text-success">
                    ${mockBudgetConsumption.disbursed}M
                  </span>
                </div>
                <ProgressBar
                  value={mockBudgetConsumption.percentDisbursed}
                  color="success"
                  size="sm"
                  showLabel
                  aria-label={`Budget décaissé : ${mockBudgetConsumption.percentDisbursed}%`}
                />
              </div>

              <div className="pt-3 border-t border-border flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Solde disponible</span>
                <span className="font-bold font-mono text-foreground">
                  ${mockBudgetConsumption.remaining}M
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Budget Distribution + Funding Distribution ── */}
      <section aria-label="Répartition budgétaire et sources de financement">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

          {/* Budget Distribution — Donut */}
          <Card>
            <CardHeader className="pb-3">
              <SectionHeader
                title="Répartition du Budget"
                subtitle="Par composante principale"
              />
            </CardHeader>
            <CardContent>
              <div
                className="h-56"
                role="img"
                aria-label="Graphique en donut : répartition du budget par composante"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mockBudgetDistribution.map((d) => ({
                        name: d.label,
                        value: Math.round(d.value / 100000) / 10,
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={42}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {mockBudgetDistribution.map((_e, i) => (
                        <Cell key={`bd-${i}`} fill={BUDGET_DIST_COLORS[i % BUDGET_DIST_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v: any) => [`${v}M$`, '']}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '11px' }}
                      iconType="circle"
                      iconSize={8}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Funding Distribution — Donut */}
          <Card>
            <CardHeader className="pb-3">
              <SectionHeader
                title="Sources de Financement"
                subtitle="Répartition par bailleur principal"
              />
            </CardHeader>
            <CardContent>
              <div
                className="h-56"
                role="img"
                aria-label="Graphique en donut : répartition des sources de financement"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mockFundingDistribution.map((d) => ({
                        name: d.label,
                        value: Math.round(d.value / 100000) / 10,
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={42}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {mockFundingDistribution.map((_e, i) => (
                        <Cell key={`fd-${i}`} fill={FUNDING_COLORS[i % FUNDING_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v: any) => [`${v}M$`, '']}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '11px' }}
                      iconType="circle"
                      iconSize={8}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Critical Activities + Main Risks ── */}
      <section aria-label="Activités critiques et risques principaux">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

          {/* Critical Activities */}
          <Card>
            <CardHeader className="pb-3">
              <SectionHeader
                title="Activités Critiques"
                subtitle="Activités en retard ou bloquées"
                action={
                  <Button
                    variant="link"
                    size="sm"
                    className="h-8 pr-0 shrink-0"
                    onClick={() => navigate('/projects')}
                    aria-label="Voir toutes les activités critiques"
                  >
                    Voir tout <ArrowRight className="ml-1 h-3 w-3" aria-hidden="true" />
                  </Button>
                }
              />
            </CardHeader>
            <CardContent className="p-0">
              <ul role="list" className="divide-y divide-border">
                {mockCriticalActivities.map((activity) => (
                  <li
                    key={activity.id}
                    className="flex items-center justify-between gap-3 p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                          activity.status === 'blocked'
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-warning/10 text-warning'
                        }`}
                        aria-label={`Code : ${activity.code}`}
                      >
                        {activity.code}
                      </span>
                      <span className="text-sm text-foreground truncate">{activity.name}</span>
                    </div>
                    <span
                      className={`text-xs font-semibold shrink-0 ${
                        activity.status === 'blocked' ? 'text-destructive' : 'text-warning'
                      }`}
                      aria-label={`Retard : ${activity.delayDays} jours`}
                    >
                      +{activity.delayDays}j
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Main Risks */}
          <Card>
            <CardHeader className="pb-3">
              <SectionHeader
                title="Risques Principaux"
                subtitle="Classés par niveau de criticité"
                action={
                  <Button
                    variant="link"
                    size="sm"
                    className="h-8 pr-0 shrink-0"
                    onClick={() => navigate('/projects')}
                    aria-label="Voir tous les risques"
                  >
                    Voir tout <ArrowRight className="ml-1 h-3 w-3" aria-hidden="true" />
                  </Button>
                }
              />
            </CardHeader>
            <CardContent className="p-0">
              <ul role="list" className="divide-y divide-border">
                {mockMainRisks.map((risk) => (
                  <li
                    key={risk.id}
                    className="flex items-center justify-between gap-3 p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`h-2 w-2 rounded-full shrink-0 ${
                          risk.level === 'high'
                            ? 'bg-destructive'
                            : risk.level === 'medium'
                            ? 'bg-warning'
                            : 'bg-success'
                        }`}
                        aria-label={`Niveau : ${risk.level}`}
                      />
                      <span className="text-sm text-foreground truncate">{risk.description}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {risk.probability}%
                      </span>
                      <div className="w-16">
                        <ProgressBar
                          value={risk.probability}
                          color={
                            risk.level === 'high'
                              ? 'destructive'
                              : risk.level === 'medium'
                              ? 'warning'
                              : 'success'
                          }
                          size="xs"
                          aria-label={`Probabilité : ${risk.probability}%`}
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Milestones + Events ── */}
      <section aria-label="Jalons et événements">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

          {/* Milestones */}
          <Card>
            <CardHeader className="pb-3">
              <SectionHeader
                title="Jalons à Venir"
                subtitle="Prochains jalons critiques du portefeuille"
                action={
                  <Button
                    variant="link"
                    size="sm"
                    className="h-8 pr-0 shrink-0"
                    onClick={() => navigate('/projects')}
                    aria-label="Voir le calendrier des jalons"
                  >
                    Calendrier <ArrowRight className="ml-1 h-3 w-3" aria-hidden="true" />
                  </Button>
                }
              />
            </CardHeader>
            <CardContent className="p-0">
              <ul role="list" className="divide-y divide-border">
                {mockMilestones.map((milestone) => (
                  <li
                    key={milestone.id}
                    className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div
                      className={`p-2 rounded-md shrink-0 ${
                        milestone.status === 'achieved'
                          ? 'bg-success/10 text-success'
                          : milestone.status === 'delayed'
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-primary/10 text-primary'
                      }`}
                      aria-hidden="true"
                    >
                      <Flag className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {milestone.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{milestone.date}</p>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                        milestone.status === 'achieved'
                          ? 'bg-success/10 text-success'
                          : milestone.status === 'delayed'
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {milestone.status === 'achieved'
                        ? 'Atteint'
                        : milestone.status === 'delayed'
                        ? 'En retard'
                        : 'À venir'}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Events */}
          <Card>
            <CardHeader className="pb-3">
              <SectionHeader
                title="Événements Récents"
                subtitle="Derniers événements du portefeuille"
              />
            </CardHeader>
            <CardContent className="p-0">
              <ul role="list" className="divide-y divide-border">
                {mockEvents.map((event) => (
                  <li
                    key={event.id}
                    className="flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div
                      className={`p-2 rounded-md shrink-0 ${
                        event.type === 'alert'
                          ? 'bg-destructive/10 text-destructive'
                          : event.type === 'validation'
                          ? 'bg-success/10 text-success'
                          : event.type === 'payment'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}
                      aria-hidden="true"
                    >
                      {event.type === 'alert' ? (
                        <AlertTriangle className="h-4 w-4" />
                      ) : event.type === 'validation' ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : event.type === 'payment' ? (
                        <Wallet className="h-4 w-4" />
                      ) : (
                        <Flag className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground leading-snug">{event.description}</p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
                        {event.date}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Timeline ── */}
      <section aria-label="Ligne de temps du portefeuille">
        <Card>
          <CardHeader className="pb-3">
            <SectionHeader
              title="Ligne de Temps du Portefeuille"
              subtitle="Jalons et échéances — Juil. à Nov. 2026"
              action={
                <Button
                  variant="link"
                  size="sm"
                  className="h-8 pr-0 shrink-0"
                  onClick={() => navigate('/projects')}
                  aria-label="Voir le calendrier complet du portefeuille"
                >
                  Calendrier <ArrowRight className="ml-1 h-3 w-3" aria-hidden="true" />
                </Button>
              }
            />
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto" tabIndex={0} aria-label="Faites défiler pour voir la ligne de temps">
              <div className="flex gap-0 min-w-max pb-2">
                {mockTimelineItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex flex-col items-center w-40 sm:w-48 relative"
                  >
                    {/* Connector line */}
                    {idx < mockTimelineItems.length - 1 && (
                      <div
                        className="absolute top-4 left-[calc(50%+16px)] w-[calc(100%-32px)] h-px bg-border z-0"
                        aria-hidden="true"
                      />
                    )}
                    {/* Dot */}
                    <div
                      className={`relative z-10 h-8 w-8 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        item.type === 'deadline'
                          ? 'bg-warning/10 border-warning text-warning'
                          : item.type === 'milestone'
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-muted border-border text-muted-foreground'
                      }`}
                      aria-hidden="true"
                    >
                      {item.type === 'deadline' ? (
                        <Calendar className="h-3.5 w-3.5" />
                      ) : item.type === 'milestone' ? (
                        <Flag className="h-3.5 w-3.5" />
                      ) : (
                        <TrendingUp className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground mt-2 text-center">
                      {item.date}
                    </p>
                    <p className="text-[11px] font-medium text-foreground text-center px-2 mt-0.5 leading-tight">
                      {item.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70 text-center mt-0.5">
                      {item.project}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── Budget by Bailleur + Risks by Category ── */}
      <section aria-label="Répartitions détaillées">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

          {/* Budget by Bailleur */}
          <Card>
            <CardHeader className="pb-3">
              <SectionHeader
                title="Répartition par Bailleur"
                subtitle="Contribution au portefeuille global"
              />
            </CardHeader>
            <CardContent className="space-y-4">
              {mockBudgetByBailleur.map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm font-medium mb-1.5">
                    <span className="text-foreground">{item.label}</span>
                    <span className="text-foreground font-mono tabular-nums">{item.value}</span>
                  </div>
                  <ProgressBar
                    value={item.percent}
                    color={item.color}
                    aria-label={`${item.label} : ${item.percent}% du portefeuille`}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Risks by Category */}
          <Card>
            <CardHeader className="pb-3">
              <SectionHeader
                title="Répartition des Risques"
                subtitle="Par catégorie — portefeuille global"
              />
            </CardHeader>
            <CardContent className="space-y-4">
              {mockRisksByCategory.map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm font-medium mb-1.5">
                    <span className="text-foreground">{item.label}</span>
                    <span className="text-foreground tabular-nums">{item.value}</span>
                  </div>
                  <ProgressBar
                    value={item.percent}
                    color={item.color}
                    aria-label={`${item.label} : ${item.value} risques`}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Recent Activities + Upcoming Deadlines ── */}
      <section aria-label="Activités récentes et échéances">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

          {/* Recent Activities */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Activités Récentes</CardTitle>
              <Button
                variant="link"
                size="sm"
                className="h-8 pr-0 shrink-0"
                onClick={() => navigate('/projects')}
                aria-label="Voir toutes les activités récentes"
              >
                Voir tout <ArrowRight className="ml-1 h-3 w-3" aria-hidden="true" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <ul role="list" className="divide-y divide-border">
                {mockRecentActivities.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div
                      className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${item.colorClass}`}
                      aria-hidden="true"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.meta}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                      {item.time}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Échéances à Venir</CardTitle>
              <Button
                variant="link"
                size="sm"
                className="h-8 pr-0 shrink-0"
                onClick={() => navigate('/projects')}
                aria-label="Voir le calendrier des échéances"
              >
                Calendrier <ArrowRight className="ml-1 h-3 w-3" aria-hidden="true" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <ul role="list" className="divide-y divide-border">
                {mockUpcomingDeadlines.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div
                      className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${item.colorClass}`}
                      aria-hidden="true"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.meta}</p>
                    </div>
                    <span className="text-xs text-muted-foreground font-medium whitespace-nowrap shrink-0">
                      {item.time}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Alerts ── */}
      <section aria-label="Alertes nécessitant une action">
        <Card className="border-destructive/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              Alertes
              <span className="text-xs font-normal text-destructive/70 ml-1">
                Action immédiate requise
              </span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
              onClick={() => navigate('/projects')}
              aria-label="Voir toutes les alertes du portefeuille"
            >
              Voir tout
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <ul role="list" className="divide-y divide-destructive/10">
              {mockAlerts.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors"
                >
                  <div
                    className={`p-2 rounded-md shrink-0 ${
                      item.type === 'critical'
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-warning/10 text-warning'
                    }`}
                    aria-label={item.type === 'critical' ? 'Alerte critique' : 'Avertissement'}
                  >
                    <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.meta}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

    </DashboardLayout>
  );
}
