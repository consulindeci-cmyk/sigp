import { PageHeader } from '@/components/layout/PageHeader';
import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import {
  Calendar, RefreshCw, TrendingUp, TrendingDown, Minus,
  Loader2, Database, DollarSign, Target, AlertCircle,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { ColumnDef } from '@tanstack/react-table'
import { useEvm, useEvmTasks, useEvmTrend } from '@/hooks/useEvm'
import { formatNumber } from '@/lib/utils'
import type { EvmTache } from '@/types'
import { StatCard } from '@/components/ui/data-display/StatCard'
import { Badge } from '@/components/ui/data-display/Badge'
import { ProgressBar } from '@/components/ui/data-display/ProgressBar'
import { Button } from '@/components/ui/forms/Button'
import { Input } from '@/components/ui/forms/Input'
import { DataTable } from '@/components/ui/data-table/DataTable'
import { EvmIndexCard } from '@/components/project/evm/EvmIndexCard'

// ─── S-Curve demo fallback ────────────────────────────────────────────────────

const SCURVE_DEMO = [
  { mois: 'Jan',  pv: 60,  ev: 40,  ac: 45  },
  { mois: 'Fév',  pv: 120, ev: 90,  ac: 100 },
  { mois: 'Mar',  pv: 190, ev: 140, ac: 155 },
  { mois: 'Avr',  pv: 250, ev: 180, ac: 200 },
  { mois: 'Mai',  pv: 300, ev: 220, ac: 245 },
  { mois: 'Juin', pv: 360, ev: 250, ac: 270 },
]

// ─── Semantic color helpers ───────────────────────────────────────────────────

type IndexVariant = 'success' | 'warning' | 'destructive'

function getIndexVariant(v: number): IndexVariant {
  if (v >= 1)   return 'success'
  if (v >= 0.9) return 'warning'
  return 'destructive'
}

// Colors for recharts — references CSS variables so they follow the theme
const C = {
  pv: 'hsl(var(--destructive))',
  ev: 'hsl(var(--primary))',
  ac: 'hsl(var(--warning))',
} as const

// ─── Custom Tooltip (recharts) ────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-lg px-3.5 py-2.5 shadow-sm text-xs">
      <p className="text-muted-foreground font-semibold mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center justify-between gap-5 py-px">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-mono font-bold tabular-nums" style={{ color: p.color }}>
            {formatNumber(p.value, 0)}k
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── EVM Index Icon ───────────────────────────────────────────────────────────

function IndexBadgeIcon({ v }: { v: number }) {
  if (v >= 1)   return <TrendingUp  size={14} className="text-success" />
  if (v >= 0.9) return <Minus       size={14} className="text-warning" />
  return              <TrendingDown size={14} className="text-destructive" />
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MoteurEVMPage() {
  const { id: projectId = '' } = useParams()
  const [dateControle, setDateControle] = useState('')

  const { data: evm,      isLoading: evmLoading, refetch } = useEvm(projectId, dateControle || undefined)
  const { data: evmTasks, isLoading: tasksLoading }        = useEvmTasks(projectId, dateControle || undefined)
  const { data: trendData }                                 = useEvmTrend(projectId)

  const isRefreshing = evmLoading || tasksLoading

  // Fallback démo quand l'API est indisponible
  const bac = evm?.bac  ?? 500_000
  const pv  = evm?.pv   ?? 300_000
  const ev  = evm?.ev   ?? 250_000
  const ac  = evm?.ac   ?? 270_000
  const cpi = evm?.cpi  ?? 0.92
  const spi = evm?.spi  ?? 0.83
  const eac = evm?.eac  ?? 543_000

  const fmt = (n: number) => n >= 1000 ? `${Math.round(n / 1000)}k` : String(Math.round(n))

  // Courbe en S — API si dispo, sinon démo
  const sCurveData = trendData?.evolution_mensuelle?.length
    ? trendData.evolution_mensuelle.map(m => ({
        mois: m.mois.replace(/^\d{4}-/, '').replace(/^0/, ''),
        pv: Math.round(m.pv / 1000),
        ev: Math.round(m.ev / 1000),
        ac: Math.round(m.ac / 1000),
      }))
    : SCURVE_DEMO

  // Tâches
  const tasks: EvmTache[] = evmTasks ?? []

  // Colonnes DataTable tâches
  const taskColumns = useMemo<ColumnDef<EvmTache>[]>(() => [
    {
      accessorKey: 'code_tache',
      header: 'CODE',
      size: 80,
      cell: ({ row }) => (
        <span className="font-mono text-xs text-primary font-semibold whitespace-nowrap">
          {row.original.code_tache}
        </span>
      ),
    },
    {
      accessorKey: 'description',
      header: 'DESCRIPTION',
      cell: ({ row }) => (
        <span className="text-sm text-foreground max-w-[200px] truncate block">
          {row.original.description}
        </span>
      ),
    },
    {
      accessorKey: 'wbs',
      header: 'WBS',
      size: 90,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{row.original.wbs ?? '—'}</span>
      ),
    },
    {
      accessorKey: 'avancement',
      header: 'AVANC.',
      size: 120,
      meta: { align: 'center' },
      cell: ({ row }) => {
        const pct = row.original.avancement
        return (
          <div className="flex flex-col items-center gap-1 w-full max-w-[90px] mx-auto">
            <span className="font-mono text-xs font-semibold tabular-nums">{pct}%</span>
            <ProgressBar value={pct} size="xs" color="primary" />
          </div>
        )
      },
    },
    {
      accessorKey: 'bac',
      header: 'BAC',
      size: 80,
      meta: { align: 'right' },
      cell: ({ row }) => (
        <span className="font-mono tabular-nums text-xs text-foreground">
          {formatNumber(row.original.bac, 0)}
        </span>
      ),
    },
    {
      accessorKey: 'pv',
      header: 'PV',
      size: 75,
      meta: { align: 'right' },
      cell: ({ row }) => (
        <span className="font-mono tabular-nums text-xs text-foreground">
          {formatNumber(row.original.pv, 0)}
        </span>
      ),
    },
    {
      accessorKey: 'ev',
      header: 'EV',
      size: 75,
      meta: { align: 'right' },
      cell: ({ row }) => (
        <span className="font-mono tabular-nums text-xs text-foreground">
          {formatNumber(row.original.ev, 0)}
        </span>
      ),
    },
    {
      accessorKey: 'ac',
      header: 'AC',
      size: 75,
      meta: { align: 'right' },
      cell: ({ row }) => (
        <span className="font-mono tabular-nums text-xs text-foreground">
          {formatNumber(row.original.ac, 0)}
        </span>
      ),
    },
    {
      accessorKey: 'cv',
      header: 'CV',
      size: 80,
      meta: { align: 'right' },
      cell: ({ row }) => {
        const v = row.original.cv
        return (
          <span className={`font-mono tabular-nums text-xs font-semibold ${v >= 0 ? 'text-success' : 'text-destructive'}`}>
            {formatNumber(v, 0)}
          </span>
        )
      },
    },
    {
      accessorKey: 'sv',
      header: 'SV',
      size: 80,
      meta: { align: 'right' },
      cell: ({ row }) => {
        const v = row.original.sv
        return (
          <span className={`font-mono tabular-nums text-xs font-semibold ${v >= 0 ? 'text-success' : 'text-destructive'}`}>
            {formatNumber(v, 0)}
          </span>
        )
      },
    },
    {
      accessorKey: 'cpi',
      header: 'CPI',
      size: 80,
      meta: { align: 'center' },
      cell: ({ row }) => {
        const v = row.original.cpi
        return (
          <Badge variant={getIndexVariant(v)} className="font-mono text-[10px]">
            {formatNumber(v, 2)}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'spi',
      header: 'SPI',
      size: 80,
      meta: { align: 'center' },
      cell: ({ row }) => {
        const v = row.original.spi
        return (
          <Badge variant={getIndexVariant(v)} className="font-mono text-[10px]">
            {formatNumber(v, 2)}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'eac',
      header: 'EAC',
      size: 80,
      meta: { align: 'right' },
      cell: ({ row }) => (
        <span className="font-mono tabular-nums text-xs font-semibold text-foreground">
          {formatNumber(row.original.eac, 0)}
        </span>
      ),
    },
  ], [])

  // Chargement initial
  if (evmLoading && !evm) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border bg-card">
        <div>
          <PageHeader title="Valeur Acquise — EVM" description="
            Analyse des coûts et délais : PV, EV, AC, CPI, SPI, EAC
          " />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-muted/30 border border-border rounded-md px-3 py-1.5">
            <Calendar size={14} className="text-muted-foreground shrink-0" />
            <Input
              type="date"
              value={dateControle}
              onChange={e => setDateControle(e.target.value)}
              className="h-6 border-0 bg-transparent p-0 text-xs focus-visible:ring-0 focus-visible:ring-offset-0 w-32"
              title="Date de contrôle"
              aria-label="Date de contrôle EVM"
            />
          </div>
          <Button
            variant="default"
            size="sm"
            leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
            onClick={() => refetch()}
            disabled={isRefreshing}
            aria-label="Recalculer les indicateurs EVM"
            className="h-8 text-xs"
          >
            Recalculer
          </Button>
        </div>
      </div>

      {/* ── KPI STRIP — 7 indicateurs ──────────────────────────────────────── */}
      <div className="shrink-0 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 px-4 py-3 border-b border-border bg-muted/10">
        <StatCard title="BAC"  value={fmt(bac)} icon={<Database  className="h-4 w-4" />} iconVariant="primary"     description="Budget à l'achèvement" />
        <StatCard title="PV"   value={fmt(pv)}  icon={<Calendar  className="h-4 w-4" />} iconVariant="default"     description="Valeur planifiée" />
        <StatCard title="EV"   value={fmt(ev)}  icon={<TrendingUp className="h-4 w-4" />} iconVariant="success"    description="Valeur acquise" />
        <StatCard title="AC"   value={fmt(ac)}  icon={<DollarSign className="h-4 w-4" />} iconVariant="warning"   description="Coût réel" />
        <StatCard
          title="CPI"
          value={formatNumber(cpi, 2)}
          icon={<IndexBadgeIcon v={cpi} />}
          iconVariant={getIndexVariant(cpi)}
          description="Indice de performance coût"
        />
        <StatCard
          title="SPI"
          value={formatNumber(spi, 2)}
          icon={<IndexBadgeIcon v={spi} />}
          iconVariant={getIndexVariant(spi)}
          description="Indice de performance délai"
        />
        <StatCard
          title="EAC"
          value={fmt(eac)}
          icon={<Target className="h-4 w-4" />}
          iconVariant={eac > bac ? 'destructive' : 'success'}
          description="Estimation à l'achèvement"
        />
      </div>

      {/* ── CONTENU PRINCIPAL ──────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="p-4 flex flex-col gap-4">

          {/* Courbe en S + Lecture rapide */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Courbe en S */}
            <div className="bg-card border border-border rounded-lg p-5">
              <h2 className="text-sm font-semibold text-foreground mb-4">
                Courbe en S — PV / EV / AC
              </h2>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={sCurveData} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="mois"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 600]}
                    ticks={[0, 100, 200, 300, 400, 500, 600]}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  <Line type="monotone" dataKey="pv" name="PV" stroke={C.pv} strokeWidth={2.5}
                    dot={{ r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="ev" name="EV" stroke={C.ev} strokeWidth={2.5}
                    dot={{ r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="ac" name="AC" stroke={C.ac} strokeWidth={2.5}
                    dot={{ r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Lecture rapide */}
            <div className="bg-card border border-border rounded-lg p-5 flex flex-col gap-4">
              <h2 className="text-sm font-semibold text-foreground">Lecture rapide</h2>

              <EvmIndexCard
                label="CPI"
                value={cpi}
                message={cpi < 1
                  ? 'Surcoût probable — renforcer le contrôle financier.'
                  : 'Coûts maîtrisés — performance conforme au budget.'}
              />

              <EvmIndexCard
                label="SPI"
                value={spi}
                message={spi < 1
                  ? 'Retard critique — arbitrage comité de pilotage.'
                  : 'Planning respecté — progression conforme au calendrier.'}
              />

              {/* Légende sémantique */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <Badge variant="success"   className="text-[10px]">≥ 1 — Conforme</Badge>
                <Badge variant="warning"   className="text-[10px]">0.90–0.99 — À surveiller</Badge>
                <Badge variant="destructive" className="text-[10px]">&lt; 0.90 — Critique</Badge>
              </div>
            </div>
          </div>

          {/* Tableau EVM par tâche */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border bg-muted/5 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Analyse EVM par Tâche</h2>
                <p className="text-xs text-muted-foreground">Colonnes calculées automatiquement — non éditables</p>
              </div>
              {tasks.length === 0 && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Saisir les tâches dans la Saisie POA
                </div>
              )}
            </div>
            <DataTable columns={taskColumns} data={tasks} />
          </div>

          {/* Alerte sur EAC */}
          {eac > bac && (
            <div className="flex items-start gap-3 bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h4 className="text-sm font-semibold text-destructive">
                  EAC &gt; BAC — Dépassement budgétaire probable
                </h4>
                <p className="text-sm text-muted-foreground mt-0.5">
                  L'estimation à l'achèvement ({fmt(eac)}) dépasse le budget initial ({fmt(bac)}).
                  Un plan de redressement est recommandé.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  )
}
