import { useMemo, useState } from 'react';
import { Download, TrendingUp, TrendingDown, BarChart3, Check } from 'lucide-react';
import { StatCard } from '@/components/ui/data-display/StatCard';
import { Badge } from '@/components/ui/data-display/Badge';
import { Button } from '@/components/ui/forms/Button';
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

// ─────────────────────────────────────────────────────────────────────────────
// Mock EVM snapshot
// Remplacé par les données de l'API quand le backend sera connecté.
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_EVM = {
  vp:  11.2,
  va:   9.4,
  cr:  10.3,
  ipc:  0.91,
  ipd:  0.79,
  bac: 24.6,
  eac: 27.0,
  etc: 16.7,
  vac: -2.4,
  tcpi: 1.17,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Static chart data (tendance mensuelle)
// ─────────────────────────────────────────────────────────────────────────────

const S_CURVE = [
  { mois: 'Jan', vp: 0.8,  va: 0.7,  cr: 0.75 },
  { mois: 'Fév', vp: 2.1,  va: 1.8,  cr: 2.0  },
  { mois: 'Mar', vp: 3.8,  va: 3.2,  cr: 3.6  },
  { mois: 'Avr', vp: 5.9,  va: 5.0,  cr: 5.5  },
  { mois: 'Mai', vp: 8.5,  va: 7.1,  cr: 7.9  },
  { mois: 'Jun', vp: 11.2, va: 9.4,  cr: 10.3 },
];

const INDEX_TREND = [
  { mois: 'Jan', ipc: 0.93, ipd: 0.88 },
  { mois: 'Fév', ipc: 0.92, ipd: 0.85 },
  { mois: 'Mar', ipc: 0.91, ipd: 0.83 },
  { mois: 'Avr', ipc: 0.91, ipd: 0.82 },
  { mois: 'Mai', ipc: 0.90, ipd: 0.80 },
  { mois: 'Jun', ipc: 0.91, ipd: 0.79 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

type EvmVariant = 'secondary' | 'warning' | 'destructive' | 'success';

function signedM(v: number): string {
  return `${v >= 0 ? '' : '−'}$${Math.abs(v).toFixed(1)}M`;
}

function getPerformanceScore(cpi: number, spi: number): string {
  const avg = (cpi + spi) / 2;
  if (avg >= 1.00) return 'A';
  if (avg >= 0.95) return 'B+';
  if (avg >= 0.90) return 'B';
  if (avg >= 0.85) return 'B−';
  if (avg >= 0.80) return 'C';
  return 'D';
}

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  color: 'hsl(var(--foreground))',
  fontSize: '12px',
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function TabEVM() {
  const [exported, setExported] = useState(false);

  // Données sources — remplacer `evm` par les données de l'hook useEvm() quand disponibles
  const evm = MOCK_EVM;

  // KPIs calculés
  const kpis = useMemo(() => ({
    ipc:   evm.ipc,
    ipd:   evm.ipd,
    eac:   evm.eac,
    score: getPerformanceScore(evm.ipc, evm.ipd),
  }), [evm.ipc, evm.ipd, evm.eac]);

  // Tableau des indicateurs — calculé depuis les données sources
  const evmRows = useMemo<Array<{ label: string; def: string; val: string; variant: EvmVariant; statut: string }>>(() => {
    const cv = evm.va - evm.cr;
    const sv = evm.va - evm.vp;
    return [
      { label: 'Valeur Planifiée (VP)',  def: 'Budgeted cost of work scheduled',  val: `$${evm.vp}M`,       variant: 'secondary',   statut: 'Référence'   },
      { label: 'Valeur Acquise (VA)',    def: 'Budgeted cost of work performed',   val: `$${evm.va}M`,       variant: 'warning',     statut: 'Conforme'    },
      { label: 'Coût Réel (CR)',         def: 'Actual cost of work performed',     val: `$${evm.cr}M`,       variant: 'warning',     statut: 'Conforme'    },
      { label: 'Écart de Coût (CV)',     def: 'VA − CR',                           val: signedM(cv),         variant: cv >= 0 ? 'success' : 'warning',  statut: cv >= 0 ? 'Favorable' : 'Défavorable' },
      { label: 'Écart de Délai (SV)',    def: 'VA − VP',                           val: signedM(sv),         variant: sv >= 0 ? 'success' : 'destructive', statut: sv >= 0 ? 'Favorable' : 'Défavorable' },
      { label: 'IPC (CPI)',              def: 'VA / CR',                           val: evm.ipc.toFixed(2),  variant: evm.ipc >= 1 ? 'success' : evm.ipc >= 0.9 ? 'warning' : 'destructive', statut: evm.ipc >= 1 ? 'Conforme' : evm.ipc >= 0.9 ? '>0.9 Attention' : '<0.9 Critique' },
      { label: 'IPD (SPI)',              def: 'VA / VP',                           val: evm.ipd.toFixed(2),  variant: evm.ipd >= 1 ? 'success' : evm.ipd >= 0.9 ? 'warning' : 'destructive', statut: evm.ipd >= 1 ? 'Conforme' : evm.ipd >= 0.9 ? '>0.9 Attention' : '<0.9 Critique' },
      { label: 'BAC',                    def: "Budget à l'achèvement",             val: `$${evm.bac}M`,      variant: 'secondary',   statut: 'Référence'   },
      { label: 'EAC',                    def: "Estimation à l'achèvement",         val: `$${evm.eac}M`,      variant: evm.eac > evm.bac ? 'destructive' : 'success', statut: evm.eac > evm.bac ? 'Dépassement' : 'Conforme' },
      { label: 'ETC',                    def: 'Coût restant estimé',               val: `$${evm.etc}M`,      variant: 'warning',     statut: 'Attention'   },
      { label: 'VAC',                    def: "Variation à l'achèvement",          val: signedM(evm.vac),    variant: evm.vac >= 0 ? 'success' : 'destructive', statut: evm.vac >= 0 ? 'Favorable' : 'Défavorable' },
      { label: 'TCPI',                   def: 'To-Complete Performance Index',     val: evm.tcpi.toFixed(2), variant: evm.tcpi <= 1 ? 'success' : evm.tcpi <= 1.1 ? 'warning' : 'destructive', statut: evm.tcpi <= 1 ? 'Réalisable' : evm.tcpi <= 1.1 ? 'Difficile' : 'Très difficile' },
    ];
  }, [evm]);

  function handleExport() {
    const rows = [
      ['Indicateur', 'Définition', 'Valeur', 'Statut'],
      ...evmRows.map(r => [r.label, r.def, r.val, r.statut]),
    ];
    const csv = '﻿' + rows
      .map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-evm-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  }

  return (
    <div className="flex flex-col gap-4 bg-background">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
        <div>
          <h1 className="text-base font-bold text-foreground">Gestion de la Valeur Acquise (EVM)</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Vue synthétique — À date (Juin 2026)</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          leftIcon={exported ? <Check className="h-3.5 w-3.5 text-success" /> : <Download className="h-3.5 w-3.5" />}
          className="h-8 text-xs"
          onClick={handleExport}
        >
          {exported ? 'Exporté !' : 'Exporter Rapport EVM'}
        </Button>
      </div>

      {/* ── KPI STRIP ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          title="IPC Global"
          value={kpis.ipc.toFixed(2)}
          icon={<TrendingUp className="h-4 w-4" aria-hidden="true" />}
          iconVariant={kpis.ipc >= 1 ? 'success' : kpis.ipc >= 0.9 ? 'warning' : 'destructive'}
          description={kpis.ipc >= 1 ? 'Coûts maîtrisés' : kpis.ipc >= 0.9 ? 'Léger dépassement' : 'Dépassement critique'}
        />
        <StatCard
          title="IPD Global"
          value={kpis.ipd.toFixed(2)}
          icon={<TrendingDown className="h-4 w-4" aria-hidden="true" />}
          iconVariant={kpis.ipd >= 1 ? 'success' : kpis.ipd >= 0.9 ? 'warning' : 'destructive'}
          description={kpis.ipd >= 1 ? 'Planning respecté' : kpis.ipd >= 0.9 ? 'Léger retard' : 'En retard sur le planning'}
        />
        <StatCard
          title="EAC"
          value={`$${kpis.eac}M`}
          icon={<BarChart3 className="h-4 w-4" aria-hidden="true" />}
          iconVariant={kpis.eac > evm.bac ? 'destructive' : 'success'}
          description={`vs $${evm.bac}M (Budget initial)`}
        />
        <StatCard
          title="Score de performance"
          value={kpis.score}
          icon={<TrendingUp className="h-4 w-4" aria-hidden="true" />}
          iconVariant={kpis.ipc >= 1 && kpis.ipd >= 1 ? 'success' : kpis.ipc >= 0.9 && kpis.ipd >= 0.8 ? 'warning' : 'destructive'}
          description="IPC/IPD combinés"
        />
      </div>

      {/* ── COURBE EN S ────────────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border bg-muted/5">
          <h3 className="text-sm font-semibold text-foreground">Courbe en S</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Valeur Planifiée (VP) · Valeur Acquise (VA) · Coût Réel (CR), cumul en millions USD
          </p>
        </div>
        <div
          role="img"
          aria-label="Courbe en S — Valeur Planifiée, Valeur Acquise et Coût Réel cumulés en millions USD"
          className="p-4 h-56"
        >
          <ResponsiveContainer width="99%" height="100%">
            <AreaChart data={S_CURVE} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="gradVP" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="hsl(var(--muted-foreground))" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradVA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradCR" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="hsl(var(--warning))" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="hsl(var(--warning))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="mois" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} unit="M" />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}M USD`, undefined]} />
              <Legend iconType="circle" iconSize={8} formatter={(v: string) => <span className="text-[11px] text-muted-foreground">{v}</span>} />
              <Area type="monotone" dataKey="vp" name="VP Planifiée" stroke="hsl(var(--muted-foreground))" fill="url(#gradVP)" strokeWidth={2} strokeDasharray="4 2" dot={false} />
              <Area type="monotone" dataKey="va" name="VA Acquise"   stroke="hsl(var(--primary))"          fill="url(#gradVA)"  strokeWidth={2} dot={{ r: 3, fill: 'hsl(var(--primary))' }} />
              <Area type="monotone" dataKey="cr" name="CR Réel"      stroke="hsl(var(--warning))"          fill="url(#gradCR)"  strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── GRAPHES TENDANCE ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border bg-muted/5">
            <h3 className="text-sm font-semibold text-foreground">Tendance IPC</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Indice de Performance des Coûts mensuel</p>
          </div>
          <div
            role="img"
            aria-label="Tendance mensuelle de l'Indice de Performance des Coûts (IPC)"
            className="p-4 h-44"
          >
            <ResponsiveContainer width="99%" height="100%">
              <LineChart data={INDEX_TREND} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mois" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0.7, 1.1]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [Number(v).toFixed(2), undefined]} />
                <Line
                  type="monotone" dataKey="ipc" name="IPC"
                  stroke="hsl(var(--warning))" strokeWidth={2.5}
                  dot={{ r: 3, fill: 'hsl(var(--warning))' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border bg-muted/5">
            <h3 className="text-sm font-semibold text-foreground">Tendance IPD</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Indice de Performance des Délais mensuel</p>
          </div>
          <div
            role="img"
            aria-label="Tendance mensuelle de l'Indice de Performance des Délais (IPD)"
            className="p-4 h-44"
          >
            <ResponsiveContainer width="99%" height="100%">
              <LineChart data={INDEX_TREND} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mois" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0.6, 1.1]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [Number(v).toFixed(2), undefined]} />
                <Line
                  type="monotone" dataKey="ipd" name="IPD"
                  stroke="hsl(var(--destructive))" strokeWidth={2.5}
                  dot={{ r: 3, fill: 'hsl(var(--destructive))' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── INDICATEURS EVM ─────────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border bg-muted/5">
          <h3 className="text-sm font-semibold text-foreground">Indicateurs EVM</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Tableau complet des métriques de performance</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Indicateur</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground hidden sm:table-cell">Définition</th>
                <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Valeur</th>
                <th className="px-4 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Statut</th>
              </tr>
            </thead>
            <tbody>
              {evmRows.map((row) => (
                <tr key={row.label} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                  <td className="px-4 py-2.5 font-semibold text-foreground text-sm">{row.label}</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs hidden sm:table-cell">{row.def}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold tabular-nums">
                    <span className={
                      row.variant === 'destructive' ? 'text-destructive'
                      : row.variant === 'warning' ? 'text-warning'
                      : row.variant === 'success' ? 'text-success'
                      : 'text-muted-foreground'
                    }>
                      {row.val}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <Badge variant={row.variant}>{row.statut}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
