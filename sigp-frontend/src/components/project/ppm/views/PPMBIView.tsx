import React, { useMemo } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import { ChartCard } from '@/components/common/analytics/ChartCard';
import { TrendingUp, CheckCircle2, Clock, ShieldCheck, DollarSign } from 'lucide-react';

// ─── Types (acceptés du hook, pas de logique métier ici) ────────────────────
interface BiMetrics {
  categorieData: Array<{ name: string; count: number; montant: number }>;
  methodeData: Array<{ name: string; value: number }>;
  statutData: Array<{ name: string; value: number }>;
  revueData: Array<{ name: string; value: number }>;
  kpi: {
    totalLignes: number;
    nbSigmes: number;
    nbEnCours: number;
    montantSigne: number;
    pctPrior: number;
  };
}

interface PPMBIViewProps {
  biMetrics: BiMetrics | null;
  totalEstimeBase: number;
  isLoading: boolean;
}

// ─── Palettes Couleur ERP Premium ───────────────────────────────────────────
const PALETTE_CATEGORIE = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
const PALETTE_METHODE   = ['#1d4ed8', '#0369a1', '#0891b2', '#0f766e', '#4f46e5', '#7c3aed'];
const PALETTE_STATUT    = ['#64748b', '#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#6366f1', '#ec4899'];
const PALETTE_REVUE     = ['#ef4444', '#94a3b8'];

// ─── Formatters ─────────────────────────────────────────────────────────────
const fmtMontant = (v: number) =>
  new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 }).format(v) + ' XOF';

const fmtMontantFull = (v: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(v);

// ─── Tooltip personnalisé (Pie) ──────────────────────────────────────────────
const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div style={{
      background: 'var(--navy-900)', color: 'white', padding: '10px 14px',
      borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
    }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{d.name}</div>
      <div>{fmtMontantFull(d.value)}</div>
    </div>
  );
};

// ─── Tooltip personnalisé (Bar) ──────────────────────────────────────────────
const BarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--navy-900)', color: 'white', padding: '10px 14px',
      borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
    }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
          <span>{p.name} : </span>
          <span style={{ fontWeight: 600 }}>
            {p.dataKey === 'montant' ? fmtMontant(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── Composant KPI Card ──────────────────────────────────────────────────────
interface KPICardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}

const KPICard = React.memo(({ label, value, sub, icon: Icon, color, bg }: KPICardProps) => (
  <div style={{
    background: 'var(--surface)', borderRadius: '10px', border: '1px solid var(--line-soft)',
    padding: '20px', display: 'flex', alignItems: 'center', gap: '16px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
  }}>
    <div style={{
      width: 44, height: 44, borderRadius: '10px', background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
    }}>
      <Icon size={20} color={color} />
    </div>
    <div>
      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--navy-900)', lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '11px', color: 'var(--slate)', marginTop: 4 }}>{sub}</div>}
    </div>
  </div>
));
KPICard.displayName = 'KPICard';

// ─── Légende Pie personnalisée ───────────────────────────────────────────────
const renderPieLegend = (data: Array<{ name: string; value: number }>, palette: string[]) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginTop: 12, justifyContent: 'center' }}>
    {data.map((d, i) => (
      <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
        <span style={{ width: 10, height: 10, borderRadius: 2, background: palette[i % palette.length], display: 'inline-block' }} />
        <span style={{ color: 'var(--slate)' }}>{d.name}</span>
      </div>
    ))}
  </div>
);

// ─── Composant Principal (Pure UI) ──────────────────────────────────────────
export const PPMBIView = React.memo(({ biMetrics, totalEstimeBase, isLoading }: PPMBIViewProps) => {
  const isEmpty = !isLoading && !biMetrics;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Bandeau KPI ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <KPICard
          label="Montant Total PPM"
          value={isLoading ? '…' : fmtMontant(totalEstimeBase)}
          sub="Estimation globale (base XOF)"
          icon={DollarSign}
          color="#3b82f6"
          bg="#eff6ff"
        />
        <KPICard
          label="Lignes de Marché"
          value={isLoading ? '…' : String(biMetrics?.kpi.totalLignes ?? 0)}
          sub="Toutes versions confondues"
          icon={TrendingUp}
          color="#8b5cf6"
          bg="#f5f3ff"
        />
        <KPICard
          label="Contrats Signés"
          value={isLoading ? '…' : String(biMetrics?.kpi.nbSigmes ?? 0)}
          sub={biMetrics ? fmtMontant(biMetrics.kpi.montantSigne) + ' engagé' : ''}
          icon={CheckCircle2}
          color="#10b981"
          bg="#ecfdf5"
        />
        <KPICard
          label="En cours de passation"
          value={isLoading ? '…' : String(biMetrics?.kpi.nbEnCours ?? 0)}
          sub="Marchés actifs"
          icon={Clock}
          color="#f59e0b"
          bg="#fffbeb"
        />
        <KPICard
          label="Marchés PRIOR"
          value={isLoading ? '…' : `${biMetrics?.kpi.pctPrior ?? 0}%`}
          sub="Soumis à l'ANO Bailleur"
          icon={ShieldCheck}
          color="#ef4444"
          bg="#fef2f2"
        />
      </div>

      {/* ── Ligne 1 : Catégorie + Méthode ── */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <ChartCard
          title="Montant par Catégorie d'Achat"
          subtitle="Comparaison du volume financier par type de marché"
          icon={<TrendingUp size={14} />}
          minHeight="260px"
          isLoading={isLoading}
          isEmpty={isEmpty}
          emptyMessage="Aucune donnée de catégorie disponible"
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={biMetrics?.categorieData ?? []} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line-soft)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--slate)' }} />
              <YAxis tickFormatter={v => fmtMontant(v)} tick={{ fontSize: 10, fill: 'var(--slate)' }} width={80} />
              <Tooltip content={<BarTooltip />} />
              <Bar dataKey="montant" name="Montant" radius={[4, 4, 0, 0]}>
                {(biMetrics?.categorieData ?? []).map((_: any, i: number) => (
                  <Cell key={i} fill={PALETTE_CATEGORIE[i % PALETTE_CATEGORIE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Volume par Méthode de Passation"
          subtitle="Répartition financière selon la procédure d'achat"
          icon={<TrendingUp size={14} />}
          minHeight="260px"
          isLoading={isLoading}
          isEmpty={isEmpty}
          emptyMessage="Aucune donnée de méthode"
        >
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={biMetrics?.methodeData ?? []}
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {(biMetrics?.methodeData ?? []).map((_: any, i: number) => (
                  <Cell key={i} fill={PALETTE_METHODE[i % PALETTE_METHODE.length]} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {biMetrics && renderPieLegend(biMetrics.methodeData, PALETTE_METHODE)}
        </ChartCard>
      </div>

      {/* ── Ligne 2 : Statuts + Revue Prior/Post ── */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <ChartCard
          title="Distribution par Statut"
          subtitle="Nombre de marchés par étape de passation"
          icon={<Clock size={14} />}
          minHeight="260px"
          isLoading={isLoading}
          isEmpty={isEmpty}
          emptyMessage="Aucun statut disponible"
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={biMetrics?.statutData ?? []}
              layout="vertical"
              margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line-soft)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--slate)' }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'var(--slate)' }} width={120} />
              <Tooltip formatter={(v: any) => [v, 'Marchés']} />
              <Bar dataKey="value" name="Marchés" radius={[0, 4, 4, 0]}>
                {(biMetrics?.statutData ?? []).map((_: any, i: number) => (
                  <Cell key={i} fill={PALETTE_STATUT[i % PALETTE_STATUT.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Revue Bailleur : PRIOR vs POST"
          subtitle="Volume financier soumis à l'Avis de Non-Objection"
          icon={<ShieldCheck size={14} />}
          minHeight="260px"
          flex="0 1 340px"
          minWidth="280px"
          isLoading={isLoading}
          isEmpty={isEmpty}
          emptyMessage="Aucune donnée de revue"
        >
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={biMetrics?.revueData ?? []}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                dataKey="value"
                paddingAngle={4}
              >
                {(biMetrics?.revueData ?? []).map((_: any, i: number) => (
                  <Cell key={i} fill={PALETTE_REVUE[i % PALETTE_REVUE.length]} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {biMetrics && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 8 }}>
              {biMetrics.revueData.map((d, i) => (
                <div key={d.name} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--slate)', marginBottom: 2 }}>{d.name}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: PALETTE_REVUE[i] }}>
                    {fmtMontant(d.value)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ChartCard>
      </div>

    </div>
  );
});

PPMBIView.displayName = 'PPMBIView';
