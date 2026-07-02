import { useState, useEffect, useMemo } from 'react';
import { X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/forms/Input';
import { Textarea } from '@/components/ui/forms/Textarea';
import {
  SlideOver, SlideOverContent, SlideOverHeader, SlideOverTitle,
  SlideOverBody, SlideOverFooter, SlideOverClose,
} from '@/components/ui/overlays/SlideOver';
import { Badge } from '@/components/ui/data-display/Badge';
import type { EvmPeriode } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

type IndexVariant = 'success' | 'warning' | 'destructive';

function getVariant(v: number): IndexVariant {
  if (v >= 1) return 'success';
  if (v >= 0.9) return 'warning';
  return 'destructive';
}

function IndexIcon({ v }: { v: number }) {
  if (v >= 1)   return <TrendingUp  size={12} className="text-success" />;
  if (v >= 0.9) return <Minus       size={12} className="text-warning" />;
  return              <TrendingDown size={12} className="text-destructive" />;
}

function fmt(n: number, decimals = 0): string {
  return n.toLocaleString('fr-FR', { maximumFractionDigits: decimals });
}

// ─────────────────────────────────────────────────────────────────────────────
// Form state
// ─────────────────────────────────────────────────────────────────────────────

interface FormState {
  dateControle: string; // YYYY-MM
  bac: string;
  pv: string;
  ev: string;
  ac: string;
  commentaire: string;
}

const EMPTY: FormState = {
  dateControle: new Date().toISOString().slice(0, 7),
  bac: '', pv: '', ev: '', ac: '',
  commentaire: '',
};

function fromPeriode(p: EvmPeriode): FormState {
  return {
    dateControle: p.dateControle,
    bac: String(p.bac),
    pv: String(p.pv),
    ev: String(p.ev),
    ac: String(p.ac),
    commentaire: p.commentaire,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface EvmSaisieSlideOverProps {
  open: boolean;
  onClose: () => void;
  mode: 'new' | 'edit' | 'view';
  periode?: EvmPeriode | null;
  onSave: (form: FormState) => void;
  onDelete?: (id: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Preview row
// ─────────────────────────────────────────────────────────────────────────────

function PreviewRow({
  label, value, suffix = '', variant,
}: {
  label: string; value: string | number; suffix?: string; variant?: IndexVariant | 'neutral';
}) {
  const colorClass =
    variant === 'success'     ? 'text-success'
    : variant === 'warning'   ? 'text-warning'
    : variant === 'destructive' ? 'text-destructive'
    : 'text-foreground';
  return (
    <div className="flex items-center justify-between py-1 border-b border-border/50 last:border-0">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className={`font-mono text-[11px] font-semibold tabular-nums ${colorClass}`}>
        {typeof value === 'number' ? fmt(value) : value}{suffix}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function EvmSaisieSlideOver({
  open, onClose, mode, periode, onSave, onDelete,
}: EvmSaisieSlideOverProps) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isView = mode === 'view';

  useEffect(() => {
    if (open) {
      setForm(periode && mode !== 'new' ? fromPeriode(periode) : EMPTY);
      setErrors({});
      setConfirmDelete(false);
    }
  }, [open, mode, periode]);

  const set = (k: keyof FormState, v: string) =>
    setForm(prev => ({ ...prev, [k]: v }));

  // Live EVM preview — all derived indicators calculated in real time
  const preview = useMemo(() => {
    const bac = parseFloat(form.bac) || 0;
    const pv  = parseFloat(form.pv)  || 0;
    const ev  = parseFloat(form.ev)  || 0;
    const ac  = parseFloat(form.ac)  || 0;

    if (bac <= 0 || (pv === 0 && ev === 0 && ac === 0)) return null;

    const cv     = ev - ac;
    const sv     = ev - pv;
    const cvPct  = ev > 0   ? Math.round((cv / ev) * 100)   : 0;
    const svPct  = pv > 0   ? Math.round((sv / pv) * 100)   : 0;
    const cpi    = ac > 0   ? ev / ac    : 1;
    const spi    = pv > 0   ? ev / pv    : 1;
    const eac1   = cpi > 0  ? bac / cpi : bac;                         // BAC/CPI
    const eac2   = ac + (bac - ev);                                     // AC + (BAC-EV) au budget
    const eac3   = ac + (cpi > 0 ? (bac - ev) / cpi : (bac - ev));    // AC + (BAC-EV)/CPI
    const eac4   = (cpi > 0 && spi > 0) ? ac + (bac - ev) / (cpi * spi) : eac2;
    const etc    = eac1 - ac;
    const vac    = bac - eac1;
    const tcpi   = (eac1 - ac) > 0 ? (bac - ev) / (eac1 - ac) : 1;
    const pctCpl = bac > 0  ? Math.round((ev / bac) * 100) : 0;

    return { bac, pv, ev, ac, cv, sv, cvPct, svPct, cpi, spi, eac1, eac2, eac3, eac4, etc, vac, tcpi, pctCpl };
  }, [form.bac, form.pv, form.ev, form.ac]);

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.dateControle) e.dateControle = 'Date requise';
    const bac = parseFloat(form.bac);
    if (!form.bac || bac <= 0) e.bac = 'BAC requis (> 0)';
    const pv = parseFloat(form.pv);
    if (!form.pv || pv < 0) e.pv = 'PV requis (≥ 0)';
    const ev = parseFloat(form.ev);
    if (form.ev === '' || ev < 0) e.ev = 'EV requis (≥ 0)';
    const ac = parseFloat(form.ac);
    if (form.ac === '' || ac < 0) e.ac = 'AC requis (≥ 0)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave(form);
    onClose();
  };

  const handleDelete = () => {
    if (periode && onDelete) {
      onDelete(periode.id);
      onClose();
    }
  };

  const title =
    mode === 'new'  ? 'Nouvelle saisie EVM'
    : mode === 'edit' ? 'Modifier la période'
    : `Période — ${periode?.label ?? ''}`;

  const LABEL = 'block text-xs font-semibold text-muted-foreground mb-1';

  return (
    <SlideOver open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <SlideOverContent className="w-full max-w-2xl">
        <SlideOverHeader className="flex items-center justify-between gap-2 px-6 py-4 border-b border-border bg-card">
          <SlideOverTitle className="text-base font-bold text-foreground">{title}</SlideOverTitle>
          <SlideOverClose asChild>
            <button className="rounded-md p-1 hover:bg-muted text-muted-foreground" aria-label="Fermer">
              <X size={16} />
            </button>
          </SlideOverClose>
        </SlideOverHeader>

        <SlideOverBody className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* ── Formulaire de saisie ────────────────────────────────────── */}
            <div className="flex flex-col gap-4">
              <p className="text-xs font-bold text-foreground uppercase tracking-wide">Données d'entrée</p>

              <div>
                <label className={LABEL}>Période (mois) *</label>
                <input
                  type="month"
                  value={form.dateControle}
                  onChange={e => set('dateControle', e.target.value)}
                  disabled={isView}
                  className="w-full h-9 px-3 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                />
                {errors.dateControle && <p className="text-xs text-destructive mt-1">{errors.dateControle}</p>}
              </div>

              <div>
                <label className={LABEL}>BAC — Budget à l'achèvement *</label>
                <Input
                  type="number" min={0}
                  value={form.bac}
                  onChange={e => set('bac', e.target.value)}
                  placeholder="500 000"
                  disabled={isView}
                />
                {errors.bac && <p className="text-xs text-destructive mt-1">{errors.bac}</p>}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={LABEL}>PV (cumulatif) *</label>
                  <Input type="number" min={0} value={form.pv} onChange={e => set('pv', e.target.value)} placeholder="0" disabled={isView} />
                  <p className="text-[10px] text-muted-foreground mt-1">Valeur planifiée</p>
                  {errors.pv && <p className="text-xs text-destructive mt-1">{errors.pv}</p>}
                </div>
                <div>
                  <label className={LABEL}>EV (cumulatif) *</label>
                  <Input type="number" min={0} value={form.ev} onChange={e => set('ev', e.target.value)} placeholder="0" disabled={isView} />
                  <p className="text-[10px] text-muted-foreground mt-1">Valeur acquise</p>
                  {errors.ev && <p className="text-xs text-destructive mt-1">{errors.ev}</p>}
                </div>
                <div>
                  <label className={LABEL}>AC (cumulatif) *</label>
                  <Input type="number" min={0} value={form.ac} onChange={e => set('ac', e.target.value)} placeholder="0" disabled={isView} />
                  <p className="text-[10px] text-muted-foreground mt-1">Coût réel</p>
                  {errors.ac && <p className="text-xs text-destructive mt-1">{errors.ac}</p>}
                </div>
              </div>

              <div>
                <label className={LABEL}>Analyse de la variance / Commentaire</label>
                <Textarea
                  value={form.commentaire}
                  onChange={e => set('commentaire', e.target.value)}
                  placeholder="Expliquer les écarts CV et SV : causes, actions correctives, risques..."
                  rows={4}
                  disabled={isView}
                  className="text-sm"
                />
              </div>
            </div>

            {/* ── Tableau de bord calculé ─────────────────────────────────── */}
            <div className="flex flex-col gap-4">
              <p className="text-xs font-bold text-foreground uppercase tracking-wide">Indicateurs calculés</p>

              {!preview ? (
                <div className="flex items-center justify-center h-48 border border-dashed border-border rounded-lg">
                  <p className="text-xs text-muted-foreground text-center px-4">
                    Saisissez BAC, PV, EV, AC<br />pour voir les indicateurs calculés en temps réel
                  </p>
                </div>
              ) : (
                <div className="bg-muted/20 border border-border rounded-lg px-4 py-3 flex flex-col gap-0.5">

                  {/* Complétion */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">% Complété (EV/BAC)</span>
                    <span className="font-mono text-base font-extrabold text-primary">{preview.pctCpl}%</span>
                  </div>

                  {/* Écarts */}
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Écarts</p>
                  <PreviewRow label="CV (EV−AC)" value={preview.cv} suffix=" FCFA" variant={preview.cv >= 0 ? 'success' : 'destructive'} />
                  <PreviewRow label="CV %" value={`${preview.cvPct > 0 ? '+' : ''}${preview.cvPct}%`} variant={preview.cvPct >= 0 ? 'success' : 'destructive'} />
                  <PreviewRow label="SV (EV−PV)" value={preview.sv} suffix=" FCFA" variant={preview.sv >= 0 ? 'success' : 'destructive'} />
                  <PreviewRow label="SV %" value={`${preview.svPct > 0 ? '+' : ''}${preview.svPct}%`} variant={preview.svPct >= 0 ? 'success' : 'destructive'} />

                  {/* Indices */}
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-3 mb-1">Indices de performance</p>
                  <div className="flex items-center justify-between py-1 border-b border-border/50">
                    <span className="text-[11px] text-muted-foreground">CPI (EV/AC)</span>
                    <div className="flex items-center gap-1.5">
                      <IndexIcon v={preview.cpi} />
                      <Badge variant={getVariant(preview.cpi)} className="font-mono text-[10px]">{preview.cpi.toFixed(2)}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-border/50">
                    <span className="text-[11px] text-muted-foreground">SPI (EV/PV)</span>
                    <div className="flex items-center gap-1.5">
                      <IndexIcon v={preview.spi} />
                      <Badge variant={getVariant(preview.spi)} className="font-mono text-[10px]">{preview.spi.toFixed(2)}</Badge>
                    </div>
                  </div>

                  {/* EAC — 4 méthodes */}
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-3 mb-1">EAC — 4 méthodes (PMBOK)</p>
                  <PreviewRow label="EAC₁ = BAC/CPI" value={preview.eac1} suffix=" FCFA" variant={preview.eac1 > preview.bac ? 'destructive' : 'success'} />
                  <PreviewRow label="EAC₂ = AC+(BAC−EV)" value={preview.eac2} suffix=" FCFA" variant={preview.eac2 > preview.bac ? 'destructive' : 'success'} />
                  <PreviewRow label="EAC₃ = AC+(BAC−EV)/CPI" value={preview.eac3} suffix=" FCFA" variant={preview.eac3 > preview.bac ? 'destructive' : 'success'} />
                  <PreviewRow label="EAC₄ = AC+(BAC−EV)/(CPI×SPI)" value={preview.eac4} suffix=" FCFA" variant={preview.eac4 > preview.bac ? 'destructive' : 'warning'} />

                  {/* Reste */}
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-3 mb-1">Projections</p>
                  <PreviewRow label="ETC (Coût restant)" value={preview.etc} suffix=" FCFA" variant={preview.etc > 0 ? 'neutral' : 'success'} />
                  <PreviewRow label="VAC (Variation finales)" value={preview.vac} suffix=" FCFA" variant={preview.vac >= 0 ? 'success' : 'destructive'} />
                  <div className="flex items-center justify-between py-1 border-b border-border/50 last:border-0">
                    <span className="text-[11px] text-muted-foreground">TCPI</span>
                    <Badge variant={preview.tcpi <= 1 ? 'success' : preview.tcpi <= 1.1 ? 'warning' : 'destructive'} className="font-mono text-[10px]">
                      {preview.tcpi.toFixed(2)} {preview.tcpi <= 1 ? '✓' : preview.tcpi <= 1.1 ? '⚠' : '✗'}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </div>
        </SlideOverBody>

        <SlideOverFooter className="flex items-center justify-between gap-2 px-6 py-4 border-t border-border bg-card">
          <div>
            {!isView && mode === 'edit' && periode && onDelete && (
              confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-destructive font-medium">Supprimer cette période ?</span>
                  <button className="text-xs font-semibold text-destructive underline underline-offset-2" onClick={handleDelete}>Oui</button>
                  <button className="text-xs text-muted-foreground underline underline-offset-2" onClick={() => setConfirmDelete(false)}>Non</button>
                </div>
              ) : (
                <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 h-8 text-xs"
                  onClick={() => setConfirmDelete(true)}>
                  Supprimer
                </Button>
              )
            )}
          </div>
          <div className="flex items-center gap-2">
            <SlideOverClose asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                {isView ? 'Fermer' : 'Annuler'}
              </Button>
            </SlideOverClose>
            {!isView && (
              <Button variant="default" size="sm" className="h-8 text-xs" onClick={handleSave}>
                Enregistrer
              </Button>
            )}
          </div>
        </SlideOverFooter>
      </SlideOverContent>
    </SlideOver>
  );
}
