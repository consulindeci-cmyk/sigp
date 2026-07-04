import { useMemo } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
  type PieLabelRenderProps,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/data-display/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/Card';
import { formatMoney } from '@/utils/format';
import type { PPMLigne, PPMVersion, CategorieAchat, MethodePassation, StatutLignePPM } from '@/types';

// ─── Labels & couleurs ───────────────────────────────────────────────────────

const CAT_LABELS: Record<CategorieAchat, string> = {
  TRAVAUX:                  'Travaux',
  BIENS:                    'Biens',
  SERVICES_CONSULTANTS:     'Consultants',
  SERVICES_NON_CONSULTANTS: 'Svcs non-consultants',
};

const CAT_COLORS: Record<CategorieAchat, string> = {
  TRAVAUX:                  'hsl(var(--primary))',
  BIENS:                    'hsl(var(--success))',
  SERVICES_CONSULTANTS:     'hsl(var(--warning))',
  SERVICES_NON_CONSULTANTS: 'hsl(var(--info))',
};

const METHODE_COLORS: Record<MethodePassation, string> = {
  AOI:  'hsl(var(--primary))',
  AON:  'hsl(var(--success))',
  QCBS: 'hsl(var(--warning))',
  LCS:  'hsl(var(--info))',
  CF:   'hsl(var(--destructive))',
  ED:   'hsl(213 60% 50%)',
};

const STATUT_LABELS: Record<StatutLignePPM, string> = {
  PLANIFIE:           'Planifié',
  DAO_EN_PREPARATION: 'DAO en prépa.',
  DAO_LANCE:          'DAO lancé',
  OFFRES_RECUES:      'Offres reçues',
  EVALUATION:         'Évaluation',
  ANO_EN_ATTENTE:     'ANO en attente',
  ANO_OBTENU:         'ANO obtenu',
  ATTRIBUE:           'Attribué',
  CONTRAT_SIGNE:      'Contrat signé',
  EXECUTION:          'En exécution',
  CLOTURE:            'Clôturé',
  ANNULE:             'Annulé',
};

// ─── Custom PieChart label ────────────────────────────────────────────────────

function PieLabel(props: PieLabelRenderProps) {
  const cx          = Number(props.cx          ?? 0);
  const cy          = Number(props.cy          ?? 0);
  const midAngle    = Number(props.midAngle    ?? 0);
  const innerRadius = Number(props.innerRadius ?? 0);
  const outerRadius = Number(props.outerRadius ?? 0);
  const pct         = (props.percent ?? 0) * 100;
  if (pct < 8) return null;
  const R = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * R);
  const y = cy + r * Math.sin(-midAngle * R);
  return (
    <text
      x={x} y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={600}
    >
      {`${pct.toFixed(0)}%`}
    </text>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface AnalyticsTabProps {
  lignes: PPMLigne[];
  activeVersion: PPMVersion | undefined;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AnalyticsTab({ lignes, activeVersion }: AnalyticsTabProps) {

  // Budget par catégorie (PieChart)
  const catData = useMemo(() => {
    const map: Partial<Record<CategorieAchat, number>> = {};
    lignes.forEach(l => { map[l.categorie] = (map[l.categorie] ?? 0) + l.montant_estime_base; });
    return Object.entries(map).map(([k, v]) => ({
      name:  CAT_LABELS[k as CategorieAchat] ?? k,
      value: v ?? 0,
      color: CAT_COLORS[k as CategorieAchat] ?? 'hsl(var(--muted-foreground))',
    }));
  }, [lignes]);

  // Budget par méthode (PieChart)
  const methodeData = useMemo(() => {
    const map: Partial<Record<MethodePassation, number>> = {};
    lignes.forEach(l => { map[l.methode] = (map[l.methode] ?? 0) + l.montant_estime_base; });
    return Object.entries(map).map(([k, v]) => ({
      name:  k,
      value: v ?? 0,
      color: METHODE_COLORS[k as MethodePassation] ?? 'hsl(var(--muted-foreground))',
    }));
  }, [lignes]);

  // Marchés par statut (BarChart)
  const statutData = useMemo(() => {
    const map: Partial<Record<StatutLignePPM, { count: number; montant: number }>> = {};
    lignes.forEach(l => {
      if (!map[l.statut]) map[l.statut] = { count: 0, montant: 0 };
      map[l.statut]!.count  += 1;
      map[l.statut]!.montant += l.montant_estime_base;
    });
    return Object.entries(map).map(([k, v]) => ({
      name:    STATUT_LABELS[k as StatutLignePPM] ?? k,
      marchés: v?.count   ?? 0,
      montant: v?.montant ?? 0,
    }));
  }, [lignes]);

  // Revue PRIOR vs POST (BarChart)
  const revueData = useMemo(() => [
    {
      name:    'Revue Préalable (PRIOR)',
      count:   lignes.filter(l => l.type_revue === 'PRIOR').length,
      montant: lignes.filter(l => l.type_revue === 'PRIOR').reduce((s, l) => s + l.montant_estime_base, 0),
    },
    {
      name:    'Revue Postérieure (POST)',
      count:   lignes.filter(l => l.type_revue === 'POST').length,
      montant: lignes.filter(l => l.type_revue === 'POST').reduce((s, l) => s + l.montant_estime_base, 0),
    },
  ], [lignes]);

  // KPIs
  const totalBase   = lignes.reduce((s, l) => s + l.montant_estime_base, 0);
  const priorCount  = lignes.filter(l => l.type_revue === 'PRIOR').length;
  const postCount   = lignes.filter(l => l.type_revue === 'POST').length;
  const activeCount = lignes.filter(l => !['CLOTURE', 'ANNULE'].includes(l.statut)).length;

  if (lignes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-56 gap-3 text-muted-foreground">
        <TrendingUp className="h-10 w-10 opacity-25" aria-hidden="true" />
        <p className="text-sm">Aucune ligne de marché pour cette version du PPM.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">

      {/* ── KPI strip ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'Budget total estimé',
            value: formatMoney(totalBase),
            sub:   `Version ${activeVersion?.numero_version ?? '—'}`,
            color: 'text-primary',
          },
          {
            label: 'Marchés actifs',
            value: String(activeCount),
            sub:   `sur ${lignes.length} marché${lignes.length > 1 ? 's' : ''}`,
            color: 'text-success',
          },
          {
            label: 'Revue préalable (PRIOR)',
            value: String(priorCount),
            sub:   'ANO requis avant signature',
            color: 'text-warning',
          },
          {
            label: 'Revue postérieure (POST)',
            value: String(postCount),
            sub:   'Revue après exécution',
            color: 'text-info',
          },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-lg border border-border bg-card p-4">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
              {kpi.label}
            </p>
            <p className={`text-xl font-bold mt-1 tabular-nums ${kpi.color}`}>{kpi.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* ── PieCharts ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Budget par catégorie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Budget par catégorie d'achat</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={catData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%" cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  labelLine={false}
                  label={PieLabel}
                >
                  {catData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [formatMoney(value as number), 'Budget estimé']}
                  contentStyle={{ fontSize: '11px', borderRadius: '6px' }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Budget par méthode */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Budget par méthode de passation</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={methodeData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%" cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  labelLine={false}
                  label={PieLabel}
                >
                  {methodeData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [formatMoney(value as number), 'Budget estimé']}
                  contentStyle={{ fontSize: '11px', borderRadius: '6px' }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ── BarChart: marchés par statut ───────────────────────────────────── */}
      {statutData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Répartition des marchés par statut</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={statutData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  width={24}
                />
                <Tooltip
                  formatter={(value) => [value, 'Marchés']}
                  contentStyle={{ fontSize: '11px', borderRadius: '6px' }}
                />
                <Bar
                  dataKey="marchés"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>

            {/* Summary badges */}
            <div className="mt-4 flex flex-wrap gap-2">
              {statutData.map(s => (
                <div
                  key={s.name}
                  className="flex items-center gap-2 rounded-md border border-border bg-muted/20 px-3 py-1.5"
                >
                  <span className="text-[11px] text-muted-foreground">{s.name}</span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                    {s.marchés}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── BarChart: PRIOR vs POST ─────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Revue préalable (PRIOR) vs postérieure (POST)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={revueData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                width={24}
              />
              <Tooltip
                formatter={(value, name) => [
                  name === 'count' ? value : formatMoney(value as number),
                  name === 'count' ? 'Marchés' : 'Budget estimé',
                ]}
                contentStyle={{ fontSize: '11px', borderRadius: '6px' }}
              />
              <Legend
                iconType="square"
                iconSize={8}
                wrapperStyle={{ fontSize: '11px' }}
              />
              <Bar dataKey="count"   name="Marchés"        fill="hsl(var(--primary))" radius={[4,4,0,0]} maxBarSize={60} />
              <Bar dataKey="montant" name="Budget (XOF)"   fill="hsl(var(--warning))" radius={[4,4,0,0]} maxBarSize={60} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
