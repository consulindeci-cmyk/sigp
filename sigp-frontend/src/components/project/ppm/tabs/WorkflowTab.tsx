import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/data-display/Badge';
import { Button } from '@/components/ui/forms/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/Card';
import {
  CheckCircle2, Circle, Send, User, CalendarDays,
  FileCheck, Building2, CheckCheck, ShieldCheck, CheckSquare, Info,
} from 'lucide-react';
import type { PPMVersion } from '@/types';

// ─── Stages ──────────────────────────────────────────────────────────────────

const STAGE_ORDER: string[] = [
  'BROUILLON', 'SOUMIS', 'VALIDATION_N1', 'VALIDATION_BAILLEUR', 'APPROUVE',
];

interface Stage {
  key: string;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STAGES: Stage[] = [
  { key: 'BROUILLON',           label: 'Brouillon',       desc: 'Rédaction du plan',                 icon: FileCheck    },
  { key: 'SOUMIS',              label: 'Soumis',          desc: 'Soumis pour validation interne',    icon: Send         },
  { key: 'VALIDATION_N1',       label: 'Validation N+1',  desc: 'Approbation du responsable',        icon: CheckSquare  },
  { key: 'VALIDATION_BAILLEUR', label: 'ANO Bailleur',    desc: "Avis de Non Objection",             icon: ShieldCheck  },
  { key: 'APPROUVE',            label: 'Approuvé',        desc: 'Plan actif et en vigueur',          icon: CheckCheck   },
];

type BadgeVariant = 'secondary' | 'warning' | 'info' | 'success' | 'default';

const VERSION_BADGE: Record<string, { label: string; variant: BadgeVariant }> = {
  BROUILLON:           { label: 'Brouillon',  variant: 'secondary' },
  SOUMIS:              { label: 'Soumis',     variant: 'warning'   },
  VALIDATION_N1:       { label: 'Valid. N+1', variant: 'warning'   },
  VALIDATION_BAILLEUR: { label: 'ANO',        variant: 'info'      },
  APPROUVE:            { label: 'Approuvé',   variant: 'success'   },
  CLOTURE:             { label: 'Clôturé',    variant: 'secondary' },
};

// Mock workflow events — inline (no backend)
interface WorkflowEvent {
  date: string;
  acteur: string;
  action: string;
  commentaire?: string;
}

const MOCK_EVENTS_V10: WorkflowEvent[] = [
  { date: '15/01/2026 10:00', acteur: 'Jean Dupont',     action: 'Brouillon créé',              commentaire: 'Première version du PPM exercice 2026.' },
  { date: '22/01/2026 14:15', acteur: 'Jean Dupont',     action: 'Soumis pour validation',      commentaire: "Soumission à l'approbation N+1." },
  { date: '25/01/2026 09:30', acteur: 'Marie Curie',     action: 'Validé N+1',                  commentaire: 'Conforme au PTBA et au budget approuvé.' },
  { date: '28/01/2026 11:00', acteur: 'Marie Curie',     action: 'Transmis au bailleur (ANO)',   commentaire: "Transmission pour Avis de Non Objection." },
  { date: '01/02/2026 14:30', acteur: 'Banque Mondiale', action: 'ANO accordé — PPM approuvé',  commentaire: "Plan jugé conforme aux règles de passation." },
];

const MOCK_EVENTS_V11: WorkflowEvent[] = [
  { date: '10/06/2026 09:15', acteur: 'Marie Curie', action: 'Brouillon créé', commentaire: 'Révision suite aux avenants Q2 2026.' },
];

function getEvents(versionId?: string): WorkflowEvent[] {
  if (versionId === 'ppm-v1.0') return MOCK_EVENTS_V10;
  if (versionId === 'ppm-v1.1') return MOCK_EVENTS_V11;
  return [];
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface WorkflowTabProps {
  versions: PPMVersion[];
  activeVersion: PPMVersion | undefined;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Component ───────────────────────────────────────────────────────────────

export function WorkflowTab({ versions, activeVersion }: WorkflowTabProps) {
  const currentIdx = STAGE_ORDER.indexOf(activeVersion?.statut ?? 'BROUILLON');
  const events      = getEvents(activeVersion?.id);

  return (
    <div className="flex flex-col gap-5 max-w-4xl mx-auto">

      {/* ── Avertissement démo ────────────────────────────────────────────── */}
      <div className="flex items-start gap-2.5 bg-muted/40 border border-border rounded-lg px-4 py-3">
        <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">Démo — </span>
          ce circuit d'approbation (étapes, journal, historique des versions) n'est pas encore relié au backend :
          il n'existe aujourd'hui qu'une seule version par projet, dérivée du statut des marchés. Aucune action
          effectuée ici n'est persistée.
        </p>
      </div>

      {/* ── Stepper ────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            Workflow — Version {activeVersion?.numero_version ?? '—'}
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">Démo</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop stepper */}
          <div className="relative hidden sm:block mb-6">
            {/* Background track */}
            <div
              className="absolute top-5 left-5 right-5 h-0.5 bg-border"
              aria-hidden="true"
            />
            {/* Progress track */}
            <div
              className="absolute top-5 left-5 h-0.5 bg-primary transition-all duration-700"
              style={{ width: `calc(${Math.max(0, currentIdx) / (STAGES.length - 1) * 100}% - ${currentIdx === 0 ? 0 : 0}px)` }}
              aria-hidden="true"
            />
            <div className="relative grid grid-cols-5 gap-2">
              {STAGES.map((stage, i) => {
                const done    = i < currentIdx;
                const current = i === currentIdx;
                const Icon    = stage.icon;
                return (
                  <div key={stage.key} className="flex flex-col items-center gap-2 px-1">
                    <div className={cn(
                      'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 bg-background transition-all',
                      done    && 'border-primary bg-primary text-primary-foreground',
                      current && 'border-primary text-primary ring-4 ring-primary/20',
                      !done && !current && 'border-border text-muted-foreground',
                    )}>
                      {done
                        ? <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                        : current
                          ? <Icon className="h-5 w-5" aria-hidden="true" />
                          : <Circle className="h-5 w-5" aria-hidden="true" />
                      }
                    </div>
                    <div className="text-center">
                      <p className={cn(
                        'text-[11px] font-semibold',
                        done || current ? 'text-foreground' : 'text-muted-foreground',
                      )}>
                        {stage.label}
                      </p>
                      <p className="text-[9px] text-muted-foreground leading-tight mt-0.5">
                        {stage.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile stepper */}
          <div className="sm:hidden flex flex-col gap-3 mb-6">
            {STAGES.map((stage, i) => {
              const done    = i < currentIdx;
              const current = i === currentIdx;
              const Icon    = stage.icon;
              return (
                <div key={stage.key} className={cn(
                  'flex items-center gap-3 rounded-lg border px-3 py-2',
                  current && 'border-primary bg-primary/5',
                  done && 'border-success/30 bg-success/5',
                  !done && !current && 'border-border bg-background',
                )}>
                  <div className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2',
                    done    && 'border-success bg-success text-success-foreground',
                    current && 'border-primary text-primary',
                    !done && !current && 'border-border text-muted-foreground',
                  )}>
                    {done
                      ? <CheckCircle2 className="h-4 w-4" />
                      : current
                        ? <Icon className="h-4 w-4" />
                        : <Circle className="h-4 w-4" />
                    }
                  </div>
                  <div>
                    <p className={cn('text-[12px] font-semibold', done || current ? 'text-foreground' : 'text-muted-foreground')}>
                      {stage.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{stage.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Info cards: créé par / approuvé par */}
          {activeVersion && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="rounded-lg border border-border bg-muted/20 p-4 flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                  <User className="h-3 w-3" aria-hidden="true" />Créé par
                </div>
                <p className="text-sm font-semibold text-foreground">{activeVersion.cree_par}</p>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <CalendarDays className="h-3 w-3" aria-hidden="true" />
                  {fmtDate(activeVersion.date_creation)}
                </div>
              </div>

              <div className={cn(
                'rounded-lg border p-4 flex flex-col gap-1.5',
                activeVersion.approuve_par
                  ? 'border-success/30 bg-success/5'
                  : 'border-border bg-muted/20',
              )}>
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                  <Building2 className="h-3 w-3" aria-hidden="true" />Approuvé par
                </div>
                <p className={cn(
                  'text-sm font-semibold',
                  activeVersion.approuve_par ? 'text-success' : 'text-muted-foreground',
                )}>
                  {activeVersion.approuve_par ?? "En attente d'approbation"}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <CalendarDays className="h-3 w-3" aria-hidden="true" />
                  {fmtDate(activeVersion.date_approbation)}
                </div>
              </div>
            </div>
          )}

          {/* Action button — désactivé : aucun backend de workflow n'existe */}
          {activeVersion?.statut === 'BROUILLON' && (
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button
                variant="default"
                disabled
                leftIcon={<Send className="h-4 w-4" />}
                title="Simulation visuelle — le circuit d'approbation réel n'est pas connecté au backend"
              >
                Soumettre pour approbation
              </Button>
              <p className="text-[11px] text-muted-foreground">
                Bouton désactivé — simulation visuelle uniquement, aucun circuit d'approbation réel n'est connecté.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Journal des événements ─────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Journal d'approbation — Version {activeVersion?.numero_version ?? '—'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun événement enregistré.</p>
          ) : (
            <div className="relative flex flex-col gap-0">
              {/* Vertical line */}
              <div
                className="absolute left-3.5 top-4 bottom-4 w-px bg-border"
                aria-hidden="true"
              />
              {events.map((ev, i) => (
                <div key={i} className="relative flex items-start gap-4 pb-5 last:pb-0">
                  <div className={cn(
                    'relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 bg-background',
                    i === events.length - 1
                      ? 'border-primary text-primary'
                      : 'border-border text-muted-foreground',
                  )}>
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="text-[12px] font-semibold text-foreground">{ev.action}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{ev.date}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Par <span className="font-medium text-foreground">{ev.acteur}</span>
                      {ev.commentaire && ` — ${ev.commentaire}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Historique des versions ────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Toutes les versions du PPM</CardTitle>
        </CardHeader>
        <CardContent>
          {versions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune version disponible.</p>
          ) : (
            <div className="divide-y divide-border">
              {versions.map(v => {
                const entry    = VERSION_BADGE[v.statut];
                const isActive = activeVersion?.id === v.id;
                return (
                  <div
                    key={v.id}
                    className={cn(
                      'flex items-center justify-between gap-3 py-3',
                      isActive && 'rounded-md bg-primary/5 -mx-4 px-4',
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        'h-9 w-9 rounded-md flex items-center justify-center shrink-0 text-[10px] font-bold',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground',
                      )}>
                        {v.numero_version}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-foreground">
                            Version {v.numero_version}
                          </span>
                          {isActive && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              Active
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">
                          Créé par {v.cree_par} le {fmtDate(v.date_creation)}
                          {v.approuve_par && ` · ANO : ${v.approuve_par}`}
                        </p>
                      </div>
                    </div>
                    <Badge variant={entry?.variant ?? 'default'} className="text-[11px] shrink-0">
                      {entry?.label ?? v.statut}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
