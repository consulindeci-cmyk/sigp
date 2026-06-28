import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Calendar, RefreshCw, TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { useEvm, useEvmTasks, useEvmTrend } from '@/hooks/useEvm'
import { formatNumber } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface KpiItem {
  label: string
  value: string
  color: string
  raw?: number
}

// ─── Données Courbe-en-S fallback (si API vide) ──────────────────────────────

const SCURVE_DEMO = [
  { mois: 'Jan', pv: 60,  ev: 40,  ac: 45  },
  { mois: 'Fév', pv: 120, ev: 90,  ac: 100 },
  { mois: 'Mar', pv: 190, ev: 140, ac: 155 },
  { mois: 'Avr', pv: 250, ev: 180, ac: 200 },
  { mois: 'Mai', pv: 300, ev: 220, ac: 245 },
  { mois: 'Juin',pv: 360, ev: 250, ac: 270 },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getIndexColor(v: number): string {
  if (v >= 1)    return '#16A34A'
  if (v >= 0.90) return '#F97316'
  return '#DC2626'
}

function IndexIcon({ v }: { v: number }) {
  if (v >= 1)    return <TrendingUp  size={14} className="inline-block mr-1" style={{ color: '#16A34A' }} />
  if (v >= 0.90) return <Minus       size={14} className="inline-block mr-1" style={{ color: '#F97316' }} />
  return <TrendingDown size={14} className="inline-block mr-1" style={{ color: '#DC2626' }} />
}

// ─── Tooltip Recharts ─────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#fff', border: '1px solid #E5E7EB',
      borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      fontSize: 12,
    }}>
      <p style={{ color: '#6B7280', marginBottom: 6, fontWeight: 600 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color, display: 'flex', justifyContent: 'space-between', gap: 16, margin: '2px 0' }}>
          <span>{p.name}</span>
          <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{formatNumber(p.value, 0)}k</span>
        </p>
      ))}
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function EVMKpiCard({ label, value, color }: KpiItem) {
  return (
    <div style={{
      background: '#fff', borderRadius: 14,
      boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #E5E7EB',
      padding: '14px 16px', minWidth: 0,
    }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
        {label}
      </p>
      <p style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1.1 }}>
        {value}
      </p>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function MoteurEVMPage() {
  const { id: projectId = '' } = useParams()
  const [dateControle, setDateControle] = useState('')

  const { data: evm, isLoading: evmLoading, refetch } = useEvm(projectId, dateControle || undefined)
  const { data: evmTasks, isLoading: tasksLoading } = useEvmTasks(projectId, dateControle || undefined)
  const { data: trendData, isLoading: trendLoading } = useEvmTrend(projectId)

  const isLoading = evmLoading || tasksLoading || trendLoading

  // Valeurs KPI (API si disponibles, sinon démo)
  const bac  = evm?.bac  ?? 500000
  const pv   = evm?.pv   ?? 300000
  const ev   = evm?.ev   ?? 250000
  const ac   = evm?.ac   ?? 270000
  const cpi  = evm?.cpi  ?? 0.92
  const spi  = evm?.spi  ?? 0.83
  const eac  = evm?.eac  ?? 543000

  const fmt = (n: number) => n >= 1000 ? `${Math.round(n / 1000)}k` : String(Math.round(n))

  const kpis: KpiItem[] = [
    { label: 'BAC', value: fmt(bac), color: '#2563EB' },
    { label: 'PV',  value: fmt(pv),  color: '#1F2937' },
    { label: 'EV',  value: fmt(ev),  color: '#16A34A' },
    { label: 'AC',  value: fmt(ac),  color: '#F97316' },
    { label: 'CPI', value: formatNumber(cpi, 2), color: getIndexColor(cpi) },
    { label: 'SPI', value: formatNumber(spi, 2), color: getIndexColor(spi) },
    { label: 'EAC', value: fmt(eac), color: eac > bac ? '#DC2626' : '#16A34A' },
  ]

  // Données graphique — courbe en S depuis l'API /evm/trend (données réelles)
  // Fallback sur données démo si l'API ne retourne rien
  const sCurveData = (trendData?.evolution_mensuelle?.length)
    ? trendData.evolution_mensuelle.map(m => ({
        mois: m.mois.replace(/^\d{4}-/, '').replace(/^0/, ''),  // "2025-01" → "1"
        pv: Math.round(m.pv / 1000),
        ev: Math.round(m.ev / 1000),
        ac: Math.round(m.ac / 1000),
      }))
    : SCURVE_DEMO

  // Loader initial (premier chargement uniquement)
  if (isLoading && !evm) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Loader2 size={36} style={{ color: '#2563EB', animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F5F6F8', overflowY: 'auto' }}>

      {/* ── TOPBAR INTERNE ── */}
      <div className="px-4 sm:px-7" style={{
        paddingTop: '18px',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16,
        flexWrap: 'wrap',
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0A1628', margin: 0, lineHeight: 1.2 }}>
            Valeur acquise / EVM
          </h1>
          <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
            Analyse avancée des coûts et délais : PV, EV, AC, CPI, SPI, EAC.
          </p>
        </div>

        {/* Contrôles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: '8px 12px',
          }}>
            <Calendar size={14} color="#6B7280" />
            <input
              type="date"
              value={dateControle}
              onChange={e => setDateControle(e.target.value)}
              style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: '#1F2937', cursor: 'pointer' }}
              title="Date de contrôle"
            />
          </div>
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#2563EB', color: '#fff', border: 'none', borderRadius: 10,
              padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            <RefreshCw size={14} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
            Recalculer
          </button>
        </div>
      </div>

      {/* ── CONTENU ── */}
      <div className="px-4 sm:px-7" style={{ paddingTop: '20px', paddingBottom: '20px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* 7 cartes KPI — grille responsive */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
        }} className="evm-kpi-grid">
          {kpis.map(k => (
            <EVMKpiCard key={k.label} {...k} />
          ))}
        </div>

        {/* Deux cartes du bas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* ── Courbe en S ── */}
          <div style={{
            background: '#fff', borderRadius: 16,
            border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
            padding: '20px 20px 12px',
          }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0A1628', margin: '0 0 16px' }}>
              Courbe en S : PV / EV / AC
            </h2>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={sCurveData} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis
                  dataKey="mois"
                  tick={{ fill: '#9CA3AF', fontSize: 11 }}
                  axisLine={{ stroke: '#E5E7EB' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#9CA3AF', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `${v}`}
                  domain={[0, 600]}
                  ticks={[0, 100, 200, 300, 400, 500, 600]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11, color: '#6B7280', paddingTop: 10 }}
                />
                <Line
                  type="monotone" dataKey="pv" name="PV"
                  stroke="#DC2626" strokeWidth={2.5}
                  dot={{ r: 3, fill: '#DC2626', strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone" dataKey="ev" name="EV"
                  stroke="#2563EB" strokeWidth={2.5}
                  dot={{ r: 3, fill: '#2563EB', strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone" dataKey="ac" name="AC"
                  stroke="#84CC16" strokeWidth={2.5}
                  dot={{ r: 3, fill: '#84CC16', strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* ── Lecture rapide ── */}
          <div style={{
            background: '#fff', borderRadius: 16,
            border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
            padding: '20px',
            display: 'flex', flexDirection: 'column', gap: 0,
          }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0A1628', margin: '0 0 20px' }}>
              Lecture rapide
            </h2>

            {/* CPI */}
            <div style={{
              background: '#FFF7ED', borderRadius: 12, border: '1px solid #FED7AA',
              padding: '14px 16px', marginBottom: 12,
            }}>
              <p style={{ fontSize: 22, fontWeight: 800, color: getIndexColor(cpi), margin: '0 0 6px', lineHeight: 1 }}>
                <IndexIcon v={cpi} />
                CPI = {formatNumber(cpi, 2)}
              </p>
              <p style={{ fontSize: 13, color: '#6B7280', margin: 0, lineHeight: 1.5 }}>
                Surcoût probable : renforcer le contrôle financier.
              </p>
            </div>

            {/* SPI */}
            <div style={{
              background: '#FEF2F2', borderRadius: 12, border: '1px solid #FECACA',
              padding: '14px 16px', marginBottom: 'auto',
            }}>
              <p style={{ fontSize: 22, fontWeight: 800, color: getIndexColor(spi), margin: '0 0 6px', lineHeight: 1 }}>
                <IndexIcon v={spi} />
                SPI = {formatNumber(spi, 2)}
              </p>
              <p style={{ fontSize: 13, color: '#6B7280', margin: 0, lineHeight: 1.5 }}>
                Retard critique : arbitrage comité de pilotage.
              </p>
            </div>

            {/* Légende couleurs */}
            <div style={{ display: 'flex', gap: 8, marginTop: 24, flexWrap: 'wrap' }}>
              {[
                { label: 'VERT ≥ 1',        bg: '#16A34A' },
                { label: 'ORANGE 0,90–0,99', bg: '#F97316' },
                { label: 'ROUGE < 0,90',     bg: '#DC2626' },
              ].map(({ label, bg }) => (
                <span key={label} style={{
                  background: bg, color: '#fff', borderRadius: 20,
                  padding: '4px 12px', fontSize: 11, fontWeight: 700,
                  letterSpacing: '0.03em',
                }}>
                  {label}
                </span>
              ))}
            </div>
          </div>

        </div>

        {/* ── Tableau EVM par tâche ── */}
        <div style={{
          background: '#fff', borderRadius: 16,
          border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB' }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0A1628', margin: 0 }}>
              Analyse EVM par Tâche
            </h2>
            <p style={{ fontSize: 12, color: '#6B7280', margin: '3px 0 0' }}>
              Colonnes calculées automatiquement — non éditables
            </p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 900 }}>
              <thead>
                <tr style={{ background: '#F9FAFB' }}>
                  {['Code', 'Description', 'Phase WBS', 'Avanc.', 'BAC', 'PV', 'EV', 'AC', 'CV', 'SV', 'CPI', 'SPI', 'EAC'].map(h => (
                    <th key={h} style={{
                      padding: '10px 12px', textAlign: ['BAC','PV','EV','AC','CV','SV','EAC'].includes(h) ? 'right' : ['CPI','SPI','Avanc.'].includes(h) ? 'center' : 'left',
                      fontWeight: 700, color: '#6B7280', fontSize: 11, textTransform: 'uppercase',
                      letterSpacing: '0.05em', borderBottom: '1px solid #E5E7EB', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(!evmTasks || evmTasks.length === 0) ? (
                  <tr>
                    <td colSpan={13} style={{ textAlign: 'center', padding: '40px 20px', color: '#9CA3AF', fontSize: 13 }}>
                      Aucune tâche disponible. Ajoutez des tâches dans la Saisie POA.
                    </td>
                  </tr>
                ) : evmTasks.map((t, i) => (
                  <tr key={t.tache_id} style={{ background: i % 2 === 0 ? '#fff' : '#F9FAFB', borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#2563EB', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {t.code_tache}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#374151', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.description}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#6B7280' }}>{t.wbs ?? '—'}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#374151', fontWeight: 600 }}>{t.avancement}%</span>
                        <div style={{ width: 48, height: 4, background: '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ width: `${t.avancement}%`, height: '100%', background: '#2563EB', borderRadius: 4 }} />
                        </div>
                      </div>
                    </td>
                    {[t.bac, t.pv, t.ev, t.ac].map((v, vi) => (
                      <td key={vi} style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', color: '#374151', fontWeight: 500 }}>
                        {formatNumber(v, 0)}
                      </td>
                    ))}
                    {[t.cv, t.sv].map((v, vi) => (
                      <td key={vi} style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', color: v >= 0 ? '#16A34A' : '#DC2626', fontWeight: 600 }}>
                        {formatNumber(v, 0)}
                      </td>
                    ))}
                    {[t.cpi, t.spi].map((v, vi) => (
                      <td key={vi} style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: 20, fontSize: 11, fontFamily: 'monospace', fontWeight: 700,
                          background: v >= 1 ? '#DCFCE7' : v >= 0.9 ? '#FFF7ED' : '#FEF2F2',
                          color: getIndexColor(v),
                          border: `1px solid ${v >= 1 ? '#BBF7D0' : v >= 0.9 ? '#FED7AA' : '#FECACA'}`,
                        }}>
                          {formatNumber(v, 2)}
                        </span>
                      </td>
                    ))}
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', color: '#374151', fontWeight: 500 }}>
                      {formatNumber(t.eac, 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .evm-kpi-grid { grid-template-columns: repeat(4, 1fr) !important; }
        @media (min-width: 1280px) { .evm-kpi-grid { grid-template-columns: repeat(7, 1fr) !important; } }
        @media (max-width: 768px)  { .evm-kpi-grid { grid-template-columns: repeat(2, 1fr) !important; } }
      `}</style>
    </div>
  )
}
