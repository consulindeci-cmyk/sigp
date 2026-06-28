import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  Activity as ActivityIcon, CheckCircle2, Clock, AlertTriangle,
  Plus, Eye, Edit, Trash2, X, CalendarDays,
} from 'lucide-react';
import { DataTable } from '@/components/ui/data-table/DataTable';
import { Badge } from '@/components/ui/data-display/Badge';
import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/forms/Input';
import { Select } from '@/components/ui/forms/Select';
import { StatCard } from '@/components/ui/data-display/StatCard';
import { ProgressBar } from '@/components/ui/data-display/ProgressBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/Card';
import {
  SlideOver, SlideOverContent, SlideOverHeader, SlideOverTitle,
  SlideOverBody, SlideOverFooter, SlideOverClose,
} from '@/components/ui/overlays/SlideOver';
import {
  mockActivities,
  mockActivitiesKPIs,
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

// ─────────────────────────────────────────────────────────────────────────────
// SlideOver
// ─────────────────────────────────────────────────────────────────────────────

type SlideOverMode = 'view' | 'edit' | 'new';

function ActivitySlideOver({
  open, onOpenChange, activity, mode,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: Activity | null;
  mode: SlideOverMode;
}) {
  const titles: Record<SlideOverMode, string> = {
    view: "Détails de l'activité",
    edit: "Modifier l'activité",
    new:  'Nouvelle activité',
  };
  const readOnly = mode === 'view';

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
                <ProgressBar value={activity.avancement} size="md" color={avancementColor(activity.avancement)} aria-label={`Avancement ${activity.avancement}%`} />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="act-code">Code activité</label>
                <Input id="act-code" defaultValue={activity?.code ?? ''} placeholder="ACT-X-000" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="act-resp">Responsable</label>
                <Input id="act-resp" defaultValue={activity?.responsable ?? ''} placeholder="Nom du responsable" />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-foreground" htmlFor="act-libelle">Libellé</label>
                <Input id="act-libelle" defaultValue={activity?.libelle ?? ''} placeholder="Libellé de l'activité" />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-foreground" htmlFor="act-desc">Description</label>
                <Input id="act-desc" defaultValue={activity?.description ?? ''} placeholder="Description" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="act-statut">Statut</label>
                <Select id="act-statut" defaultValue={activity?.statut ?? 'Non démarré'}>
                  <option value="Non démarré">Non démarré</option>
                  <option value="En cours">En cours</option>
                  <option value="Terminé">Terminé</option>
                  <option value="En retard">En retard</option>
                  <option value="Suspendu">Suspendu</option>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="act-priorite">Priorité</label>
                <Select id="act-priorite" defaultValue={activity?.priorite ?? 'Moyenne'}>
                  <option value="Critique">Critique</option>
                  <option value="Haute">Haute</option>
                  <option value="Moyenne">Moyenne</option>
                  <option value="Faible">Faible</option>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="act-avancement">Avancement (%)</label>
                <Input id="act-avancement" type="number" min={0} max={100} defaultValue={activity?.avancement ?? 0} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="act-budget">Budget alloué (USD)</label>
                <Input id="act-budget" type="number" min={0} defaultValue={activity?.budgetAlloue ?? ''} placeholder="0" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="act-debut">Date début</label>
                <Input id="act-debut" type="date" defaultValue={activity?.dateDebut ?? ''} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="act-fin">Date fin</label>
                <Input id="act-fin" type="date" defaultValue={activity?.dateFin ?? ''} />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-foreground" htmlFor="act-composante">Composante</label>
                <Input id="act-composante" defaultValue={activity?.composante ?? ''} placeholder="Composante du projet" />
              </div>
            </div>
          )}
        </SlideOverBody>

        <SlideOverFooter>
          <SlideOverClose asChild>
            <Button variant="outline">{readOnly ? 'Fermer' : 'Annuler'}</Button>
          </SlideOverClose>
          {!readOnly && (
            <SlideOverClose asChild>
              <Button variant="default">{mode === 'edit' ? 'Enregistrer' : 'Ajouter'}</Button>
            </SlideOverClose>
          )}
        </SlideOverFooter>
      </SlideOverContent>
    </SlideOver>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Columns
// ─────────────────────────────────────────────────────────────────────────────

function buildActivityColumns(
  onView: (a: Activity) => void,
  onEdit: (a: Activity) => void,
  onDelete: (id: string) => void,
): ColumnDef<Activity, any>[] {
  return [
    {
      id: 'code',
      accessorKey: 'code',
      header: 'Code / Libellé',
      meta: { isSticky: true } as any,
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
      meta: { align: 'center' } as any,
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
      meta: { align: 'center' } as any,
      cell: ({ getValue }) => (
        <span className="font-mono text-[12px] text-muted-foreground">{formatDate(getValue() as string)}</span>
      ),
    },
    {
      id: 'actions',
      enableHiding: false,
      meta: { align: 'right' } as any,
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end">
          <Button variant="ghost" size="sm" aria-label="Voir" onClick={() => onView(row.original)}>
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" aria-label="Modifier" onClick={() => onEdit(row.original)}>
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" aria-label="Supprimer"
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
// Main export
// ─────────────────────────────────────────────────────────────────────────────

export default function ProjectActivitiesTab() {
  const [activities, setActivities] = useState<Activity[]>(mockActivities);
  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const [slideOverMode, setSlideOverMode] = useState<SlideOverMode>('new');
  const [selected, setSelected] = useState<Activity | null>(null);

  const columns = buildActivityColumns(
    (a) => { setSelected(a); setSlideOverMode('view'); setSlideOverOpen(true); },
    (a) => { setSelected(a); setSlideOverMode('edit'); setSlideOverOpen(true); },
    (id) => setActivities((prev) => prev.filter((a) => a.id !== id)),
  );

  return (
    <section aria-label="Activités du projet" className="flex flex-col gap-6">

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Activités"
          value={mockActivitiesKPIs.total}
          icon={<ActivityIcon className="h-4 w-4" aria-hidden="true" />}
          iconVariant="primary"
          description={`Taux global ${mockActivitiesKPIs.tauxGlobal}%`}
        />
        <StatCard
          title="En Cours"
          value={mockActivitiesKPIs.enCours}
          icon={<Clock className="h-4 w-4" aria-hidden="true" />}
          iconVariant="warning"
          description="En développement actif"
        />
        <StatCard
          title="Terminées"
          value={mockActivitiesKPIs.terminees}
          icon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
          iconVariant="success"
          description="Complétées et validées"
        />
        <StatCard
          title="En Retard"
          value={mockActivitiesKPIs.enRetard}
          icon={<AlertTriangle className="h-4 w-4" aria-hidden="true" />}
          iconVariant="destructive"
          description="Dépassement d'échéance"
        />
      </div>

      {/* DataTable */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Liste des activités</CardTitle>
          <Button
            variant="default" size="sm"
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
                  { label: 'En cours', value: 'En cours' },
                  { label: 'Terminé', value: 'Terminé' },
                  { label: 'En retard', value: 'En retard' },
                  { label: 'Suspendu', value: 'Suspendu' },
                ],
              },
              {
                id: 'priorite',
                title: 'Priorité',
                options: [
                  { label: 'Critique', value: 'Critique' },
                  { label: 'Haute', value: 'Haute' },
                  { label: 'Moyenne', value: 'Moyenne' },
                  { label: 'Faible', value: 'Faible' },
                ],
              },
            ]}
          />
        </CardContent>
      </Card>

      <ActivitySlideOver
        open={slideOverOpen}
        onOpenChange={setSlideOverOpen}
        activity={selected}
        mode={slideOverMode}
      />
    </section>
  );
}
