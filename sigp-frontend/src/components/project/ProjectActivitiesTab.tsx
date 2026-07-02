import { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  Activity as ActivityIcon, CheckCircle2, Clock, AlertTriangle,
  Plus, Eye, Edit, Trash2, X, CalendarDays, AlertCircle,
} from 'lucide-react';
import { DataTable } from '@/components/ui/data-table/DataTable';
import { Badge } from '@/components/ui/data-display/Badge';
import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/forms/Input';
import { Select } from '@/components/ui/forms/Select';
import { Textarea } from '@/components/ui/forms/Textarea';
import { StatCard } from '@/components/ui/data-display/StatCard';
import { ProgressBar } from '@/components/ui/data-display/ProgressBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/Card';
import {
  SlideOver, SlideOverContent, SlideOverHeader, SlideOverTitle,
  SlideOverBody, SlideOverFooter, SlideOverClose,
} from '@/components/ui/overlays/SlideOver';
import {
  mockActivities,
  type Activity,
  type ActivityStatus,
  type ActivityPriority,
} from '@/mocks/activitiesMocks';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return '—'; }
}

function formatBudget(n: number): string {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n) + ' USD';
}

function statutVariant(s: ActivityStatus): 'success' | 'warning' | 'secondary' | 'destructive' | 'default' {
  switch (s) {
    case 'Terminé':      return 'success';
    case 'En cours':     return 'warning';
    case 'Non démarré':  return 'secondary';
    case 'En retard':    return 'destructive';
    case 'Suspendu':     return 'default';
  }
}

function prioriteVariant(p: ActivityPriority): 'destructive' | 'default' | 'warning' | 'secondary' {
  switch (p) {
    case 'Critique': return 'destructive';
    case 'Haute':    return 'default';
    case 'Moyenne':  return 'warning';
    case 'Faible':   return 'secondary';
  }
}

function avancementColor(pct: number): 'success' | 'primary' | 'warning' | 'destructive' {
  if (pct === 100) return 'success';
  if (pct >= 60)   return 'primary';
  if (pct >= 20)   return 'warning';
  return 'destructive';
}

function getInitiales(nom: string): string {
  return nom
    .split(' ')
    .filter(Boolean)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2) || '—';
}

// ─────────────────────────────────────────────────────────────────────────────
// Form state
// ─────────────────────────────────────────────────────────────────────────────

type ActivityFormState = {
  code:         string;
  responsable:  string;
  libelle:      string;
  description:  string;
  statut:       string; // cast to ActivityStatus on save
  priorite:     string; // cast to ActivityPriority on save
  avancement:   string;
  budgetAlloue: string;
  dateDebut:    string;
  dateFin:      string;
  composante:   string;
};

const EMPTY_FORM: ActivityFormState = {
  code: '', responsable: '', libelle: '', description: '',
  statut: 'Non démarré', priorite: 'Moyenne',
  avancement: '0', budgetAlloue: '',
  dateDebut: '', dateFin: '', composante: '',
};

function formFromActivity(a: Activity): ActivityFormState {
  return {
    code:         a.code,
    responsable:  a.responsable,
    libelle:      a.libelle,
    description:  a.description,
    statut:       a.statut,
    priorite:     a.priorite,
    avancement:   String(a.avancement),
    budgetAlloue: String(a.budgetAlloue),
    dateDebut:    a.dateDebut,
    dateFin:      a.dateFin,
    composante:   a.composante,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SlideOver (view / edit / new) — formulaire contrôlé avec validation
// ─────────────────────────────────────────────────────────────────────────────

type SlideOverMode = 'view' | 'edit' | 'new';

function ActivitySlideOver({
  open, onOpenChange, activity, mode, onSave,
}: {
  open:          boolean;
  onOpenChange:  (open: boolean) => void;
  activity:      Activity | null;
  mode:          SlideOverMode;
  onSave:        (data: Omit<Activity, 'id'>) => void;
}) {
  const titles: Record<SlideOverMode, string> = {
    view: "Détails de l'activité",
    edit: "Modifier l'activité",
    new:  'Nouvelle activité',
  };
  const readOnly = mode === 'view';

  const [form, setForm]     = useState<ActivityFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Réinitialisation à chaque ouverture
  useEffect(() => {
    if (open) {
      setForm(activity && mode !== 'new' ? formFromActivity(activity) : EMPTY_FORM);
      setErrors({});
    }
  }, [open, activity, mode]);

  function set(field: keyof ActivityFormState, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.libelle.trim())     errs.libelle     = 'Requis';
    if (!form.code.trim())        errs.code        = 'Requis';
    if (!form.responsable.trim()) errs.responsable = 'Requis';
    const av = Number(form.avancement);
    if (isNaN(av) || av < 0 || av > 100) errs.avancement = 'Entre 0 et 100';
    if (form.dateDebut && form.dateFin && form.dateFin < form.dateDebut)
      errs.dateFin = 'Date fin antérieure à la date début';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    onSave({
      code:                 form.code.trim(),
      libelle:              form.libelle.trim(),
      responsable:          form.responsable.trim(),
      initialesResponsable: getInitiales(form.responsable),
      description:          form.description.trim(),
      statut:               form.statut as ActivityStatus,
      priorite:             form.priorite as ActivityPriority,
      avancement:           Math.min(100, Math.max(0, Number(form.avancement) || 0)),
      budgetAlloue:         Math.max(0, Number(form.budgetAlloue) || 0),
      dateDebut:            form.dateDebut,
      dateFin:              form.dateFin,
      composante:           form.composante.trim(),
    });
  }

  return (
    <SlideOver open={open} onOpenChange={onOpenChange}>
      <SlideOverContent>
        <SlideOverHeader>
          <SlideOverTitle>{titles[mode]}</SlideOverTitle>
          <SlideOverClose asChild>
            <Button variant="ghost" size="sm" aria-label="Fermer"><X className="h-4 w-4" /></Button>
          </SlideOverClose>
        </SlideOverHeader>

        <SlideOverBody>
          {readOnly && activity ? (
            /* ── Mode lecture ── */
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge variant="outline" className="text-[11px] font-mono">{activity.code}</Badge>
                  <Badge variant={statutVariant(activity.statut)} className="text-[11px]">{activity.statut}</Badge>
                  <Badge variant={prioriteVariant(activity.priorite)} className="text-[11px]">{activity.priorite}</Badge>
                </div>
                <h3 className="text-[15px] font-semibold text-foreground leading-snug">{activity.libelle}</h3>
                <p className="text-[12px] text-muted-foreground leading-relaxed">{activity.description}</p>
              </div>

              <div className="bg-muted/40 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Avancement</p>
                  <span className="font-mono text-[14px] font-bold text-foreground">{activity.avancement}%</span>
                </div>
                <ProgressBar
                  value={activity.avancement}
                  size="md"
                  color={avancementColor(activity.avancement)}
                  aria-label={`Avancement ${activity.avancement}%`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border pt-4">
                <div className="sm:col-span-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Composante</p>
                  <p className="text-[12px] text-muted-foreground">{activity.composante}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Responsable</p>
                  <div className="flex items-center gap-1.5">
                    <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                      {activity.initialesResponsable}
                    </div>
                    <span className="text-[13px] text-foreground">{activity.responsable}</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Budget alloué</p>
                  <p className="font-mono text-[13px] font-semibold text-foreground">{formatBudget(activity.budgetAlloue)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Date début</p>
                  <p className="font-mono text-[13px] text-foreground">{formatDate(activity.dateDebut)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Date fin</p>
                  <p className="font-mono text-[13px] text-foreground">{formatDate(activity.dateFin)}</p>
                </div>
              </div>
            </div>
          ) : (
            /* ── Mode édition / création — formulaire contrôlé ── */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="act-code">Code activité *</label>
                <Input
                  id="act-code"
                  value={form.code}
                  onChange={e => set('code', e.target.value)}
                  placeholder="ACT-X-000"
                  className={errors.code ? 'border-destructive' : ''}
                />
                {errors.code && <p className="text-[11px] text-destructive">{errors.code}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="act-resp">Responsable *</label>
                <Input
                  id="act-resp"
                  value={form.responsable}
                  onChange={e => set('responsable', e.target.value)}
                  placeholder="Prénom Nom"
                  className={errors.responsable ? 'border-destructive' : ''}
                />
                {errors.responsable && <p className="text-[11px] text-destructive">{errors.responsable}</p>}
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-foreground" htmlFor="act-libelle">Libellé *</label>
                <Input
                  id="act-libelle"
                  value={form.libelle}
                  onChange={e => set('libelle', e.target.value)}
                  placeholder="Libellé de l'activité"
                  className={errors.libelle ? 'border-destructive' : ''}
                />
                {errors.libelle && <p className="text-[11px] text-destructive">{errors.libelle}</p>}
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-foreground" htmlFor="act-desc">Description</label>
                <Textarea
                  id="act-desc"
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="Description détaillée de l'activité"
                  rows={3}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="act-statut">Statut</label>
                <Select
                  id="act-statut"
                  value={form.statut}
                  onChange={e => set('statut', e.target.value)}
                >
                  <option value="Non démarré">Non démarré</option>
                  <option value="En cours">En cours</option>
                  <option value="Terminé">Terminé</option>
                  <option value="En retard">En retard</option>
                  <option value="Suspendu">Suspendu</option>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="act-priorite">Priorité</label>
                <Select
                  id="act-priorite"
                  value={form.priorite}
                  onChange={e => set('priorite', e.target.value)}
                >
                  <option value="Critique">Critique</option>
                  <option value="Haute">Haute</option>
                  <option value="Moyenne">Moyenne</option>
                  <option value="Faible">Faible</option>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="act-avancement">Avancement (%)</label>
                <Input
                  id="act-avancement"
                  type="number"
                  min={0}
                  max={100}
                  value={form.avancement}
                  onChange={e => set('avancement', e.target.value)}
                  className={errors.avancement ? 'border-destructive' : ''}
                />
                {errors.avancement && <p className="text-[11px] text-destructive">{errors.avancement}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="act-budget">Budget alloué (USD)</label>
                <Input
                  id="act-budget"
                  type="number"
                  min={0}
                  value={form.budgetAlloue}
                  onChange={e => set('budgetAlloue', e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="act-debut">Date début</label>
                <Input
                  id="act-debut"
                  type="date"
                  value={form.dateDebut}
                  onChange={e => set('dateDebut', e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="act-fin">Date fin</label>
                <Input
                  id="act-fin"
                  type="date"
                  value={form.dateFin}
                  onChange={e => set('dateFin', e.target.value)}
                  className={errors.dateFin ? 'border-destructive' : ''}
                />
                {errors.dateFin && <p className="text-[11px] text-destructive">{errors.dateFin}</p>}
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-foreground" htmlFor="act-composante">Composante</label>
                <Input
                  id="act-composante"
                  value={form.composante}
                  onChange={e => set('composante', e.target.value)}
                  placeholder="Composante du projet"
                />
              </div>

            </div>
          )}
        </SlideOverBody>

        <SlideOverFooter>
          <SlideOverClose asChild>
            <Button variant="outline">{readOnly ? 'Fermer' : 'Annuler'}</Button>
          </SlideOverClose>
          {!readOnly && (
            <Button variant="default" onClick={handleSave}>
              {mode === 'edit' ? 'Enregistrer' : 'Ajouter'}
            </Button>
          )}
        </SlideOverFooter>
      </SlideOverContent>
    </SlideOver>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal de confirmation de suppression
// ─────────────────────────────────────────────────────────────────────────────

function DeleteConfirmModal({
  activity,
  onConfirm,
  onCancel,
}: {
  activity:  Activity | null;
  onConfirm: () => void;
  onCancel:  () => void;
}) {
  if (!activity) return null;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <div className="bg-card border border-border rounded-lg shadow-lg p-6 max-w-sm w-full mx-4 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <h3 id="delete-modal-title" className="text-sm font-bold text-foreground">Supprimer l'activité</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Êtes-vous sûr de vouloir supprimer{' '}
              <span className="font-semibold text-foreground">« {activity.libelle} »</span> ?
              Cette action est irréversible.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>Annuler</Button>
          <Button variant="destructive" size="sm" onClick={onConfirm}>Supprimer</Button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Colonnes du DataTable
// ─────────────────────────────────────────────────────────────────────────────

function buildActivityColumns(
  onView:   (a: Activity) => void,
  onEdit:   (a: Activity) => void,
  onDelete: (id: string) => void,
): ColumnDef<Activity, unknown>[] {
  return [
    {
      id: 'code',
      accessorKey: 'code',
      header: 'Code / Libellé',
      meta: { isSticky: true } as Record<string, unknown>,
      cell: ({ row }) => {
        const { code, libelle, composante } = row.original;
        return (
          <div className="flex flex-col gap-0.5 min-w-[220px] max-w-[320px]">
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="text-[10px] font-mono shrink-0">{code}</Badge>
            </div>
            <span className="text-[13px] font-semibold text-foreground leading-snug line-clamp-2" title={libelle}>{libelle}</span>
            <span className="text-[10px] text-muted-foreground truncate">{composante}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'responsable',
      header: 'Responsable',
      cell: ({ row }) => {
        const { initialesResponsable, responsable } = row.original;
        return (
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
              {initialesResponsable}
            </div>
            <span className="text-[12px] text-foreground truncate">{responsable}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'statut',
      header: 'Statut',
      cell: ({ getValue }) => {
        const s = getValue() as ActivityStatus;
        return <Badge variant={statutVariant(s)} className="text-[11px] w-max">{s}</Badge>;
      },
    },
    {
      accessorKey: 'priorite',
      header: 'Priorité',
      cell: ({ getValue }) => {
        const p = getValue() as ActivityPriority;
        return <Badge variant={prioriteVariant(p)} className="text-[11px] w-max">{p}</Badge>;
      },
    },
    {
      accessorKey: 'avancement',
      header: 'Avancement',
      cell: ({ getValue }) => {
        const pct = getValue() as number;
        return (
          <div className="flex flex-col gap-1 min-w-[90px]">
            <span className="font-mono text-[11px] font-semibold text-foreground">{pct}%</span>
            <ProgressBar value={pct} size="xs" color={avancementColor(pct)} aria-label={`Avancement ${pct}%`} />
          </div>
        );
      },
    },
    {
      accessorKey: 'dateDebut',
      header: 'Date début',
      meta: { align: 'center' } as Record<string, unknown>,
      cell: ({ getValue }) => (
        <div className="flex items-center gap-1 text-[12px] text-muted-foreground">
          <CalendarDays className="h-3 w-3 shrink-0" aria-hidden="true" />
          {formatDate(getValue() as string)}
        </div>
      ),
    },
    {
      accessorKey: 'dateFin',
      header: 'Date fin',
      meta: { align: 'center' } as Record<string, unknown>,
      cell: ({ getValue }) => (
        <span className="font-mono text-[12px] text-muted-foreground">{formatDate(getValue() as string)}</span>
      ),
    },
    {
      id: 'actions',
      enableHiding: false,
      meta: { align: 'right' } as Record<string, unknown>,
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end">
          <Button variant="ghost" size="sm" aria-label="Voir" onClick={() => onView(row.original)}>
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" aria-label="Modifier" onClick={() => onEdit(row.original)}>
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Supprimer"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(row.original.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

export default function ProjectActivitiesTab() {
  const [activities,    setActivities]    = useState<Activity[]>(mockActivities);
  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const [slideOverMode, setSlideOverMode] = useState<SlideOverMode>('new');
  const [selected,      setSelected]      = useState<Activity | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // ── KPIs calculés depuis l'état local (mis à jour après chaque CRUD) ───────
  const kpis = useMemo(() => {
    const total     = activities.length;
    const enCours   = activities.filter(a => a.statut === 'En cours').length;
    const terminees = activities.filter(a => a.statut === 'Terminé').length;
    const enRetard  = activities.filter(a => a.statut === 'En retard').length;
    const tauxGlobal = total > 0
      ? Math.round(activities.reduce((s, a) => s + a.avancement, 0) / total)
      : 0;
    return { total, enCours, terminees, enRetard, tauxGlobal };
  }, [activities]);

  const deleteTarget = useMemo(
    () => activities.find(a => a.id === deleteTargetId) ?? null,
    [activities, deleteTargetId],
  );

  // ── Sauvegarde (création ou modification) ─────────────────────────────────
  function handleSave(data: Omit<Activity, 'id'>) {
    if (slideOverMode === 'new') {
      const newActivity: Activity = {
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        ...data,
      };
      setActivities(prev => [...prev, newActivity]);
    } else if (slideOverMode === 'edit' && selected) {
      setActivities(prev =>
        prev.map(a => a.id === selected.id ? { ...a, ...data } : a)
      );
    }
    setSlideOverOpen(false);
  }

  // ── Suppression confirmée ─────────────────────────────────────────────────
  function handleDeleteConfirm() {
    if (deleteTargetId) {
      setActivities(prev => prev.filter(a => a.id !== deleteTargetId));
      if (selected?.id === deleteTargetId) {
        setSlideOverOpen(false);
        setSelected(null);
      }
    }
    setDeleteTargetId(null);
  }

  const columns = buildActivityColumns(
    (a) => { setSelected(a); setSlideOverMode('view'); setSlideOverOpen(true); },
    (a) => { setSelected(a); setSlideOverMode('edit'); setSlideOverOpen(true); },
    (id) => setDeleteTargetId(id),
  );

  return (
    <section aria-label="Activités du projet" className="flex flex-col gap-6">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
        <div>
          <h1 className="text-base font-bold text-foreground">Activités du Projet</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Suivi de l'avancement physique et des jalons opérationnels
          </p>
        </div>
        <Button
          variant="default"
          size="sm"
          className="h-8 text-xs"
          onClick={() => { setSelected(null); setSlideOverMode('new'); setSlideOverOpen(true); }}
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
          Nouvelle activité
        </Button>
      </div>

      {/* ── KPI Strip (calculé depuis l'état local) ─────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Activités"
          value={kpis.total}
          icon={<ActivityIcon className="h-4 w-4" aria-hidden="true" />}
          iconVariant="primary"
          description={`Taux global ${kpis.tauxGlobal}%`}
        />
        <StatCard
          title="En Cours"
          value={kpis.enCours}
          icon={<Clock className="h-4 w-4" aria-hidden="true" />}
          iconVariant="warning"
          description="En développement actif"
        />
        <StatCard
          title="Terminées"
          value={kpis.terminees}
          icon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
          iconVariant="success"
          description="Complétées et validées"
        />
        <StatCard
          title="En Retard"
          value={kpis.enRetard}
          icon={<AlertTriangle className="h-4 w-4" aria-hidden="true" />}
          iconVariant="destructive"
          description="Dépassement d'échéance"
        />
      </div>

      {/* ── DataTable ─────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Liste des activités</CardTitle>
          <Button
            variant="default"
            size="sm"
            onClick={() => { setSelected(null); setSlideOverMode('new'); setSlideOverOpen(true); }}
          >
            <Plus className="h-4 w-4 mr-1.5" aria-hidden="true" />
            Ajouter
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={activities}
            searchKey="libelle"
            searchPlaceholder="Rechercher une activité..."
            filters={[
              {
                id: 'statut',
                title: 'Statut',
                options: [
                  { label: 'Non démarré', value: 'Non démarré' },
                  { label: 'En cours',    value: 'En cours'    },
                  { label: 'Terminé',     value: 'Terminé'     },
                  { label: 'En retard',   value: 'En retard'   },
                  { label: 'Suspendu',    value: 'Suspendu'    },
                ],
              },
              {
                id: 'priorite',
                title: 'Priorité',
                options: [
                  { label: 'Critique', value: 'Critique' },
                  { label: 'Haute',    value: 'Haute'    },
                  { label: 'Moyenne',  value: 'Moyenne'  },
                  { label: 'Faible',   value: 'Faible'   },
                ],
              },
            ]}
          />
        </CardContent>
      </Card>

      {/* ── SlideOver (vue / édition / création) ──────────────────────────────── */}
      <ActivitySlideOver
        open={slideOverOpen}
        onOpenChange={setSlideOverOpen}
        activity={selected}
        mode={slideOverMode}
        onSave={handleSave}
      />

      {/* ── Modal de confirmation de suppression ──────────────────────────────── */}
      <DeleteConfirmModal
        activity={deleteTarget}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTargetId(null)}
      />

    </section>
  );
}
