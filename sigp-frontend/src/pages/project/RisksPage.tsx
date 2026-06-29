import { PageHeader } from '@/components/layout/PageHeader';
import { useParams } from 'react-router-dom';
import { useRisks } from '@/hooks/useRisks';
import { Loader2, AlertCircle, ShieldAlert, ShieldCheck, TrendingUp, Activity, FileText, AlertTriangle } from 'lucide-react';
import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table/DataTable';
import { StatCard } from '@/components/ui/data-display/StatCard';
import { Badge } from '@/components/ui/data-display/Badge';
import { RiskMatrixCard } from '@/components/project/risks/RiskMatrixCard';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type RiskData = {
  id: string;
  categorie: string;
  description: string;
  probabilite: number;
  impact: number;
  criticite: number;
  plan_mitigation: string;
  responsable: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Données démo (fallback quand l'API est indisponible)
// ─────────────────────────────────────────────────────────────────────────────

const DUMMY_RISQUES: RiskData[] = [
  {
    id: '1',
    categorie: 'Fiduciaire',
    description: 'Risque de corruption et détournement de fonds',
    probabilite: 1,
    impact: 3,
    criticite: 3,
    plan_mitigation: 'Audits annuels et contrôles internes',
    responsable: 'DAF',
  },
  {
    id: '2',
    categorie: 'Opérationnel',
    description: 'Retards significatifs sur les chantiers principaux',
    probabilite: 3,
    impact: 2,
    criticite: 6,
    plan_mitigation: 'Suivi hebdomadaire des jalons',
    responsable: 'Chef de projet',
  },
  {
    id: '3',
    categorie: 'Climatique',
    description: 'Sécheresse et manque de ressources hydriques',
    probabilite: 2,
    impact: 3,
    criticite: 6,
    plan_mitigation: "Plan d'urgence gestion de l'eau",
    responsable: 'Coordination',
  },
  {
    id: '4',
    categorie: 'Institutionnel',
    description: 'Instabilité politique locale',
    probabilite: 1,
    impact: 1,
    criticite: 1,
    plan_mitigation: '',
    responsable: 'Direction',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers Badge criticité
// ─────────────────────────────────────────────────────────────────────────────

type BadgeVariant = 'success' | 'warning' | 'destructive' | 'secondary';

function getCriticiteVariant(c: number): BadgeVariant {
  if (c >= 6) return 'destructive';
  if (c >= 3) return 'warning';
  if (c >= 1) return 'success';
  return 'secondary';
}

function getCriticiteLabel(c: number): string {
  if (c >= 6) return 'Critique';
  if (c >= 3) return 'Élevé';
  return 'Faible';
}

// ─────────────────────────────────────────────────────────────────────────────
// Loading / Error sub-views
// ─────────────────────────────────────────────────────────────────────────────

function LoadingView() {
  return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RisksPage
// ─────────────────────────────────────────────────────────────────────────────

export default function RisksPage() {
  const { id: projectId = '' } = useParams();
  const { data: risksData, isLoading } = useRisks(projectId);

  // Données affichées : API si disponible, sinon démo
  const displayData = useMemo<RiskData[]>(() => {
    const rawRisques = risksData?.data ?? [];
    if (rawRisques.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (rawRisques as any[]).map((r: any) => ({
        id: r.id,
        categorie: r.categorie.charAt(0) + r.categorie.slice(1).toLowerCase(),
        description: r.description,
        probabilite: r.probabilite,
        impact: r.impact,
        criticite: r.criticite || r.probabilite * r.impact,
        plan_mitigation: r.plan_mitigation || '—',
        responsable: r.responsable || '—',
      }));
    }
    return DUMMY_RISQUES;
  }, [risksData]);

  // KPIs dynamiques
  const kpis = useMemo(() => {
    const total     = displayData.length;
    const critiques = displayData.filter(r => r.criticite >= 6).length;
    const eleves    = displayData.filter(r => r.criticite >= 3 && r.criticite < 6).length;
    const maitrises = displayData.filter(r => r.criticite <= 2).length;
    const plansActifs = displayData.filter(
      r => r.plan_mitigation && r.plan_mitigation !== '—'
    ).length;
    const scoreMoyen  = total > 0
      ? (displayData.reduce((s, r) => s + r.criticite, 0) / total).toFixed(1)
      : '0.0';
    return { total, critiques, eleves, maitrises, plansActifs, scoreMoyen };
  }, [displayData]);

  // Colonnes DataTable
  const columns = useMemo<ColumnDef<RiskData>[]>(() => [
    {
      accessorKey: 'categorie',
      header: 'CATÉGORIE',
      size: 130,
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original.categorie}</Badge>
      ),
    },
    {
      accessorKey: 'description',
      header: 'RISQUE',
      cell: ({ row }) => (
        <span className="font-medium text-sm whitespace-normal leading-snug">
          {row.original.description}
        </span>
      ),
    },
    {
      accessorKey: 'probabilite',
      header: 'P',
      size: 50,
      meta: { align: 'center' },
      cell: ({ row }) => (
        <span className="font-semibold tabular-nums">{row.original.probabilite}</span>
      ),
    },
    {
      accessorKey: 'impact',
      header: 'I',
      size: 50,
      meta: { align: 'center' },
      cell: ({ row }) => (
        <span className="font-semibold tabular-nums">{row.original.impact}</span>
      ),
    },
    {
      accessorKey: 'criticite',
      header: 'CRITICITÉ',
      size: 120,
      meta: { align: 'center' },
      cell: ({ row }) => {
        const c = row.original.criticite;
        return (
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-base font-bold tabular-nums text-foreground">{c}</span>
            <Badge variant={getCriticiteVariant(c)} className="text-[10px] py-0 px-1.5">
              {getCriticiteLabel(c)}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: 'plan_mitigation',
      header: 'ATTÉNUATION',
      cell: ({ row }) => {
        const plan = row.original.plan_mitigation;
        return plan && plan !== '—' ? (
          <span className="text-sm whitespace-normal leading-snug">{plan}</span>
        ) : (
          <span className="text-xs text-muted-foreground italic">Aucun plan défini</span>
        );
      },
    },
    {
      accessorKey: 'responsable',
      header: 'RESPONSABLE',
      size: 130,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.responsable}</span>
      ),
    },
  ], []);

  if (isLoading) return <LoadingView />;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border bg-card">
        <div>
          <PageHeader title="Matrice des Risques" description="
            Identification, notation et suivi des risques fiduciaires, opérationnels et stratégiques
          " />
        </div>
      </div>

      {/* ── KPI STRIP ──────────────────────────────────────────────────────── */}
      <div className="shrink-0 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 px-4 py-3 border-b border-border bg-muted/10">
        <StatCard
          title="Total risques"
          value={kpis.total}
          icon={<AlertTriangle className="h-4 w-4" />}
          iconVariant="default"
          description="Registre des risques"
        />
        <StatCard
          title="Critiques"
          value={kpis.critiques}
          icon={<ShieldAlert className="h-4 w-4" />}
          iconVariant="destructive"
          description="Score ≥ 6"
        />
        <StatCard
          title="Élevés"
          value={kpis.eleves}
          icon={<Activity className="h-4 w-4" />}
          iconVariant="warning"
          description="Score 3–5"
        />
        <StatCard
          title="Maîtrisés"
          value={kpis.maitrises}
          icon={<ShieldCheck className="h-4 w-4" />}
          iconVariant="success"
          description="Score ≤ 2"
        />
        <StatCard
          title="Plans actifs"
          value={kpis.plansActifs}
          icon={<FileText className="h-4 w-4" />}
          iconVariant="info"
          description="Plans de mitigation"
        />
        <StatCard
          title="Score moyen"
          value={kpis.scoreMoyen}
          icon={<TrendingUp className="h-4 w-4" />}
          iconVariant="primary"
          description="Criticité moyenne"
        />
      </div>

      {/* ── CONTENU PRINCIPAL ──────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="p-4 flex flex-col gap-4">

          {/* Matrice PxI + Tableau côte à côte */}
          <div className="grid grid-cols-1 xl:grid-cols-[auto_1fr] gap-4 items-start">

            {/* a) Carte Matrice */}
            <RiskMatrixCard />

            {/* b) Tableau des risques */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border bg-muted/5 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">Registre des Risques</h2>
                <span className="text-xs text-muted-foreground">
                  {displayData.length} risque{displayData.length !== 1 ? 's' : ''}
                </span>
              </div>
              <DataTable columns={columns} data={displayData} />
            </div>
          </div>

          {/* Alerte automatique */}
          <div className="flex items-start gap-3 bg-warning/10 border border-warning/20 rounded-lg p-5">
            <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h4 className="text-sm font-semibold text-warning">Alerte automatique</h4>
              <p className="text-sm text-warning/80 mt-0.5">
                Tout risque avec une criticité ≥ 6 déclenche une notification au chef de projet
                et requiert un plan de mitigation documenté.
              </p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
