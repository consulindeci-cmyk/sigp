import { useState, useEffect, useRef } from 'react';
import { X, Download, CheckCircle2, FileText, AlertCircle, Eye, Play } from 'lucide-react';
import { Button } from '@/components/ui/forms/Button';
import { Select } from '@/components/ui/forms/Select';
import { Input } from '@/components/ui/forms/Input';
import { Badge } from '@/components/ui/data-display/Badge';
import { ProgressBar } from '@/components/ui/data-display/ProgressBar';
import {
  SlideOver, SlideOverContent, SlideOverHeader, SlideOverTitle,
  SlideOverBody, SlideOverFooter, SlideOverClose,
} from '@/components/ui/overlays/SlideOver';
import { formatBadgeVariant } from '@/components/reports/ReportCatalogCard';
import type { ReportTemplate, ReportFormat } from '@/mocks/reportsMocks';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type GenerationMode = 'generate' | 'preview';

export interface ReportGenerationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: ReportTemplate | null;
  mode: GenerationMode;
  onGenerated?: (report: ReportTemplate, format: ReportFormat) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// ReportGenerationSheet
// ─────────────────────────────────────────────────────────────────────────────

export function ReportGenerationSheet({
  open,
  onOpenChange,
  report,
  mode,
  onGenerated,
}: ReportGenerationSheetProps) {
  const [format, setFormat] = useState<ReportFormat>('PDF');
  const [dateDebut, setDateDebut] = useState('2026-01-01');
  const [dateFin, setDateFin] = useState('2026-06-30');
  const [progress, setProgress] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset state on open
  useEffect(() => {
    if (open && report) {
      setFormat(report.formatsDisponibles[0]);
      setProgress(0);
      setGenerating(false);
      setDone(false);
      setPreviewing(false);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [open, report]);

  function runProgress(onComplete: () => void) {
    setProgress(0);
    let p = 0;
    intervalRef.current = setInterval(() => {
      p += 8 + Math.floor(Math.random() * 6);
      if (p >= 100) {
        p = 100;
        clearInterval(intervalRef.current!);
        setProgress(100);
        setTimeout(onComplete, 300);
      } else {
        setProgress(p);
      }
    }, 180);
  }

  function handleGenerate() {
    if (!report) return;
    setGenerating(true);
    setDone(false);
    runProgress(() => {
      setGenerating(false);
      setDone(true);
      onGenerated?.(report, format);
    });
  }

  function handlePreview() {
    if (!report) return;
    setPreviewing(true);
    runProgress(() => {
      setPreviewing(false);
    });
  }

  if (!report) return null;

  const isPreviewMode = mode === 'preview';
  const title = isPreviewMode ? `Aperçu — ${report.nom}` : `Générer — ${report.nom}`;

  return (
    <SlideOver open={open} onOpenChange={onOpenChange}>
      <SlideOverContent className="sm:max-w-lg">
        <SlideOverHeader>
          <div className="flex flex-col gap-1">
            <SlideOverTitle className="text-base">{title}</SlideOverTitle>
            <p className="text-[11px] text-muted-foreground">{report.categorie}</p>
          </div>
          <SlideOverClose asChild>
            <Button variant="ghost" size="sm" aria-label="Fermer">
              <X className="h-4 w-4" />
            </Button>
          </SlideOverClose>
        </SlideOverHeader>

        <SlideOverBody>
          <div className="flex flex-col gap-5">
            {/* Report info */}
            <div className="flex items-start gap-3 bg-muted/40 rounded-lg p-3">
              <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0" aria-hidden="true">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-[13px] font-semibold text-foreground">{report.nom}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{report.description}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {report.formatsDisponibles.map((f) => (
                    <Badge key={f} variant={formatBadgeVariant(f)} className="text-[10px] px-1.5 py-0">{f}</Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Config form */}
            {!done && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground" htmlFor="rpt-format">
                    Format d'export
                  </label>
                  <Select
                    id="rpt-format"
                    value={format}
                    onChange={(e) => setFormat(e.target.value as ReportFormat)}
                    disabled={generating || previewing}
                  >
                    {report.formatsDisponibles.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground" htmlFor="rpt-debut">
                      Date début
                    </label>
                    <Input
                      id="rpt-debut"
                      type="date"
                      value={dateDebut}
                      onChange={(e) => setDateDebut(e.target.value)}
                      disabled={generating || previewing}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground" htmlFor="rpt-fin">
                      Date fin
                    </label>
                    <Input
                      id="rpt-fin"
                      type="date"
                      value={dateFin}
                      onChange={(e) => setDateFin(e.target.value)}
                      disabled={generating || previewing}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground" htmlFor="rpt-projet">
                    Périmètre projet (optionnel)
                  </label>
                  <Select id="rpt-projet" disabled={generating || previewing}>
                    <option value="">Tous les projets</option>
                    <option value="p1">Électrification Solaire Zones Rurales</option>
                    <option value="p2">Accès Eau Potable et Assainissement Rural</option>
                    <option value="p3">Santé Maternelle et Infantile</option>
                    <option value="p4">Appui à la Filière Agricole Nord</option>
                    <option value="p5">Gouvernance Locale et Décentralisation</option>
                  </Select>
                </div>
              </div>
            )}

            {/* Progress */}
            {(generating || previewing) && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-muted-foreground">
                    {isPreviewMode ? 'Chargement de l\'aperçu...' : 'Génération en cours...'}
                  </span>
                  <span className="font-mono font-semibold text-foreground">{progress}%</span>
                </div>
                <ProgressBar
                  value={progress}
                  size="sm"
                  color="primary"
                  aria-label={`Progression ${progress}%`}
                />
              </div>
            )}

            {/* Success state */}
            {done && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-success text-sm bg-success/10 rounded-md px-4 py-3 border border-success/20">
                  <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <div>
                    <p className="font-medium">Rapport généré avec succès</p>
                    <p className="text-[11px] text-success/80 mt-0.5">
                      {report.nom} — {format} · {dateDebut} → {dateFin}
                    </p>
                  </div>
                </div>
                <Button
                  variant="default"
                  className="w-full gap-2"
                  leftIcon={<Download className="h-4 w-4" />}
                  onClick={() => {}}
                  aria-label="Télécharger le rapport généré"
                >
                  Télécharger le {format}
                </Button>
                <p className="text-[10px] text-center text-muted-foreground">Téléchargement simulé — aucune API</p>
              </div>
            )}

            {/* Preview placeholder */}
            {isPreviewMode && !previewing && !done && (
              <div className="border border-border rounded-lg p-4 bg-muted/20 min-h-[180px] flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <AlertCircle className="h-8 w-8" aria-hidden="true" />
                <p className="text-[12px] text-center">
                  Cliquez sur « Aperçu » pour charger la prévisualisation simulée
                </p>
              </div>
            )}

            {isPreviewMode && !previewing && progress === 100 && !done && (
              <div className="border border-border rounded-lg p-4 bg-muted/10 min-h-[180px] flex flex-col gap-3">
                <div className="h-3 bg-muted rounded w-2/3" aria-hidden="true" />
                <div className="h-2 bg-muted/60 rounded w-full" aria-hidden="true" />
                <div className="h-2 bg-muted/60 rounded w-4/5" aria-hidden="true" />
                <div className="h-2 bg-muted/60 rounded w-full" aria-hidden="true" />
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {[45, 68, 92].map((v, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div className="h-12 w-full bg-primary/20 rounded-sm" style={{ height: `${v / 2}px` }} aria-hidden="true" />
                      <div className="h-1.5 bg-muted/60 rounded w-4/5" aria-hidden="true" />
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-center text-muted-foreground mt-1">Prévisualisation simulée</p>
              </div>
            )}
          </div>
        </SlideOverBody>

        <SlideOverFooter>
          <SlideOverClose asChild>
            <Button variant="outline">{done ? 'Fermer' : 'Annuler'}</Button>
          </SlideOverClose>
          {!done && (
            <Button
              variant="default"
              onClick={isPreviewMode ? handlePreview : handleGenerate}
              disabled={generating || previewing}
              leftIcon={isPreviewMode ? <Eye className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            >
              {isPreviewMode
                ? (previewing ? 'Chargement...' : 'Aperçu')
                : (generating ? 'Génération...' : 'Générer')
              }
            </Button>
          )}
        </SlideOverFooter>
      </SlideOverContent>
    </SlideOver>
  );
}

