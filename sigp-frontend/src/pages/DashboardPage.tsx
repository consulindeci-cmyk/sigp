import { useState, useMemo } from 'react';
import { useDashboard } from '@/hooks/useDashboard';
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
import { useNotifications } from '@/hooks/useNotifications';
import {
  Modal, ModalContent, ModalHeader, ModalTitle,
  ModalDescription, ModalFooter, ModalClose,
} from '@/components/ui/overlays/Modal';
import {
  SlideOver, SlideOverContent, SlideOverHeader, SlideOverTitle,
  SlideOverBody, SlideOverFooter, SlideOverClose,
} from '@/components/ui/overlays/SlideOver';

// ── Shared tooltip style (Design System tokens) ─────────────────────────────
const tooltipStyle: React.CSSProperties = {
  borderRadius: '8px',
  border: '1px solid hsl(var(--border))',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  fontSize: '12px',
  background: 'hsl(var(--card))',
  color: 'hsl(var(--foreground))',
};

// ── Pie chart color palettes ─────────────────────────────────────────────────
const STATUS_COLORS = [
  'hsl(var(--success))',
  'hsl(var(--muted-foreground))',
  'hsl(var(--destructive))',
];
const BUDGET_DIST_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--success))',
  'hsl(var(--warning))',
];
const FUNDING_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--muted-foreground))',
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

  const todayLabel = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  // ── Backend data ─────────────────────────────────────────────────────────
  const { data: dashboard } = useDashboard();
  const { data: notifications } = useNotifications();

  // Derived KPIs — real API data; 0 when backend returns nothing
  const portfolioKPIs = useMemo(() => {
    const api = dashboard as any;
    const budgetTotal    = api?.finances?.budgetTotal    ?? 0;
    const montantPaye    = api?.finances?.montantPaye    ?? 0;
    const montantEngage  = api?.finances?.montantEngage  ?? 0;
    const montantRestant = api?.finances?.montantRestant ?? 0;
    const formatM = (n: number) =>
      n >= 1_000_000
        ? `${(n / 1_000_000).toFixed(1).replace('.', ',')} M FCFA`
        : `${n.toLocaleString('fr-FR')} FCFA`;
    return {
      totalProjets:            api?.projets?.total          ?? 0,
      projetsActifs:           api?.projets?.actifs         ?? 0,
      projetsTermines:         api?.projets?.termines       ?? 0,
      projetsEnRetard:         api?.projets?.suspendus      ?? 0,
      pctActifs:               api?.projets?.pctActifs      ?? 0,
      pctTermines:             api?.projets?.pctTermines    ?? 0,
      budgetGlobal:            formatM(budgetTotal),
      budgetDecaisse:          formatM(montantPaye),
      tauxDecaissement:        api?.finances?.tauxDecaissement ?? '0%',
      contratsActifs:          api?.passation?.marchesTotal   ?? 0,
      contratsEnApprobation:   api?.passation?.marchesEnCours ?? 0,
      risquesCritiques:        api?.risques?.critiques        ?? 0,
      risquesCritiquesProgram: api?.risques?.total            ?? 0,
      nombreBailleurs:         api?.finances?.nombreBailleurs ?? 0,
      // Finance detail for budget consumption widget
      _budgetTotal:    budgetTotal,
      _montantEngage:  montantEngage,
      _montantPaye:    montantPaye,
      _montantRestant: montantRestant,
      _percentEngaged: api?.finances?.percentEngaged ?? 0,
      _percentDisbursed: api?.finances?.percentDisbursed ?? 0,
    };
  }, [dashboard]);

  // Derived budget consumption widget
  const budgetConsumption = useMemo(() => {
    const t = portfolioKPIs._budgetTotal;
    return {
      total:            Math.round(t / 1_000_000 * 10) / 10,
      engaged:          Math.round(portfolioKPIs._montantEngage / 1_000_000 * 10) / 10,
      disbursed:        Math.round(portfolioKPIs._montantPaye / 1_000_000 * 10) / 10,
      remaining:        Math.round(portfolioKPIs._montantRestant / 1_000_000 * 10) / 10,
      percentEngaged:   portfolioKPIs._percentEngaged,
      percentDisbursed: portfolioKPIs._percentDisbursed,
    };
  }, [portfolioKPIs]);

  // Alerts derived from notifications backend
  const alerts = useMemo(() => {
    if (!notifications?.length) return [];
    const CRITICAL_TYPES = new Set([
      'RISQUE_CRITIQUE', 'BUDGET_DEPASSE', 'EVM_ALERTE_CPI',
      'EVM_ALERTE_SPI', 'CONTRAT_EXPIRE',
    ]);
    return notifications
      .filter(n => !n.lue)
      .map(n => ({
        id:    n.id,
        type:  CRITICAL_TYPES.has(n.type) ? 'critical' as const : 'warning' as const,
        title: n.titre,
        meta:  n.message,
      }));
  }, [notifications]);

  // ── Analytics sections from backend ─────────────────────────────────────
  const dashApi = dashboard as any;
  const evmData = (dashApi?.evmData ?? []) as { date: string; pv: number; ev: number; ac: number }[];
  const decaissementsMensuels = (dashApi?.decaissementsMensuels ?? []) as { label: string; value: number }[];
  const budgetDistribution     = (dashApi?.budgetDistribution     ?? []) as { label: string; value: number; percent?: number; color?: string }[];
  const financementDistribution= (dashApi?.financementDistribution?? []) as { label: string; value: number; percent?: number; color?: string }[];
  const risquesParCategorie    = (dashApi?.risquesParCategorie    ?? []) as { label: string; value: number; percent?: number; color?: string }[];
  const activitesCritiques     = (dashApi?.activitesCritiques     ?? []) as { id: string; code: string; name: string; status: 'blocked'|'delayed'; delayDays: number }[];
  const risquesPrincipaux      = (dashApi?.risquesPrincipaux      ?? []) as { id: string; description: string; probability: number; level: 'high'|'medium'|'low' }[];
  const jalons                 = (dashApi?.jalons                 ?? []) as { id: string; title: string; date: string; status: 'achieved'|'delayed'|'pending' }[];
  const evenementsRecents      = (dashApi?.evenementsRecents      ?? []) as { id: string; description: string; date: string; type: 'alert'|'validation'|'payment'|'milestone' }[];
  const activitesRecentes      = (dashApi?.activitesRecentes      ?? []) as { id: string; title: string; meta: string; time: string; colorClass: string }[];
  const echeancesProches       = (dashApi?.echeancesProches       ?? []) as { id: string; title: string; meta: string; time: string; colorClass: string }[];
  const timelineItems          = (dashApi?.timeline               ?? []) as { id: string; title: string; date: string; project: string; type: 'deadline'|'milestone'|'event' }[];

  // Derived project status distribution
  const projectStatusDistribution = useMemo(() => {
    const api = dashboard as any;
    if (!api?.projets) {
      return [
        { name: 'Actifs',    value: 0, color: STATUS_COLORS[0] },
        { name: 'Terminés',  value: 0, color: STATUS_COLORS[1] },
        { name: 'Suspendus', value: 0, color: STATUS_COLORS[2] },
      ];
    }
    return [
      { name: 'Actifs',    value: api.projets.actifs,    color: STATUS_COLORS[0] },
      { name: 'Terminés',  value: api.projets.termines,  color: STATUS_COLORS[1] },
      { name: 'Suspendus', value: api.projets.suspendus, color: STATUS_COLORS[2] },
    ];
  }, [dashboard]);

  // ── Panel state ─────────────────────────────────────────────────────────
  const [showDisbReport, setShowDisbReport] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [showAllRisks, setShowAllRisks] = useState(false);
  const [showAllRecentAct, setShowAllRecentAct] = useState(false);
  const [showAllAlerts, setShowAllAlerts] = useState(false);
  const [showAllDeadlines, setShowAllDeadlines] = useState(false);

  // ── CSV Export ───────────────────────────────────────────────────────────
  function exportPortfolioCSV() {
    const lines: string[][] = [
      ['RAPPORT PORTEFEUILLE GPD', new Date().toLocaleDateString('fr-FR')],
      [],
      ['INDICATEURS CLÉS', ''],
      ['Indicateur', 'Valeur'],
      ['Total des projets', String(portfolioKPIs.totalProjets)],
      ['Projets actifs', String(portfolioKPIs.projetsActifs)],
      ['Projets terminés', String(portfolioKPIs.projetsTermines)],
      ['Projets suspendus', String(portfolioKPIs.projetsEnRetard)],
      ['Budget global', portfolioKPIs.budgetGlobal],
      ['Budget décaissé', portfolioKPIs.budgetDecaisse],
      ['Taux de décaissement', portfolioKPIs.tauxDecaissement],
      ['Contrats actifs', String(portfolioKPIs.contratsActifs)],
      ['Contrats en approbation', String(portfolioKPIs.contratsEnApprobation)],
      ['Risques critiques', String(portfolioKPIs.risquesCritiques)],
      [],
      ['DÉCAISSEMENTS MENSUELS (M FCFA)', ''],
      ['Mois', 'Montant (M FCFA)'],
      ...decaissementsMensuels.map(d => [d.label, String(d.value)]),
      [],
      ['RÉPARTITION PAR BAILLEUR', ''],
      ['Bailleur', 'Budget', 'Part (%)'],
      ...financementDistribution.map(b => [b.label, String(b.value), String(b.percent ?? 0)]),
      [],
      ['RISQUES PAR CATÉGORIE', ''],
      ['Catégorie', 'Nombre', 'Part (%)'],
      ...risquesParCategorie.map(r => [r.label, String(r.value), String(r.percent ?? 0)]),
    ];
    const csv = '﻿' + lines.map(row =>
      row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portefeuille-gpd-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ── Derived KPIs (computed, never hardcoded) ─────────────────────────────
  const pctActifs = Math.round(
    (portfolioKPIs.projetsActifs / portfolioKPIs.totalProjets) * 100,
  );
  const pctTermines = Math.round(
    (portfolioKPIs.projetsTermines / portfolioKPIs.totalProjets) * 100,
  );

  const headerActions = (
    <>
      <Button
        variant="outline"
        leftIcon={<Download className="h-4 w-4" aria-hidden="true" />}
        onClick={exportPortfolioCSV}
        aria-label="Exporter le rapport du portefeuille en CSV"
      >
        Exporter
      </Button>
      <Button
        leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />}
        onClick={() => navigate('/projects?new=1')}
        aria-label="Créer un nouveau projet"
      >
        Nouveau Projet
      </Button>
    </>
  );

  return (
    <>
    <DashboardLayout
      header={
        <PageHeader
          title="Tableau de bord du portefeuille"
          subtitle={`Vue d'ensemble multi-projets — ${todayLabel}`}
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
            value={portfolioKPIs.totalProjets}
            icon={<LayoutGrid className="h-5 w-5 text-primary" aria-hidden="true" />}
            iconVariant="primary"
            trend={{ value: 3, label: 'vs trimestre précédent', isPositive: true }}
          />
          <StatCard
            title="Projets Actifs"
            value={portfolioKPIs.projetsActifs}
            icon={<Activity className="h-5 w-5 text-success" aria-hidden="true" />}
            iconVariant="success"
            description={`${pctActifs}% du portefeuille`}
          />
          <StatCard
            title="Projets Terminés"
            value={portfolioKPIs.projetsTermines}
            icon={<CheckCircle2 className="h-5 w-5 text-muted-foreground" aria-hidden="true" />}
            iconVariant="default"
            description={`${pctTermines}% du portefeuille`}
          />
          <StatCard
            title="Projets Suspendus"
            value={portfolioKPIs.projetsEnRetard}
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
            value={portfolioKPIs.budgetGlobal}
            icon={<Banknote className="h-5 w-5 text-primary" aria-hidden="true" />}
            iconVariant="primary"
            description={`réparti sur ${portfolioKPIs.nombreBailleurs} bailleurs`}
          />
          <StatCard
            title="Budget Décaissé"
            value={portfolioKPIs.budgetDecaisse}
            icon={<Wallet className="h-5 w-5 text-success" aria-hidden="true" />}
            iconVariant="success"
            description={`${portfolioKPIs.tauxDecaissement} taux de décaissement`}
          />
          <StatCard
            title="Contrats de Marchés"
            value={portfolioKPIs.contratsActifs}
            icon={<FileSignature className="h-5 w-5 text-primary" aria-hidden="true" />}
            iconVariant="primary"
            description={`${portfolioKPIs.contratsEnApprobation} en circuit d'approbation`}
          />
          <StatCard
            title="Risques Critiques"
            value={portfolioKPIs.risquesCritiques}
            icon={<ShieldAlert className="h-5 w-5 text-destructive" aria-hidden="true" />}
            iconVariant="destructive"
            description={`sur ${portfolioKPIs.risquesCritiquesProgram}`}
          />
        </div>
      </section>

      {/* ── Disbursements Trend + Project Status ── */}
      <section aria-label="Graphiques principaux">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

          {/* Area chart — Décaissements 12 mois */}
          <Card className="min-w-0 lg:col-span-2">
            <CardHeader className="pb-3">
              <SectionHeader
                title="Tendances de Décaissement"
                subtitle="Décaissements mensuels — 12 derniers mois (M FCFA)"
                action={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 shrink-0"
                    onClick={() => setShowDisbReport(true)}
                    aria-label="Voir le rapport complet de décaissement"
                  >
                    Voir le rapport
                  </Button>
                }
              />
            </CardHeader>
            <CardContent>
              <div
                className="h-64 w-full min-w-0"
                role="img"
                aria-label="Graphique en courbe : tendances de décaissement sur 12 mois"
              >
                <ResponsiveContainer width="99%" height="100%">
                  <AreaChart
                    data={decaissementsMensuels}
                    margin={{ top: 5, right: 8, left: 0, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="disbGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => `${v}M`}
                      width={34}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v: any) => [`${v} M FCFA`, 'Décaissé']}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      name="Décaissé (M FCFA)"
                      stroke="hsl(var(--primary))"
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
          <Card className="min-w-0">
            <CardHeader className="pb-3">
              <SectionHeader
                title="Statut des Projets"
                subtitle="Répartition du portefeuille"
              />
            </CardHeader>
            <CardContent>
              <div
                className="h-64 w-full min-w-0"
                role="img"
                aria-label="Graphique en donut : répartition des projets par statut"
              >
                <ResponsiveContainer width="99%" height="100%">
                  <PieChart>
                    <Pie
                      data={projectStatusDistribution}
                      cx="50%"
                      cy="45%"
                      innerRadius={52}
                      outerRadius={78}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {projectStatusDistribution.map((_entry: unknown, i: number) => (
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
          <Card className="min-w-0 lg:col-span-2">
            <CardHeader className="pb-3">
              <SectionHeader
                title="Performance EVM du Portefeuille"
                subtitle="PV / EV / AC cumulés — valeurs en K FCFA"
              />
            </CardHeader>
            <CardContent>
              {evmData.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Aucun snapshot EVM disponible — créez des snapshots dans les projets.
                </p>
              )}
              <div
                className="h-64 w-full min-w-0"
                role="img"
                aria-label="Graphique EVM : courbes Valeur Planifiée, Valeur Acquise, Coût Réel"
              >
                <ResponsiveContainer width="99%" height="100%">
                  <LineChart
                    data={evmData}
                    margin={{ top: 5, right: 8, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => `${v}K`}
                      width={38}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v: any, name: any) => [`${v} K FCFA`, name]}
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
                      stroke="hsl(var(--muted-foreground))"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="ev"
                      name="EV — Réalisé"
                      stroke="hsl(var(--success))"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="ac"
                      name="AC — Coût réel"
                      stroke="hsl(var(--destructive))"
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
          <Card className="min-w-0">
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
                  {budgetConsumption.total} M FCFA
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Engagé</span>
                  <span className="font-semibold font-mono text-foreground">
                    {budgetConsumption.engaged} M FCFA
                  </span>
                </div>
                <ProgressBar
                  value={budgetConsumption.percentEngaged}
                  color="primary"
                  size="sm"
                  showLabel
                  aria-label={`Budget engagé : ${budgetConsumption.percentEngaged}%`}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Décaissé</span>
                  <span className="font-semibold font-mono text-success">
                    {budgetConsumption.disbursed} M FCFA
                  </span>
                </div>
                <ProgressBar
                  value={budgetConsumption.percentDisbursed}
                  color="success"
                  size="sm"
                  showLabel
                  aria-label={`Budget décaissé : ${budgetConsumption.percentDisbursed}%`}
                />
              </div>

              <div className="pt-3 border-t border-border flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Solde disponible</span>
                <span className="font-bold font-mono text-foreground">
                  {budgetConsumption.remaining} M FCFA
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
          <Card className="min-w-0">
            <CardHeader className="pb-3">
              <SectionHeader
                title="Répartition du Budget"
                subtitle="Par composante principale"
              />
            </CardHeader>
            <CardContent>
              <div
                className="h-56 w-full min-w-0"
                role="img"
                aria-label="Graphique en donut : répartition du budget par composante"
              >
                <ResponsiveContainer width="99%" height="100%">
                  <PieChart>
                    <Pie
                      data={budgetDistribution.map((d) => ({
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
                      {budgetDistribution.map((_e, i) => (
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
          <Card className="min-w-0">
            <CardHeader className="pb-3">
              <SectionHeader
                title="Sources de Financement"
                subtitle="Répartition par bailleur principal"
              />
            </CardHeader>
            <CardContent>
              <div
                className="h-56 w-full min-w-0"
                role="img"
                aria-label="Graphique en donut : répartition des sources de financement"
              >
                <ResponsiveContainer width="99%" height="100%">
                  <PieChart>
                    <Pie
                      data={financementDistribution.map((d) => ({
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
                      {financementDistribution.map((_e, i) => (
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
          <Card className="min-w-0">
            <CardHeader className="pb-3">
              <SectionHeader
                title="Activités Critiques"
                subtitle="Activités en retard ou bloquées"
                action={
                  <Button
                    variant="link"
                    size="sm"
                    className="h-8 pr-0 shrink-0"
                    onClick={() => setShowAllActivities(true)}
                    aria-label="Voir toutes les activités critiques"
                  >
                    Voir tout <ArrowRight className="ml-1 h-3 w-3" aria-hidden="true" />
                  </Button>
                }
              />
            </CardHeader>
            <CardContent className="p-0">
              <ul role="list" className="divide-y divide-border">
                {activitesCritiques.length === 0 && (
                  <li className="p-4 text-sm text-muted-foreground">Aucune activité critique.</li>
                )}
                {activitesCritiques.map((activity) => (
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
          <Card className="min-w-0">
            <CardHeader className="pb-3">
              <SectionHeader
                title="Risques Principaux"
                subtitle="Classés par niveau de criticité"
                action={
                  <Button
                    variant="link"
                    size="sm"
                    className="h-8 pr-0 shrink-0"
                    onClick={() => setShowAllRisks(true)}
                    aria-label="Voir tous les risques"
                  >
                    Voir tout <ArrowRight className="ml-1 h-3 w-3" aria-hidden="true" />
                  </Button>
                }
              />
            </CardHeader>
            <CardContent className="p-0">
              <ul role="list" className="divide-y divide-border">
                {risquesPrincipaux.length === 0 && (
                  <li className="p-4 text-sm text-muted-foreground">Aucun risque majeur identifié.</li>
                )}
                {risquesPrincipaux.map((risk) => (
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
          <Card className="min-w-0">
            <CardHeader className="pb-3">
              <SectionHeader
                title="Jalons à Venir"
                subtitle="Prochains jalons critiques du portefeuille"
                action={
                  <Button
                    variant="link"
                    size="sm"
                    className="h-8 pr-0 shrink-0"
                    onClick={() => setShowCalendar(true)}
                    aria-label="Voir le calendrier des jalons"
                  >
                    Calendrier <ArrowRight className="ml-1 h-3 w-3" aria-hidden="true" />
                  </Button>
                }
              />
            </CardHeader>
            <CardContent className="p-0">
              <ul role="list" className="divide-y divide-border">
                {jalons.length === 0 && (
                  <li className="p-4 text-sm text-muted-foreground">Aucun jalon à venir.</li>
                )}
                {jalons.map((milestone) => (
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
          <Card className="min-w-0">
            <CardHeader className="pb-3">
              <SectionHeader
                title="Événements Récents"
                subtitle="Derniers événements du portefeuille"
              />
            </CardHeader>
            <CardContent className="p-0">
              <ul role="list" className="divide-y divide-border">
                {evenementsRecents.length === 0 && (
                  <li className="p-4 text-sm text-muted-foreground">Aucun événement récent.</li>
                )}
                {evenementsRecents.map((event) => (
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
        <Card className="min-w-0">
          <CardHeader className="pb-3">
            <SectionHeader
              title="Ligne de Temps du Portefeuille"
              subtitle="Jalons et échéances — Juil. à Nov. 2026"
              action={
                <Button
                  variant="link"
                  size="sm"
                  className="h-8 pr-0 shrink-0"
                  onClick={() => setShowCalendar(true)}
                  aria-label="Voir le calendrier complet du portefeuille"
                >
                  Calendrier <ArrowRight className="ml-1 h-3 w-3" aria-hidden="true" />
                </Button>
              }
            />
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto" tabIndex={0} aria-label="Faites défiler pour voir la ligne de temps">
              {timelineItems.length === 0 && (
                <p className="text-sm text-muted-foreground py-2 px-1">Aucun événement dans la ligne de temps.</p>
              )}
              <div className="flex gap-0 min-w-max pb-2">
                {timelineItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex flex-col items-center w-40 sm:w-48 relative"
                  >
                    {/* Connector line */}
                    {idx < timelineItems.length - 1 && (
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
          <Card className="min-w-0">
            <CardHeader className="pb-3">
              <SectionHeader
                title="Répartition par Bailleur"
                subtitle="Contribution au portefeuille global"
              />
            </CardHeader>
            <CardContent className="space-y-4">
              {financementDistribution.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">Aucune source de financement enregistrée</p>
              ) : (
                financementDistribution.map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-sm font-medium mb-1.5">
                      <span className="text-foreground">{item.label}</span>
                      <span className="text-foreground font-mono tabular-nums">
                        {typeof item.value === 'number'
                          ? item.value >= 1_000_000
                            ? `${(item.value / 1_000_000).toFixed(1).replace('.', ',')} M FCFA`
                            : `${item.value.toLocaleString('fr-FR')} FCFA`
                          : item.value}
                      </span>
                    </div>
                    <ProgressBar
                      value={item.percent ?? 0}
                      color={(item.color ?? 'primary') as any}
                      aria-label={`${item.label} : ${item.percent ?? 0}% du portefeuille`}
                    />
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Risks by Category */}
          <Card className="min-w-0">
            <CardHeader className="pb-3">
              <SectionHeader
                title="Répartition des Risques"
                subtitle="Par catégorie — portefeuille global"
              />
            </CardHeader>
            <CardContent className="space-y-4">
              {risquesParCategorie.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">Aucun risque répertorié</p>
              ) : (
                risquesParCategorie.map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-sm font-medium mb-1.5">
                      <span className="text-foreground">{item.label}</span>
                      <span className="text-foreground tabular-nums">{item.value}</span>
                    </div>
                    <ProgressBar
                      value={item.percent ?? 0}
                      color={(item.color ?? 'destructive') as any}
                      aria-label={`${item.label} : ${item.value} risques (${item.percent ?? 0}%)`}
                    />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Recent Activities + Upcoming Deadlines ── */}
      <section aria-label="Activités récentes et échéances">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

          {/* Recent Activities */}
          <Card className="min-w-0">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Activités Récentes</CardTitle>
              <Button
                variant="link"
                size="sm"
                className="h-8 pr-0 shrink-0"
                onClick={() => setShowAllRecentAct(true)}
                aria-label="Voir toutes les activités récentes"
              >
                Voir tout <ArrowRight className="ml-1 h-3 w-3" aria-hidden="true" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <ul role="list" className="divide-y divide-border">
                {activitesRecentes.length === 0 && (
                  <li className="p-4 text-sm text-muted-foreground">Aucune activité récente.</li>
                )}
                {activitesRecentes.map((item) => (
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
          <Card className="min-w-0">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Échéances à Venir</CardTitle>
              <Button
                variant="link"
                size="sm"
                className="h-8 pr-0 shrink-0"
                onClick={() => setShowAllDeadlines(true)}
                aria-label="Voir toutes les échéances à venir"
              >
                Calendrier <ArrowRight className="ml-1 h-3 w-3" aria-hidden="true" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <ul role="list" className="divide-y divide-border">
                {echeancesProches.length === 0 && (
                  <li className="p-4 text-sm text-muted-foreground">Aucune échéance à venir.</li>
                )}
                {echeancesProches.map((item) => (
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
        <Card className="min-w-0 border-destructive/20">
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
              onClick={() => setShowAllAlerts(true)}
              aria-label="Voir toutes les alertes du portefeuille"
            >
              Voir tout
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {alerts.length === 0 && (
              <p className="text-sm text-muted-foreground p-4">Aucune alerte active.</p>
            )}
            <ul role="list" className="divide-y divide-destructive/10">
              {alerts.map((item) => (
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

    {/* ══════════════════════════════════════════════════════════════════════
        PANNEAU 1 — Rapport de Décaissement (Modal)
    ══════════════════════════════════════════════════════════════════════ */}
    <Modal open={showDisbReport} onOpenChange={setShowDisbReport}>
      <ModalContent className="max-w-xl">
        <ModalHeader>
          <ModalTitle>Rapport de Décaissement</ModalTitle>
          <ModalDescription>Décaissements mensuels — 12 derniers mois (M FCFA)</ModalDescription>
        </ModalHeader>
        <div className="px-6 pb-2">
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mois</th>
                  <th className="text-right px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Montant</th>
                  <th className="text-right px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cumul</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {decaissementsMensuels.map((d, i) => {
                  const cumul = Math.round(
                    decaissementsMensuels.slice(0, i + 1).reduce((s, x) => s + x.value, 0) * 10
                  ) / 10;
                  return (
                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-2 font-medium text-foreground">{d.label}</td>
                      <td className="px-4 py-2 text-right font-mono tabular-nums text-foreground">{d.value} M FCFA</td>
                      <td className="px-4 py-2 text-right font-mono tabular-nums text-muted-foreground">{cumul} M FCFA</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-muted/30 border-t-2 border-border">
                <tr>
                  <td className="px-4 py-2 font-bold text-foreground text-sm">Total</td>
                  <td className="px-4 py-2 text-right font-bold font-mono tabular-nums text-foreground">
                    {Math.round(decaissementsMensuels.reduce((s, d) => s + d.value, 0) * 10) / 10} M FCFA
                  </td>
                  <td className="px-4 py-2 text-right text-muted-foreground">—</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 mb-2">
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <p className="text-[11px] text-muted-foreground">Moyenne / mois</p>
              <p className="text-base font-bold font-mono text-foreground mt-1">
                {decaissementsMensuels.length > 0
                  ? (Math.round((decaissementsMensuels.reduce((s, d) => s + d.value, 0) / decaissementsMensuels.length) * 10) / 10)
                  : 0} M FCFA
              </p>
            </div>
            <div className="bg-success/10 rounded-lg p-3 text-center">
              <p className="text-[11px] text-muted-foreground">Pic mensuel</p>
              <p className="text-base font-bold font-mono text-success mt-1">
                {decaissementsMensuels.length > 0 ? Math.max(...decaissementsMensuels.map(d => d.value)) : 0} M FCFA
              </p>
            </div>
            <div className="bg-primary/10 rounded-lg p-3 text-center">
              <p className="text-[11px] text-muted-foreground">Taux global</p>
              <p className="text-base font-bold font-mono text-primary mt-1">
                {portfolioKPIs.tauxDecaissement}
              </p>
            </div>
          </div>
        </div>
        <ModalFooter>
          <Button
            variant="outline"
            leftIcon={<Download className="h-4 w-4" aria-hidden="true" />}
            onClick={exportPortfolioCSV}
          >
            Exporter CSV
          </Button>
          <ModalClose asChild>
            <Button>Fermer</Button>
          </ModalClose>
        </ModalFooter>
      </ModalContent>
    </Modal>

    {/* ══════════════════════════════════════════════════════════════════════
        PANNEAU 2 — Calendrier (SlideOver)
    ══════════════════════════════════════════════════════════════════════ */}
    <SlideOver open={showCalendar} onOpenChange={setShowCalendar}>
      <SlideOverContent>
        <SlideOverHeader>
          <SlideOverTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" aria-hidden="true" />
            Calendrier du Portefeuille
          </SlideOverTitle>
          <SlideOverClose asChild>
            <button className="rounded-sm opacity-70 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring" aria-label="Fermer">
              ✕
            </button>
          </SlideOverClose>
        </SlideOverHeader>
        <SlideOverBody className="space-y-6">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Jalons à venir ({jalons.length})
            </h3>
            <ul className="space-y-2">
              {jalons.length === 0 && <li className="text-sm text-muted-foreground px-1">Aucun jalon.</li>}
              {jalons.map(m => (
                <li key={m.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                  <div className={`p-1.5 rounded-md shrink-0 ${
                    m.status === 'achieved' ? 'bg-success/10 text-success'
                    : m.status === 'delayed' ? 'bg-destructive/10 text-destructive'
                    : 'bg-primary/10 text-primary'
                  }`} aria-hidden="true">
                    <Flag className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{m.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{m.date}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                    m.status === 'achieved' ? 'bg-success/10 text-success'
                    : m.status === 'delayed' ? 'bg-destructive/10 text-destructive'
                    : 'bg-muted text-muted-foreground'
                  }`}>
                    {m.status === 'achieved' ? 'Atteint' : m.status === 'delayed' ? 'En retard' : 'À venir'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Échéances imminentes ({echeancesProches.length})
            </h3>
            <ul className="space-y-2">
              {echeancesProches.length === 0 && <li className="text-sm text-muted-foreground px-1">Aucune échéance.</li>}
              {echeancesProches.map(d => (
                <li key={d.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${d.colorClass}`} aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{d.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{d.meta}</p>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground shrink-0 whitespace-nowrap bg-muted px-2 py-0.5 rounded-full">
                    {d.time}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Ligne de temps ({timelineItems.length} événements)
            </h3>
            <ul className="space-y-2">
              {timelineItems.length === 0 && <li className="text-sm text-muted-foreground px-1">Aucun événement.</li>}
              {timelineItems.map(t => (
                <li key={t.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                  <div className={`p-1.5 rounded-md shrink-0 ${
                    t.type === 'deadline' ? 'bg-warning/10 text-warning'
                    : t.type === 'milestone' ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
                  }`} aria-hidden="true">
                    {t.type === 'deadline'
                      ? <Calendar className="h-3.5 w-3.5" />
                      : t.type === 'milestone'
                      ? <Flag className="h-3.5 w-3.5" />
                      : <TrendingUp className="h-3.5 w-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{t.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.project} · {t.date}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </SlideOverBody>
        <SlideOverFooter>
          <SlideOverClose asChild>
            <Button variant="outline" className="w-full">Fermer</Button>
          </SlideOverClose>
        </SlideOverFooter>
      </SlideOverContent>
    </SlideOver>

    {/* ══════════════════════════════════════════════════════════════════════
        PANNEAU 3 — Activités Critiques (SlideOver)
    ══════════════════════════════════════════════════════════════════════ */}
    <SlideOver open={showAllActivities} onOpenChange={setShowAllActivities}>
      <SlideOverContent>
        <SlideOverHeader>
          <SlideOverTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
            Activités Critiques
          </SlideOverTitle>
          <SlideOverClose asChild>
            <button className="rounded-sm opacity-70 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring" aria-label="Fermer">
              ✕
            </button>
          </SlideOverClose>
        </SlideOverHeader>
        <SlideOverBody className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {activitesCritiques.length} activité{activitesCritiques.length > 1 ? 's' : ''} nécessitant une intervention immédiate.
          </p>
          <ul className="space-y-3">
            {activitesCritiques.length === 0 && <li className="text-sm text-muted-foreground">Aucune activité critique.</li>}
            {activitesCritiques.map(activity => (
              <li key={activity.id} className="p-4 rounded-lg border border-border bg-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className={`mt-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                      activity.status === 'blocked'
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-warning/10 text-warning'
                    }`}>
                      {activity.code}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{activity.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Statut :{' '}
                        <span className={`font-semibold ${activity.status === 'blocked' ? 'text-destructive' : 'text-warning'}`}>
                          {activity.status === 'blocked' ? 'Bloquée' : 'En retard'}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-sm font-bold ${activity.status === 'blocked' ? 'text-destructive' : 'text-warning'}`}>
                      +{activity.delayDays}j
                    </span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">retard</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
            <p className="text-xs text-destructive font-semibold">Retard cumulé total</p>
            <p className="text-lg font-bold text-destructive mt-1">
              {activitesCritiques.reduce((s, a) => s + a.delayDays, 0)} jours
            </p>
          </div>
        </SlideOverBody>
        <SlideOverFooter>
          <SlideOverClose asChild>
            <Button variant="outline" className="w-full">Fermer</Button>
          </SlideOverClose>
        </SlideOverFooter>
      </SlideOverContent>
    </SlideOver>

    {/* ══════════════════════════════════════════════════════════════════════
        PANNEAU 4 — Risques (SlideOver)
    ══════════════════════════════════════════════════════════════════════ */}
    <SlideOver open={showAllRisks} onOpenChange={setShowAllRisks}>
      <SlideOverContent>
        <SlideOverHeader>
          <SlideOverTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-destructive" aria-hidden="true" />
            Risques du Portefeuille
          </SlideOverTitle>
          <SlideOverClose asChild>
            <button className="rounded-sm opacity-70 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring" aria-label="Fermer">
              ✕
            </button>
          </SlideOverClose>
        </SlideOverHeader>
        <SlideOverBody className="space-y-6">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Risques principaux ({risquesPrincipaux.length})
            </h3>
            <ul className="space-y-3">
              {risquesPrincipaux.length === 0 && <li className="text-sm text-muted-foreground">Aucun risque majeur.</li>}
              {risquesPrincipaux.map(risk => (
                <li key={risk.id} className="p-4 rounded-lg border border-border bg-card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`mt-1 h-2.5 w-2.5 rounded-full shrink-0 ${
                        risk.level === 'high' ? 'bg-destructive'
                        : risk.level === 'medium' ? 'bg-warning'
                        : 'bg-success'
                      }`} aria-hidden="true" />
                      <p className="text-sm text-foreground">{risk.description}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold font-mono tabular-nums text-foreground">{risk.probability}%</p>
                      <p className="text-[10px] text-muted-foreground">probabilité</p>
                    </div>
                  </div>
                  <div className="mt-2 pl-5">
                    <ProgressBar
                      value={risk.probability}
                      color={risk.level === 'high' ? 'destructive' : risk.level === 'medium' ? 'warning' : 'success'}
                      size="xs"
                      aria-label={`Probabilité ${risk.probability}%`}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Par catégorie
            </h3>
            <ul className="space-y-3">
              {risquesParCategorie.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">Aucun risque répertorié</p>
              ) : (
                risquesParCategorie.map((cat, i) => (
                  <li key={i}>
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <span className="text-sm text-foreground flex-1 min-w-0 truncate">{cat.label}</span>
                      <span className="text-sm font-bold font-mono tabular-nums text-foreground shrink-0">{cat.value}</span>
                    </div>
                    <ProgressBar
                      value={cat.percent ?? 0}
                      color={(cat.color ?? 'destructive') as any}
                      size="sm"
                      aria-label={`${cat.label} : ${cat.value} risques (${cat.percent ?? 0}%)`}
                    />
                  </li>
                ))
              )}
            </ul>
          </div>
        </SlideOverBody>
        <SlideOverFooter>
          <SlideOverClose asChild>
            <Button variant="outline" className="w-full">Fermer</Button>
          </SlideOverClose>
        </SlideOverFooter>
      </SlideOverContent>
    </SlideOver>

    {/* ══════════════════════════════════════════════════════════════════════
        PANNEAU 5 — Activités Récentes (SlideOver)
    ══════════════════════════════════════════════════════════════════════ */}
    <SlideOver open={showAllRecentAct} onOpenChange={setShowAllRecentAct}>
      <SlideOverContent>
        <SlideOverHeader>
          <SlideOverTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" aria-hidden="true" />
            Activités Récentes
          </SlideOverTitle>
          <SlideOverClose asChild>
            <button className="rounded-sm opacity-70 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring" aria-label="Fermer">
              ✕
            </button>
          </SlideOverClose>
        </SlideOverHeader>
        <SlideOverBody>
          <ul className="divide-y divide-border">
            {activitesRecentes.length === 0 && <li className="p-4 text-sm text-muted-foreground">Aucune activité récente.</li>}
            {activitesRecentes.map(item => (
              <li key={item.id} className="flex items-start gap-4 py-4 hover:bg-muted/30 transition-colors rounded px-2">
                <div className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${item.colorClass}`} aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.meta}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">{item.time}</span>
              </li>
            ))}
          </ul>
        </SlideOverBody>
        <SlideOverFooter>
          <SlideOverClose asChild>
            <Button variant="outline" className="w-full">Fermer</Button>
          </SlideOverClose>
        </SlideOverFooter>
      </SlideOverContent>
    </SlideOver>

    {/* ══════════════════════════════════════════════════════════════════════
        PANNEAU 6 — Alertes (SlideOver)
    ══════════════════════════════════════════════════════════════════════ */}
    <SlideOver open={showAllAlerts} onOpenChange={setShowAllAlerts}>
      <SlideOverContent>
        <SlideOverHeader>
          <SlideOverTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            Alertes — Action Requise
          </SlideOverTitle>
          <SlideOverClose asChild>
            <button className="rounded-sm opacity-70 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring" aria-label="Fermer">
              ✕
            </button>
          </SlideOverClose>
        </SlideOverHeader>
        <SlideOverBody className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {alerts.length} alerte{alerts.length > 1 ? 's' : ''} active{alerts.length > 1 ? 's' : ''} sur le portefeuille.
          </p>
          <ul className="space-y-3">
            {alerts.map(item => (
              <li key={item.id} className={`p-4 rounded-lg border ${
                item.type === 'critical'
                  ? 'border-destructive/20 bg-destructive/5'
                  : 'border-warning/20 bg-warning/5'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`p-1.5 rounded-md shrink-0 ${
                    item.type === 'critical'
                      ? 'bg-destructive/10 text-destructive'
                      : 'bg-warning/10 text-warning'
                  }`} aria-hidden="true">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.meta}</p>
                    <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.type === 'critical'
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-warning/10 text-warning'
                    }`}>
                      {item.type === 'critical' ? 'CRITIQUE' : 'AVERTISSEMENT'}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </SlideOverBody>
        <SlideOverFooter>
          <SlideOverClose asChild>
            <Button variant="outline" className="w-full">Fermer</Button>
          </SlideOverClose>
        </SlideOverFooter>
      </SlideOverContent>
    </SlideOver>

    {/* ══════════════════════════════════════════════════════════════════════
        PANNEAU 7 — Échéances à Venir (SlideOver)
    ══════════════════════════════════════════════════════════════════════ */}
    <SlideOver open={showAllDeadlines} onOpenChange={setShowAllDeadlines}>
      <SlideOverContent>
        <SlideOverHeader>
          <SlideOverTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" aria-hidden="true" />
            Échéances à Venir
          </SlideOverTitle>
          <SlideOverClose asChild>
            <button className="rounded-sm opacity-70 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring" aria-label="Fermer">
              ✕
            </button>
          </SlideOverClose>
        </SlideOverHeader>
        <SlideOverBody>
          <ul className="divide-y divide-border">
            {echeancesProches.length === 0 && <li className="p-4 text-sm text-muted-foreground">Aucune échéance à venir.</li>}
            {echeancesProches.map(item => (
              <li key={item.id} className="flex items-start gap-4 py-4 hover:bg-muted/30 transition-colors rounded px-2">
                <div className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${item.colorClass}`} aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.meta}</p>
                </div>
                <span className="text-xs font-semibold text-foreground whitespace-nowrap shrink-0 bg-muted px-2 py-0.5 rounded-full">
                  {item.time}
                </span>
              </li>
            ))}
          </ul>
        </SlideOverBody>
        <SlideOverFooter>
          <SlideOverClose asChild>
            <Button variant="outline" className="w-full">Fermer</Button>
          </SlideOverClose>
        </SlideOverFooter>
      </SlideOverContent>
    </SlideOver>
    </>
  );
}
