import { PageHeader } from '@/components/layout/PageHeader'
import { useState, useMemo, useCallback } from 'react'
import type { ReactNode } from 'react'
import * as XLSX from 'xlsx'
import { useParams } from 'react-router-dom'
import {
  Calendar, RefreshCw, TrendingUp, TrendingDown, Minus,
  Database, DollarSign, Target, AlertCircle, Download,
  Plus, List, MessageSquare, History, BarChart2,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { ColumnDef } from '@tanstack/react-table'
import { useEvm, useEvmTasks, useEvmTrend } from '@/hooks/useEvm'
import { formatNumber } from '@/lib/utils'
import type { EvmTache, EvmPeriode } from '@/types'
import { StatCard } from '@/components/ui/data-display/StatCard'
import { Badge } from '@/components/ui/data-display/Badge'
import { ProgressBar } from '@/components/ui/data-display/ProgressBar'
import { Button } from '@/components/ui/forms/Button'
import { DataTable } from '@/components/ui/data-table/DataTable'
import { EvmIndexCard } from '@/components/project/evm/EvmIndexCard'
import { EvmSaisieSlideOver } from '@/components/project/evm/EvmSaisieSlideOver'

// ─── Pure EVM computation engine ─────────────────────────────────────────────

const MOIS_FR = ['Jan.','Fév.','Mar.','Avr.','Mai','Juin','Juil.','Août','Sep.','Oct.','Nov.','Déc.']

function labelFromDate(dateControle: string): string {
  const [year, month] = dateControle.split('-')
  return `${MOIS_FR[parseInt(month) - 1]} ${year}`
}

function calcEvm(
  id: string, dateControle: string, bac: number, pv: number,
  ev: number, ac: number, commentaire: string
): EvmPeriode {
  const cv           = ev - ac
  const sv           = ev - pv
  const cvPct        = ev > 0   ? Math.round((cv / ev) * 100)            : 0
  const svPct        = pv > 0   ? Math.round((sv / pv) * 100)            : 0
  const cpi          = ac > 0   ? ev / ac                                 : 1
  const spi          = pv > 0   ? ev / pv                                 : 1
  const eac_cpi      = cpi > 0  ? bac / cpi                               : bac
  const eac_budget   = ac + (bac - ev)
  const eac_composite = (cpi > 0 && spi > 0) ? ac + (bac - ev) / (cpi * spi) : eac_budget
  const eac          = eac_cpi
  const etc          = eac - ac
  const vac          = bac - eac
  const tcpi         = (eac - ac) > 0 ? (bac - ev) / (eac - ac)          : 1
  const pctComplete  = bac > 0  ? Math.round((ev / bac) * 100)            : 0
  return {
    id, label: labelFromDate(dateControle), dateControle, bac, pv, ev, ac,
    cv, sv, cvPct, svPct, cpi, spi,
    eac, eac_cpi, eac_budget, eac_composite,
    etc, vac, tcpi, pctComplete, commentaire,
  }
}

// ─── Initial mock periods (6 months, realistic degradation) ──────────────────

const INIT_PERIODES: EvmPeriode[] = [
  calcEvm('p-2026-01', '2026-01', 500000,  60000,  50000,  55000, 'Démarrage. Mise en place des équipes. Légères avances de dépenses.'),
  calcEvm('p-2026-02', '2026-02', 500000, 120000, 100000, 112000, 'Recrutement finalisé. Infrastructure en cours d\'acquisition.'),
  calcEvm('p-2026-03', '2026-03', 500000, 190000, 155000, 172000, 'ACT-004 accuse 3 semaines de retard. Plan de rattrapage initié.'),
  calcEvm('p-2026-04', '2026-04', 500000, 250000, 200000, 220000, 'CPI en légère amélioration (0.91). SPI persistant sous 0.85. COPIL le 28/04.'),
  calcEvm('p-2026-05', '2026-05', 500000, 300000, 240000, 265000, 'CPI 0.91, SPI 0.80. EAC₁ estimé à 550k. Bailleur informé.'),
  calcEvm('p-2026-06', '2026-06', 500000, 340000, 270000, 297000, 'CPI stable à 0.91. SPI 0.79. Discussions pour extension de délai de 2 mois.'),
]

// ─── Mock tasks (offline fallback) ───────────────────────────────────────────

const MOCK_EVM_TASKS: EvmTache[] = [
  {
    tache_id: 'evm-t1', code_tache: 'ACT-001', description: 'Étude et conception du système', wbs: '1.1',
    statut: 'TERMINE', avancement: 100,
    bac: 50000, pv: 50000, ev: 50000, ac: 48000, cv: 2000, sv: 0, cpi: 1.04, spi: 1.00, eac: 48000,
    statut_cpi: 'VERT', statut_spi: 'VERT',
  },
  {
    tache_id: 'evm-t2', code_tache: 'ACT-002', description: 'Développement infrastructure réseau', wbs: '1.2',
    statut: 'EN_COURS', avancement: 75,
    bac: 80000, pv: 70000, ev: 60000, ac: 68000, cv: -8000, sv: -10000, cpi: 0.88, spi: 0.86, eac: 90909,
    statut_cpi: 'ROUGE', statut_spi: 'ROUGE',
  },
  {
    tache_id: 'evm-t3', code_tache: 'ACT-003', description: 'Formation des utilisateurs clés', wbs: '2.1',
    statut: 'A_FAIRE', avancement: 0,
    bac: 30000, pv: 0, ev: 0, ac: 0, cv: 0, sv: 0, cpi: 1.00, spi: 1.00, eac: 30000,
    statut_cpi: 'VERT', statut_spi: 'VERT',
  },
  {
    tache_id: 'evm-t4', code_tache: 'ACT-004', description: 'Déploiement et mise en production', wbs: '2.2',
    statut: 'EN_COURS', avancement: 45,
    bac: 120000, pv: 80000, ev: 54000, ac: 60000, cv: -6000, sv: -26000, cpi: 0.90, spi: 0.68, eac: 133333,
    statut_cpi: 'ORANGE', statut_spi: 'ROUGE',
  },
  {
    tache_id: 'evm-t5', code_tache: 'ACT-005', description: 'Supervision et contrôle qualité', wbs: '3.1',
    statut: 'EN_COURS', avancement: 60,
    bac: 40000, pv: 30000, ev: 24000, ac: 25000, cv: -1000, sv: -6000, cpi: 0.96, spi: 0.80, eac: 41667,
    statut_cpi: 'VERT', statut_spi: 'ORANGE',
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

type IndexVariant = 'success' | 'warning' | 'destructive'

function getIndexVariant(v: number): IndexVariant {
  if (v >= 1)   return 'success'
  if (v >= 0.9) return 'warning'
  return 'destructive'
}

function IndexBadgeIcon({ v }: { v: number }) {
  if (v >= 1)   return <TrendingUp  size={14} className="text-success" />
  if (v >= 0.9) return <Minus       size={14} className="text-warning" />
  return              <TrendingDown size={14} className="text-destructive" />
}

const C = {
  pv:  'hsl(var(--muted-foreground))',
  ev:  'hsl(var(--primary))',
  ac:  'hsl(var(--warning))',
  eac: 'hsl(var(--destructive))',
} as const

interface TooltipEntry { name: string; value: number; color: string }

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-lg px-3.5 py-2.5 shadow-sm text-xs">
      <p className="text-muted-foreground font-semibold mb-2">{label}</p>
      {payload.map(p => (
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

function fmt(n: number): string {
  return n >= 1000 ? `${Math.round(n / 1000)}k` : String(Math.round(n))
}

// ─── FormState type (aligned with EvmSaisieSlideOver) ────────────────────────

interface FormState {
  dateControle: string; bac: string; pv: string; ev: string; ac: string; commentaire: string;
}

// ─── Tab type ─────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'history' | 'analysis' | 'tasks'

const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
  { id: 'overview',  label: 'Vue d\'ensemble', icon: <BarChart2 size={13} /> },
  { id: 'history',   label: 'Historique',      icon: <History   size={13} /> },
  { id: 'analysis',  label: 'Analyse variance',icon: <MessageSquare size={13} /> },
  { id: 'tasks',     label: 'Tâches EVM',      icon: <List      size={13} /> },
]

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function MoteurEVMPage() {
  const { id: projectId = '' } = useParams()

  // ── API (online mode) ──────────────────────────────────────────────────────
  const { data: evmApi,    refetch } = useEvm(projectId, undefined)
  const { data: evmTasks, isLoading: tasksLoading } = useEvmTasks(projectId, undefined)
  const { data: trendData } = useEvmTrend(projectId)

  // ── Local EVM periods state (offline / demo) ───────────────────────────────
  const [periodes, setPeriodes] = useState<EvmPeriode[]>(INIT_PERIODES)
  const [activePeriodeId, setActivePeriodeId] = useState<string>(INIT_PERIODES[INIT_PERIODES.length - 1].id)

  // ── SlideOver state ────────────────────────────────────────────────────────
  const [slideOpen, setSlideOpen]   = useState(false)
  const [slideMode, setSlideMode]   = useState<'new' | 'edit' | 'view'>('new')
  const [slidePeriode, setSlidePeriode] = useState<EvmPeriode | null>(null)

  // ── Tabs ───────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  // ── Task filter ────────────────────────────────────────────────────────────
  const [taskFilter, setTaskFilter] = useState<'ALL' | 'ROUGE' | 'ORANGE'>('ALL')

  // ── Computed active period ─────────────────────────────────────────────────
  const activePeriode = useMemo(
    () => periodes.find(p => p.id === activePeriodeId) ?? periodes[periodes.length - 1],
    [periodes, activePeriodeId]
  )

  // If API data available, override with live values
  const bac = evmApi?.bac ?? activePeriode.bac
  const pv  = evmApi?.pv  ?? activePeriode.pv
  const ev  = evmApi?.ev  ?? activePeriode.ev
  const ac  = evmApi?.ac  ?? activePeriode.ac
  const cpi = evmApi?.cpi ?? activePeriode.cpi
  const spi = evmApi?.spi ?? activePeriode.spi
  const eac = evmApi?.eac ?? activePeriode.eac

  // ── S-Curve ────────────────────────────────────────────────────────────────
  const sCurveData = useMemo(() => {
    if (trendData?.evolution_mensuelle?.length) {
      return trendData.evolution_mensuelle.map(m => ({
        mois: m.mois.replace(/^\d{4}-/, '').replace(/^0/, ''),
        pv: Math.round(m.pv / 1000),
        ev: Math.round(m.ev / 1000),
        ac: Math.round(m.ac / 1000),
        eac: Math.round(eac / 1000),
      }))
    }
    return periodes.map(p => ({
      mois: p.label,
      pv: Math.round(p.pv / 1000),
      ev: Math.round(p.ev / 1000),
      ac: Math.round(p.ac / 1000),
      eac: Math.round(p.eac / 1000),
    }))
  }, [trendData, periodes, eac])

  // ── Tâches ─────────────────────────────────────────────────────────────────
  const allTasks: EvmTache[] = evmTasks?.length ? evmTasks : MOCK_EVM_TASKS

  const filteredTasks = useMemo(() => {
    if (taskFilter === 'ALL') return allTasks
    return allTasks.filter(t => t.statut_cpi === taskFilter || t.statut_spi === taskFilter)
  }, [allTasks, taskFilter])

  // ── Date forecast ──────────────────────────────────────────────────────────
  const dateForecast = useMemo(() => {
    const PLANNED_MONTHS = 12
    const elapsed = periodes.length
    const remainingPlanned = PLANNED_MONTHS - elapsed
    if (spi <= 0) return null
    const remainingActual = remainingPlanned / spi
    const totalMonths = elapsed + remainingActual
    const startDate = new Date(periodes[0].dateControle + '-01')
    const endDate = new Date(startDate)
    endDate.setMonth(endDate.getMonth() + Math.round(totalMonths))
    return endDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  }, [periodes, spi])

  // ── CRUD handlers ──────────────────────────────────────────────────────────
  const openNew = useCallback(() => {
    setSlideMode('new')
    setSlidePeriode(null)
    setSlideOpen(true)
  }, [])

  const openEdit = useCallback((p: EvmPeriode) => {
    setSlideMode('edit')
    setSlidePeriode(p)
    setSlideOpen(true)
  }, [])

  const openView = useCallback((p: EvmPeriode) => {
    setSlideMode('view')
    setSlidePeriode(p)
    setSlideOpen(true)
  }, [])

  const handleSavePeriode = useCallback((form: FormState) => {
    const b = parseFloat(form.bac)
    const p = parseFloat(form.pv)
    const e = parseFloat(form.ev)
    const a = parseFloat(form.ac)
    const id = slideMode === 'new'
      ? `p-${form.dateControle}-${Date.now()}`
      : (slidePeriode?.id ?? `p-${form.dateControle}`)
    const newPeriode = calcEvm(id, form.dateControle, b, p, e, a, form.commentaire)
    setPeriodes(prev => {
      if (slideMode === 'new') {
        return [...prev, newPeriode].sort((a, b) => a.dateControle.localeCompare(b.dateControle))
      }
      return prev.map(x => x.id === id ? newPeriode : x)
    })
    setActivePeriodeId(id)
  }, [slideMode, slidePeriode])

  const handleDeletePeriode = useCallback((id: string) => {
    setPeriodes(prev => {
      const updated = prev.filter(p => p.id !== id)
      if (activePeriodeId === id && updated.length) {
        setActivePeriodeId(updated[updated.length - 1].id)
      }
      return updated
    })
  }, [activePeriodeId])

  // ── Export CSV (périodes + tâches en deux fichiers) ────────────────────────
  function exportCsv(rows: (string | number)[][], filename: string) {
    const content = '﻿' + rows
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';'))
      .join('\n')
    const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8;' }))
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleExportCsvHistory() {
    const headers = ['Période','Date','BAC','PV','EV','AC','CV','SV','CV%','SV%','CPI','SPI','EAC₁','EAC₂','EAC₄','ETC','VAC','TCPI','% Fait','Commentaire']
    const rows = periodes.map(p => [
      p.label, p.dateControle, p.bac, p.pv, p.ev, p.ac,
      p.cv, p.sv, `${p.cvPct}%`, `${p.svPct}%`,
      p.cpi.toFixed(2), p.spi.toFixed(2),
      Math.round(p.eac_cpi), Math.round(p.eac_budget), Math.round(p.eac_composite),
      Math.round(p.etc), Math.round(p.vac), p.tcpi.toFixed(2),
      `${p.pctComplete}%`, p.commentaire,
    ])
    exportCsv([headers, ...rows], `evm-historique-${projectId || 'projet'}-${new Date().toISOString().slice(0, 10)}.csv`)
  }

  function handleExportCsvTasks() {
    const headers = ['Code','Description','WBS','Avancement','BAC','PV','EV','AC','CV','SV','CPI','SPI','EAC','Statut CPI','Statut SPI']
    const rows = filteredTasks.map(t => [
      t.code_tache, t.description, t.wbs ?? '', `${t.avancement}%`,
      t.bac, t.pv, t.ev, t.ac, t.cv, t.sv,
      t.cpi.toFixed(2), t.spi.toFixed(2), Math.round(t.eac),
      t.statut_cpi, t.statut_spi,
    ])
    exportCsv([headers, ...rows], `evm-taches-${projectId || 'projet'}-${new Date().toISOString().slice(0, 10)}.csv`)
  }

  // ── Export XLSX ─────────────────────────────────────────────────────────────
  function handleExportXlsx() {
    const KPI_H = ['Indicateur', 'Valeur']
    const kpiRows = [
      ['BAC', fmt(bac)], ['PV', fmt(pv)], ['EV', fmt(ev)], ['AC', fmt(ac)],
      ['CV (EV−AC)', fmt(activePeriode.cv)], ['SV (EV−PV)', fmt(activePeriode.sv)],
      ['CV%', `${activePeriode.cvPct}%`], ['SV%', `${activePeriode.svPct}%`],
      ['CPI', cpi.toFixed(2)], ['SPI', spi.toFixed(2)],
      ['EAC₁ (BAC/CPI)', fmt(activePeriode.eac_cpi)],
      ['EAC₂ (AC+BAC−EV)', fmt(activePeriode.eac_budget)],
      ['EAC₄ (composite)', fmt(activePeriode.eac_composite)],
      ['ETC', fmt(activePeriode.etc)], ['VAC', fmt(activePeriode.vac)],
      ['TCPI', activePeriode.tcpi.toFixed(2)],
      ['% Complété', `${activePeriode.pctComplete}%`],
    ]
    const wsKpi = XLSX.utils.aoa_to_sheet([KPI_H, ...kpiRows])
    wsKpi['!cols'] = [{ wch: 26 }, { wch: 14 }]

    const HIST_H = ['Période', 'BAC', 'PV', 'EV', 'AC', 'CV', 'SV', 'CV%', 'SV%', 'CPI', 'SPI', 'EAC₁', 'EAC₂', 'EAC₄', 'TCPI', '% Fait', 'Commentaire']
    const histRows = periodes.map(p => [
      p.label, p.bac, p.pv, p.ev, p.ac, p.cv, p.sv, `${p.cvPct}%`, `${p.svPct}%`,
      p.cpi.toFixed(2), p.spi.toFixed(2),
      Math.round(p.eac_cpi), Math.round(p.eac_budget), Math.round(p.eac_composite),
      p.tcpi.toFixed(2), `${p.pctComplete}%`, p.commentaire,
    ])
    const wsHist = XLSX.utils.aoa_to_sheet([HIST_H, ...histRows])
    wsHist['!cols'] = [{ wch: 12 }, ...Array(15).fill({ wch: 10 }), { wch: 50 }]

    const TASK_H = ['Code', 'Description', 'WBS', 'Avancement', 'BAC', 'PV', 'EV', 'AC', 'CV', 'SV', 'CPI', 'SPI', 'EAC', 'CPI Statut', 'SPI Statut']
    const taskRows = allTasks.map(t => [
      t.code_tache, t.description, t.wbs ?? '', `${t.avancement}%`,
      t.bac, t.pv, t.ev, t.ac, t.cv, t.sv,
      t.cpi.toFixed(2), t.spi.toFixed(2), Math.round(t.eac),
      t.statut_cpi, t.statut_spi,
    ])
    const wsTasks = XLSX.utils.aoa_to_sheet([TASK_H, ...taskRows])
    wsTasks['!cols'] = [{ wch: 10 }, { wch: 36 }, { wch: 8 }, { wch: 10 }, ...Array(11).fill({ wch: 10 })]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, wsKpi,   'KPIs')
    XLSX.utils.book_append_sheet(wb, wsHist,  'Historique')
    XLSX.utils.book_append_sheet(wb, wsTasks, 'Tâches')
    XLSX.writeFile(wb, `evm-${projectId || 'projet'}-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  // ── Task DataTable columns ──────────────────────────────────────────────────
  const taskColumns = useMemo<ColumnDef<EvmTache, unknown>[]>(() => [
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
      size: 70,
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.wbs ?? '—'}</span>,
    },
    {
      accessorKey: 'avancement',
      header: 'AVANC.',
      size: 120,
      meta: { align: 'center' } as Record<string, unknown>,
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
      meta: { align: 'right' } as Record<string, unknown>,
      cell: ({ row }) => (
        <span className="font-mono tabular-nums text-xs">{formatNumber(row.original.bac, 0)}</span>
      ),
    },
    {
      accessorKey: 'ev',
      header: 'EV',
      size: 75,
      meta: { align: 'right' } as Record<string, unknown>,
      cell: ({ row }) => (
        <span className="font-mono tabular-nums text-xs">{formatNumber(row.original.ev, 0)}</span>
      ),
    },
    {
      accessorKey: 'ac',
      header: 'AC',
      size: 75,
      meta: { align: 'right' } as Record<string, unknown>,
      cell: ({ row }) => (
        <span className="font-mono tabular-nums text-xs">{formatNumber(row.original.ac, 0)}</span>
      ),
    },
    {
      accessorKey: 'cv',
      header: 'CV',
      size: 80,
      meta: { align: 'right' } as Record<string, unknown>,
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
      meta: { align: 'right' } as Record<string, unknown>,
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
      meta: { align: 'center' } as Record<string, unknown>,
      cell: ({ row }) => (
        <Badge variant={getIndexVariant(row.original.cpi)} className="font-mono text-[10px]">
          {formatNumber(row.original.cpi, 2)}
        </Badge>
      ),
    },
    {
      accessorKey: 'spi',
      header: 'SPI',
      size: 80,
      meta: { align: 'center' } as Record<string, unknown>,
      cell: ({ row }) => (
        <Badge variant={getIndexVariant(row.original.spi)} className="font-mono text-[10px]">
          {formatNumber(row.original.spi, 2)}
        </Badge>
      ),
    },
    {
      accessorKey: 'eac',
      header: 'EAC',
      size: 80,
      meta: { align: 'right' } as Record<string, unknown>,
      cell: ({ row }) => (
        <span className="font-mono tabular-nums text-xs font-semibold">
          {formatNumber(row.original.eac, 0)}
        </span>
      ),
    },
  ], [])

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border bg-card">
        <PageHeader title="Valeur Acquise — EVM" description="Analyse de la performance coût et délai par période" />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}
            onClick={handleExportCsvHistory} className="h-8 text-xs">
            CSV Périodes
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}
            onClick={handleExportXlsx} className="h-8 text-xs">
            Excel
          </Button>
          <Button variant="outline" size="sm"
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
            onClick={() => refetch()}
            className="h-8 text-xs">
            Recalculer
          </Button>
          <Button variant="default" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />}
            onClick={openNew} className="h-8 text-xs">
            Nouvelle saisie
          </Button>
        </div>
      </div>

      {/* ── KPI STRIP ──────────────────────────────────────────────────────── */}
      <div className="shrink-0 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 px-4 py-3 border-b border-border bg-muted/10">
        <StatCard title="BAC"    value={fmt(bac)}  icon={<Database   className="h-4 w-4" />} iconVariant="primary"     description="Budget achèvement" />
        <StatCard title="PV"     value={fmt(pv)}   icon={<Calendar   className="h-4 w-4" />} iconVariant="default"     description="Valeur planifiée" />
        <StatCard title="EV"     value={fmt(ev)}   icon={<TrendingUp className="h-4 w-4" />} iconVariant="success"     description="Valeur acquise" />
        <StatCard title="AC"     value={fmt(ac)}   icon={<DollarSign className="h-4 w-4" />} iconVariant="warning"     description="Coût réel" />
        <StatCard
          title="CPI"
          value={cpi.toFixed(2)}
          icon={<IndexBadgeIcon v={cpi} />}
          iconVariant={getIndexVariant(cpi)}
          description="Indice coût"
        />
        <StatCard
          title="SPI"
          value={spi.toFixed(2)}
          icon={<IndexBadgeIcon v={spi} />}
          iconVariant={getIndexVariant(spi)}
          description="Indice délai"
        />
        <StatCard
          title="EAC"
          value={fmt(eac)}
          icon={<Target className="h-4 w-4" />}
          iconVariant={eac > bac ? 'destructive' : 'success'}
          description="Estimation achèvement"
        />
        <StatCard
          title="% Fait"
          value={`${activePeriode.pctComplete}%`}
          icon={<BarChart2 className="h-4 w-4" />}
          iconVariant="info"
          description="EV / BAC"
        />
      </div>

      {/* ── TABS ───────────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center gap-0 px-4 border-b border-border bg-card">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold transition-colors border-b-2 -mb-px ${
              activeTab === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ── CONTENT ────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="p-4">

          {/* ════ TAB: VUE D'ENSEMBLE ══════════════════════════════════════ */}
          {activeTab === 'overview' && (
            <div className="flex flex-col gap-4">

              {/* S-curve + Lecture rapide */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* Courbe en S avec ligne EAC */}
                <div className="bg-card border border-border rounded-lg p-5">
                  <h2 className="text-sm font-semibold text-foreground mb-4">
                    Courbe en S — PV / EV / AC + EAC projeté
                  </h2>
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={sCurveData} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="mois" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                      <ReferenceLine
                        y={Math.round(bac / 1000)}
                        stroke="hsl(var(--success))"
                        strokeDasharray="4 2"
                        label={{ value: 'BAC', fill: 'hsl(var(--success))', fontSize: 10, position: 'right' }}
                      />
                      <Line type="monotone" dataKey="pv"  name="PV (planifié)" stroke={C.pv} strokeWidth={2}
                        strokeDasharray="4 2" dot={{ r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                      <Line type="monotone" dataKey="ev"  name="EV (acquis)"   stroke={C.ev} strokeWidth={2.5}
                        dot={{ r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                      <Line type="monotone" dataKey="ac"  name="AC (réel)"     stroke={C.ac} strokeWidth={2.5}
                        dot={{ r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                      <Line type="monotone" dataKey="eac" name="EAC (projeté)" stroke={C.eac} strokeWidth={1.5}
                        strokeDasharray="3 3" dot={false} activeDot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Lecture rapide */}
                <div className="bg-card border border-border rounded-lg p-5 flex flex-col gap-4">
                  <h2 className="text-sm font-semibold text-foreground">Lecture rapide</h2>
                  <EvmIndexCard label="CPI" value={cpi}
                    message={cpi < 1
                      ? `Surcoût probable — chaque FCFA engagé ne produit que ${cpi.toFixed(2)} FCFA de valeur.`
                      : 'Coûts maîtrisés — performance conforme au budget.'} />
                  <EvmIndexCard label="SPI" value={spi}
                    message={spi < 1
                      ? `Retard critique — progression à ${(spi * 100).toFixed(0)}% du rythme prévu.`
                      : 'Planning respecté — progression conforme au calendrier.'} />
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <Badge variant="success"     className="text-[10px]">≥ 1.00 — Conforme</Badge>
                    <Badge variant="warning"     className="text-[10px]">0.90–0.99 — À surveiller</Badge>
                    <Badge variant="destructive" className="text-[10px]">&lt; 0.90 — Critique</Badge>
                  </div>
                  {dateForecast && (
                    <div className="mt-auto pt-2 border-t border-border">
                      <p className="text-[11px] text-muted-foreground">Fin prévisionnelle (au rythme SPI actuel)</p>
                      <p className={`text-sm font-bold mt-0.5 ${spi < 1 ? 'text-destructive' : 'text-success'}`}>
                        {dateForecast}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 4 méthodes EAC (PMBOK) */}
              <div className="bg-card border border-border rounded-lg p-5">
                <h2 className="text-sm font-semibold text-foreground mb-3">
                  Estimation à l'achèvement — 4 méthodes PMBOK (§7.4.2)
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                  {[
                    { label: 'EAC₁ — Coût/CPI', formula: 'BAC / CPI', value: activePeriode.eac_cpi,
                      note: 'Performance passée projetée jusqu\'à l\'achèvement' },
                    { label: 'EAC₂ — Budget restant', formula: 'AC + (BAC − EV)', value: activePeriode.eac_budget,
                      note: 'Reste du travail au taux budgété d\'origine' },
                    { label: 'EAC₃ — Coût restant/CPI', formula: 'AC + (BAC−EV)/CPI', value: activePeriode.eac_cpi,
                      note: 'Reste au rythme de performance coût actuel' },
                    { label: 'EAC₄ — Composite CPI×SPI', formula: 'AC + (BAC−EV)/(CPI×SPI)', value: activePeriode.eac_composite,
                      note: 'Intègre performance coût ET délai (méthode BAD/BM)' },
                  ].map(m => (
                    <div key={m.label} className={`rounded-lg border px-4 py-3 ${m.value > bac ? 'border-destructive/30 bg-destructive/5' : 'border-border bg-muted/20'}`}>
                      <p className="text-[11px] font-semibold text-foreground mb-0.5">{m.label}</p>
                      <p className="font-mono text-[10px] text-muted-foreground mb-2">{m.formula}</p>
                      <p className={`font-mono text-lg font-extrabold tabular-nums ${m.value > bac ? 'text-destructive' : 'text-success'}`}>
                        {fmt(m.value)}
                      </p>
                      {m.value > bac && (
                        <Badge variant="destructive" className="text-[10px] mt-1">+{fmt(m.value - bac)} vs BAC</Badge>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-2 leading-tight">{m.note}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Indicateurs dérivés */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'CV (Écart coût)', value: fmt(activePeriode.cv), suffix: '', isNeg: activePeriode.cv < 0, note: 'EV − AC' },
                  { label: 'CV %', value: `${activePeriode.cvPct > 0 ? '+' : ''}${activePeriode.cvPct}%`, suffix: '', isNeg: activePeriode.cvPct < 0, note: 'CV / EV' },
                  { label: 'SV (Écart délai)', value: fmt(activePeriode.sv), suffix: '', isNeg: activePeriode.sv < 0, note: 'EV − PV' },
                  { label: 'SV %', value: `${activePeriode.svPct > 0 ? '+' : ''}${activePeriode.svPct}%`, suffix: '', isNeg: activePeriode.svPct < 0, note: 'SV / PV' },
                  { label: 'ETC (Reste à faire)', value: fmt(activePeriode.etc), suffix: '', isNeg: false, note: 'EAC − AC' },
                  { label: 'VAC (Variation finale)', value: fmt(activePeriode.vac), suffix: '', isNeg: activePeriode.vac < 0, note: 'BAC − EAC' },
                  { label: 'TCPI', value: activePeriode.tcpi.toFixed(2), suffix: '', isNeg: activePeriode.tcpi > 1.1, note: activePeriode.tcpi <= 1 ? 'Objectif atteignable' : activePeriode.tcpi <= 1.1 ? 'Objectif difficile' : 'Objectif irréaliste' },
                  { label: '% Complété', value: `${activePeriode.pctComplete}%`, suffix: '', isNeg: false, note: 'EV / BAC' },
                ].map(r => (
                  <div key={r.label} className="bg-card border border-border rounded-lg px-4 py-3">
                    <p className="text-[11px] text-muted-foreground mb-0.5">{r.label}</p>
                    <p className={`font-mono text-base font-bold tabular-nums ${r.isNeg ? 'text-destructive' : 'text-foreground'}`}>
                      {r.value}{r.suffix}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{r.note}</p>
                  </div>
                ))}
              </div>

              {/* Alertes */}
              {eac > bac && (
                <div className="flex items-start gap-3 bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-destructive">EAC &gt; BAC — Dépassement budgétaire probable</h4>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      EAC₁ estimé à <strong>{fmt(activePeriode.eac_cpi)}</strong> vs BAC <strong>{fmt(bac)}</strong>
                      {' '}(+<strong>{fmt(activePeriode.eac_cpi - bac)}</strong>).
                      Un plan de redressement ou une révision budgétaire est recommandé(e).
                    </p>
                  </div>
                </div>
              )}
              {spi < 0.85 && (
                <div className="flex items-start gap-3 bg-warning/10 border border-warning/20 rounded-lg p-4">
                  <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-warning">SPI &lt; 0.85 — Risque calendrier critique</h4>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Le projet progresse à <strong>{(spi * 100).toFixed(0)}%</strong> du rythme planifié.
                      Une révision du planning ou une mobilisation de ressources supplémentaires est recommandée.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════ TAB: HISTORIQUE ══════════════════════════════════════════ */}
          {activeTab === 'history' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">
                  {periodes.length} période{periodes.length > 1 ? 's' : ''} enregistrée{periodes.length > 1 ? 's' : ''}
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}
                    onClick={handleExportCsvHistory} className="h-8 text-xs">
                    CSV
                  </Button>
                  <Button variant="default" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />}
                    onClick={openNew} className="h-8 text-xs">
                    Nouvelle saisie
                  </Button>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/20">
                      {['Période','BAC','PV','EV','AC','CV%','SV%','CPI','SPI','EAC₁','% Fait',''].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {periodes.map(p => (
                      <tr
                        key={p.id}
                        className={`border-b border-border/50 last:border-0 transition-colors cursor-pointer hover:bg-muted/10 ${
                          p.id === activePeriodeId ? 'bg-primary/5' : ''
                        }`}
                        onClick={() => { setActivePeriodeId(p.id); openView(p) }}
                      >
                        <td className="px-3 py-2.5 font-semibold text-foreground whitespace-nowrap">{p.label}</td>
                        <td className="px-3 py-2.5 font-mono tabular-nums">{fmt(p.bac)}</td>
                        <td className="px-3 py-2.5 font-mono tabular-nums">{fmt(p.pv)}</td>
                        <td className="px-3 py-2.5 font-mono tabular-nums">{fmt(p.ev)}</td>
                        <td className="px-3 py-2.5 font-mono tabular-nums">{fmt(p.ac)}</td>
                        <td className={`px-3 py-2.5 font-mono tabular-nums font-semibold ${p.cvPct < 0 ? 'text-destructive' : 'text-success'}`}>
                          {p.cvPct > 0 ? '+' : ''}{p.cvPct}%
                        </td>
                        <td className={`px-3 py-2.5 font-mono tabular-nums font-semibold ${p.svPct < 0 ? 'text-destructive' : 'text-success'}`}>
                          {p.svPct > 0 ? '+' : ''}{p.svPct}%
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge variant={getIndexVariant(p.cpi)} className="font-mono text-[10px]">{p.cpi.toFixed(2)}</Badge>
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge variant={getIndexVariant(p.spi)} className="font-mono text-[10px]">{p.spi.toFixed(2)}</Badge>
                        </td>
                        <td className={`px-3 py-2.5 font-mono tabular-nums font-semibold ${p.eac_cpi > p.bac ? 'text-destructive' : 'text-success'}`}>
                          {fmt(p.eac_cpi)}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <ProgressBar value={p.pctComplete} size="xs" color="primary" className="w-14" />
                            <span className="font-mono text-[10px] tabular-nums">{p.pctComplete}%</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => { setActivePeriodeId(p.id); openEdit(p) }}
                              className="text-[10px] text-primary underline underline-offset-2 hover:opacity-70"
                            >
                              Modifier
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ════ TAB: ANALYSE DE LA VARIANCE ══════════════════════════════ */}
          {activeTab === 'analysis' && (
            <div className="flex flex-col gap-4 max-w-3xl">
              {/* Période active selector */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm text-muted-foreground">Période analysée :</span>
                {periodes.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setActivePeriodeId(p.id)}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      p.id === activePeriodeId
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Fiche d'analyse */}
              <div className="bg-card border border-border rounded-lg p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-foreground">
                    Rapport de performance — {activePeriode.label}
                  </h2>
                  <button
                    onClick={() => openEdit(activePeriode)}
                    className="text-xs text-primary underline underline-offset-2 hover:opacity-70"
                  >
                    Modifier
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Écart de coût (CV)</p>
                    <p className={`font-mono text-xl font-extrabold ${activePeriode.cv >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {activePeriode.cv >= 0 ? '+' : ''}{fmt(activePeriode.cv)}
                      <span className="text-sm ml-2">({activePeriode.cvPct >= 0 ? '+' : ''}{activePeriode.cvPct}%)</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activePeriode.cv < 0
                        ? 'Le projet dépense plus que la valeur produite (surcoût).'
                        : 'Le projet produit plus de valeur que son coût réel (économie).'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Écart de délai (SV)</p>
                    <p className={`font-mono text-xl font-extrabold ${activePeriode.sv >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {activePeriode.sv >= 0 ? '+' : ''}{fmt(activePeriode.sv)}
                      <span className="text-sm ml-2">({activePeriode.svPct >= 0 ? '+' : ''}{activePeriode.svPct}%)</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activePeriode.sv < 0
                        ? 'Le projet est en retard par rapport au planning prévu.'
                        : 'Le projet est en avance sur le calendrier planifié.'}
                    </p>
                  </div>
                </div>

                {/* Commentaire enregistré */}
                <div className="border-t border-border pt-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <MessageSquare size={13} className="text-muted-foreground" />
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Analyse narrative</p>
                  </div>
                  {activePeriode.commentaire ? (
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                      {activePeriode.commentaire}
                    </p>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground italic">
                      <AlertCircle size={12} />
                      Aucun commentaire saisi pour cette période.{' '}
                      <button onClick={() => openEdit(activePeriode)} className="text-primary underline underline-offset-2 not-italic">
                        Ajouter une analyse
                      </button>
                    </div>
                  )}
                </div>

                {/* Actions correctives recommendées */}
                {(activePeriode.cpi < 0.9 || activePeriode.spi < 0.9) && (
                  <div className="border-t border-border pt-4 mt-4">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                      Actions recommandées (PMBOK §11.6 / Banque Mondiale)
                    </p>
                    <ul className="flex flex-col gap-1.5">
                      {activePeriode.cpi < 0.9 && (
                        <>
                          <li className="flex items-start gap-2 text-xs text-foreground">
                            <span className="text-destructive mt-px">•</span>
                            Analyser les postes de dépenses les plus importants et identifier les gaspillages
                          </li>
                          <li className="flex items-start gap-2 text-xs text-foreground">
                            <span className="text-destructive mt-px">•</span>
                            Soumettre un plan de redressement budgétaire au bailleur (requis si CPI &lt; 0.85)
                          </li>
                        </>
                      )}
                      {activePeriode.spi < 0.9 && (
                        <>
                          <li className="flex items-start gap-2 text-xs text-foreground">
                            <span className="text-warning mt-px">•</span>
                            Mobiliser des ressources supplémentaires sur les tâches critiques
                          </li>
                          <li className="flex items-start gap-2 text-xs text-foreground">
                            <span className="text-warning mt-px">•</span>
                            Réviser le calendrier et soumettre un plan de rattrapage au COPIL
                          </li>
                          {dateForecast && (
                            <li className="flex items-start gap-2 text-xs text-foreground">
                              <span className="text-warning mt-px">•</span>
                              Fin prévisionnelle estimée à <strong>{dateForecast}</strong> au rythme actuel
                            </li>
                          )}
                        </>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {/* Tendance des indicateurs (mini-table) */}
              {periodes.length > 1 && (
                <div className="bg-card border border-border rounded-lg p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Tendance CPI / SPI par période</h3>
                  <div className="flex gap-2 flex-wrap">
                    {periodes.map(p => (
                      <div key={p.id} className={`rounded-md border px-3 py-2 text-center min-w-[80px] ${
                        p.id === activePeriodeId ? 'border-primary bg-primary/5' : 'border-border bg-muted/10'
                      }`}>
                        <p className="text-[10px] text-muted-foreground font-semibold">{p.label}</p>
                        <p className={`font-mono text-xs font-bold ${getIndexVariant(p.cpi) === 'success' ? 'text-success' : getIndexVariant(p.cpi) === 'warning' ? 'text-warning' : 'text-destructive'}`}>
                          CPI {p.cpi.toFixed(2)}
                        </p>
                        <p className={`font-mono text-xs font-bold ${getIndexVariant(p.spi) === 'success' ? 'text-success' : getIndexVariant(p.spi) === 'warning' ? 'text-warning' : 'text-destructive'}`}>
                          SPI {p.spi.toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════ TAB: TÂCHES EVM ══════════════════════════════════════════ */}
          {activeTab === 'tasks' && (
            <div className="flex flex-col gap-3">
              {/* Filtre statut CPI/SPI */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Filtrer :</span>
                {(['ALL', 'ORANGE', 'ROUGE'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setTaskFilter(f)}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      taskFilter === f
                        ? f === 'ALL'    ? 'bg-primary text-primary-foreground border-primary'
                        : f === 'ORANGE' ? 'bg-warning/80 text-warning-foreground border-warning'
                        : 'bg-destructive/80 text-destructive-foreground border-destructive'
                        : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
                    }`}
                  >
                    {f === 'ALL' ? 'Toutes les tâches'
                      : f === 'ORANGE' ? '⚠ CPI/SPI orange'
                      : '✗ CPI/SPI rouge'}
                    {f !== 'ALL' && (
                      <span className="ml-1.5 opacity-70">
                        ({allTasks.filter(t => t.statut_cpi === f || t.statut_spi === f).length})
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border bg-muted/5 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Analyse EVM par Tâche</h2>
                    <p className="text-xs text-muted-foreground">
                      {filteredTasks.length} tâche{filteredTasks.length > 1 ? 's' : ''}
                      {taskFilter !== 'ALL' ? ` (filtrées : statut ${taskFilter})` : ''}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}
                    onClick={handleExportCsvTasks} className="h-8 text-xs">
                    CSV Tâches
                  </Button>
                </div>
                <DataTable
                  columns={taskColumns}
                  data={filteredTasks}
                  isLoading={tasksLoading}
                  isError={false}
                  searchKey="code_tache"
                  searchPlaceholder="Rechercher une tâche (code, description)..."
                />
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── SlideOver saisie EVM ─────────────────────────────────────────── */}
      <EvmSaisieSlideOver
        open={slideOpen}
        onClose={() => setSlideOpen(false)}
        mode={slideMode}
        periode={slidePeriode}
        onSave={handleSavePeriode}
        onDelete={handleDeletePeriode}
      />
    </div>
  )
}
