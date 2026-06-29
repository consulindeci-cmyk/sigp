import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  CheckCircle2, Clock, AlertTriangle, ListChecks,
  Plus, Eye, Edit, Trash2, X, CalendarDays, User,
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
import { cn } from '@/lib/utils';
import {
  mockDeliverables,
  mockDeliverablesKPIs,
  mockRecentDeliverables,
  mockUpcomingDeliverablesList,
  type Deliverable,
  type DeliverableStatus,
  type DeliverablePriority,
} from '@/mocks/deliverablesMocks';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function formatDateShort(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function statutVariant(statut: DeliverableStatus): 'success' | 'warning' | 'secondary' | 'destructive' | 'default' {
  switch (statut) {
    case 'Validé':       return 'success';
    case 'En cours':     return 'warning';
    case 'Non démarré':  return 'secondary';
    case 'En retard':    return 'destructive';
    case 'Abandonné':    return 'default';
  }
}

function prioriteVariant(priorite: DeliverablePriority): 'destructive' | 'default' | 'warning' | 'secondary' {
  switch (priorite) {
    case 'Critique': return 'destructive';
    case 'Haute':    return 'default';
    case 'Moyenne':  return 'warning';
    case 'Faible':   return 'secondary';
  }
}

function avancementColor(pct: number): 'success' | 'warning' | 'destructive' | 'primary' {
  if (pct === 100) return 'success';
  if (pct >= 60)   return 'primary';
  if (pct >= 20)   return 'warning';
  return 'destructive';
}

// ─────────────────────────────────────────────────────────────────────────────
// Timeline simplifiée
// ─────────────────────────────────────────────────────────────────────────────

function DeliverableTimeline({ items }: { items: Deliverable[] }) {
  return (
    <ul role="list" className="flex flex-col">
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        const dotColor = item.statut === 'En retard' ? 'bg-destructive' : item.statut === 'En cours' ? 'bg-primary' : 'bg-muted-foreground';
        return (
          <li key={item.id} className="flex gap-3">
            {/* Timeline indicator */}
            <div className="flex flex-col items-center shrink-0">
              <div className={cn('h-2.5 w-2.5 rounded-full mt-1.5 shrink-0', dotColor)} aria-hidden="true" />
              {!isLast && <div className="w-px flex-1 bg-border mt-1" aria-hidden="true" />}
            </div>
            {/* Content */}
            <div className={cn('flex flex-col gap-0.5 pb-4 min-w-0', isLast && 'pb-0')}>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-mono text-[11px] text-muted-foreground shrink-0">
                  {formatDateShort(item.datePrevue)}
                </span>
                <Badge variant={statutVariant(item.statut)} className="text-[10px] shrink-0">{item.statut}</Badge>
                <Badge variant={prioriteVariant(item.priorite)} className="text-[10px] shrink-0">{item.priorite}</Badge>
              </div>
              <p className="text-[13px] font-medium text-foreground leading-snug">{item.nom}</p>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <User className="h-3 w-3 shrink-0" aria-hidden="true" />
                {item.responsable}
              </div>
              {item.avancement > 0 && item.avancement < 100 && (
                <div className="mt-1">
                  <ProgressBar
                    value={item.avancement}
                    size="xs"
                    color={avancementColor(item.avancement)}
                    showLabel
                    aria-label={`Avancement ${item.avancement}%`}
                  />
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Livrables récents card
// ─────────────────────────────────────────────────────────────────────────────

function RecentDeliverablesCard({ items }: { items: Deliverable[] }) {
  return (
    <ul role="list" className="flex flex-col divide-y divide-border">
      {items.map((item) => (
        <li key={item.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
          <div className="h-8 w-8 rounded-full bg-success/10 text-success flex items-center justify-center shrink-0 mt-0.5">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-foreground leading-snug line-clamp-2">{item.nom}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <Badge variant="outline" className="text-[10px]">{item.categorie}</Badge>
              <span className="text-[11px] text-muted-foreground">
                {item.dateReelle ? formatDateShort(item.dateReelle) : '—'}
              </span>
            </div>
          </div>
          <Badge variant="success" className="text-[10px] shrink-0 mt-0.5">Validé</Badge>
        </li>
      ))}
    </ul>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SlideOver — Voir / Ajouter / Modifier
// ─────────────────────────────────────────────────────────────────────────────

type SlideOverMode = 'view' | 'edit' | 'new';

function DeliverableSlideOver({
  open, onOpenChange, deliverable, mode,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliverable: Deliverable | null;
  mode: SlideOverMode;
}) {
  const titles: Record<SlideOverMode, string> = {
    view: 'Détails du livrable',
    edit: 'Modifier le livrable',
    new:  'Nouveau livrable',
  };
  const readOnly = mode === 'view';

  return (
    <SlideOver open={open} onOpenChange={onOpenChange}>
      <SlideOverContent>
        <SlideOverHeader>
          <SlideOverTitle>{titles[mode]}</SlideOverTitle>
          <SlideOverClose asChild>
            <Button variant="ghost" size="sm" aria-label="Fermer">
              <X className="h-4 w-4" />
            </Button>
          </SlideOverClose>
        </SlideOverHeader>

        <SlideOverBody>
          {readOnly && deliverable ? (
            <div className="flex flex-col gap-5">
              {/* Header */}
              <div className="flex flex-col gap-2">
                <div className="flex items-start gap-2 flex-wrap">
                  <Badge variant={statutVariant(deliverable.statut)} className="text-[11px]">
                    {deliverable.statut}
                  </Badge>
                  <Badge variant={prioriteVariant(deliverable.priorite)} className="text-[11px]">
                    {deliverable.priorite}
                  </Badge>
                  <Badge variant="outline" className="text-[11px]">{deliverable.categorie}</Badge>
                </div>
                <h3 className="text-[15px] font-semibold text-foreground leading-snug">{deliverable.nom}</h3>
                <p className="text-[12px] text-muted-foreground leading-relaxed">{deliverable.description}</p>
              </div>

              {/* Avancement */}
              <div className="bg-muted/40 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Avancement</p>
                  <span className="font-mono text-[14px] font-bold text-foreground">{deliverable.avancement}%</span>
                </div>
                <ProgressBar
                  value={deliverable.avancement}
                  size="md"
                  color={avancementColor(deliverable.avancement)}
                  aria-label={`Avancement ${deliverable.avancement}%`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border pt-4">
                <div className="sm:col-span-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Composante</p>
                  <p className="text-[12px] text-muted-foreground">{deliverable.composante}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Responsable</p>
                  <div className="flex items-center gap-1.5">
                    <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                      {deliverable.initialesResponsable}
                    </div>
                    <span className="text-[13px] text-foreground">{deliverable.responsable}</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Date prévue</p>
                  <p className="font-mono text-[13px] text-foreground">{formatDate(deliverable.datePrevue)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Date réelle</p>
                  <p className="font-mono text-[13px] text-foreground">{formatDate(deliverable.dateReelle)}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-foreground" htmlFor="del-nom">Nom du livrable</label>
                <Input id="del-nom" defaultValue={deliverable?.nom ?? ''} placeholder="Nom du livrable" />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-foreground" htmlFor="del-desc">Description</label>
                <Input id="del-desc" defaultValue={deliverable?.description ?? ''} placeholder="Description" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="del-resp">Responsable</label>
                <Input id="del-resp" defaultValue={deliverable?.responsable ?? ''} placeholder="Nom du responsable" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="del-avancement">Avancement (%)</label>
                <Input id="del-avancement" type="number" min={0} max={100} defaultValue={deliverable?.avancement ?? 0} placeholder="0" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="del-categorie">Catégorie</label>
                <Select id="del-categorie" defaultValue={deliverable?.categorie ?? ''}>
                  <option value="">Sélectionner</option>
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="Formation">Formation</option>
                  <option value="Rapport">Rapport</option>
                  <option value="Étude">Étude</option>
                  <option value="Équipement">Équipement</option>
                  <option value="Système">Système</option>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="del-priorite">Priorité</label>
                <Select id="del-priorite" defaultValue={deliverable?.priorite ?? 'Moyenne'}>
                  <option value="Critique">Critique</option>
                  <option value="Haute">Haute</option>
                  <option value="Moyenne">Moyenne</option>
                  <option value="Faible">Faible</option>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="del-statut">Statut</label>
                <Select id="del-statut" defaultValue={deliverable?.statut ?? 'Non démarré'}>
                  <option value="Non démarré">Non démarré</option>
                  <option value="En cours">En cours</option>
                  <option value="Validé">Validé</option>
                  <option value="En retard">En retard</option>
                  <option value="Abandonné">Abandonné</option>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="del-datep">Date prévue</label>
                <Input id="del-datep" type="date" defaultValue={deliverable?.datePrevue ?? ''} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="del-dater">Date réelle</label>
                <Input id="del-dater" type="date" defaultValue={deliverable?.dateReelle ?? ''} />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-foreground" htmlFor="del-composante">Composante</label>
                <Input id="del-composante" defaultValue={deliverable?.composante ?? ''} placeholder="Composante du projet" />
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
// Column definitions
// ─────────────────────────────────────────────────────────────────────────────

function buildDeliverableColumns(
  onView: (d: Deliverable) => void,
  onEdit: (d: Deliverable) => void,
  onDelete: (id: string) => void,
): ColumnDef<Deliverable, any>[] {
  return [
    {
      id: 'nom',
      accessorKey: 'nom',
      header: 'Livrable',
      meta: { isSticky: true } as any,
      cell: ({ row }) => {
        const { nom, composante, categorie } = row.original;
        return (
          <div className="flex flex-col gap-0.5 min-w-[200px] max-w-[300px]">
            <span className="text-[13px] font-semibold text-foreground leading-snug line-clamp-2" title={nom}>{nom}</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="outline" className="text-[10px]">{categorie}</Badge>
              <span className="text-[10px] text-muted-foreground truncate">{composante}</span>
            </div>
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
        const s = getValue() as DeliverableStatus;
        return <Badge variant={statutVariant(s)} className="text-[11px] w-max">{s}</Badge>;
      },
    },
    {
      accessorKey: 'priorite',
      header: 'Priorité',
      cell: ({ getValue }) => {
        const p = getValue() as DeliverablePriority;
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
      accessorKey: 'datePrevue',
      header: 'Date prévue',
      meta: { align: 'center' } as any,
      cell: ({ getValue }) => (
        <div className="flex items-center gap-1 text-[12px] text-muted-foreground">
          <CalendarDays className="h-3 w-3 shrink-0" aria-hidden="true" />
          {formatDate(getValue() as string)}
        </div>
      ),
    },
    {
      accessorKey: 'dateReelle',
      header: 'Date réelle',
      meta: { align: 'center' } as any,
      cell: ({ getValue }) => (
        <span className="font-mono text-[12px] text-muted-foreground">{formatDate(getValue() as string | null)}</span>
      ),
    },
    {
      id: 'actions',
      enableHiding: false,
      meta: { align: 'right' } as any,
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end">
          <Button variant="ghost" size="sm" aria-label="Voir les détails" onClick={() => onView(row.original)}>
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" aria-label="Modifier" onClick={() => onEdit(row.original)}>
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost" size="sm" aria-label="Supprimer"
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

export default function ProjectDeliverablesTab() {
  const [deliverables, setDeliverables] = useState<Deliverable[]>(mockDeliverables);
  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const [slideOverMode, setSlideOverMode] = useState<SlideOverMode>('new');
  const [selectedDeliverable, setSelectedDeliverable] = useState<Deliverable | null>(null);

  const columns = buildDeliverableColumns(
    (d) => { setSelectedDeliverable(d); setSlideOverMode('view'); setSlideOverOpen(true); },
    (d) => { setSelectedDeliverable(d); setSlideOverMode('edit'); setSlideOverOpen(true); },
    (id) => setDeliverables((prev) => prev.filter((d) => d.id !== id)),
  );

  return (
    <section aria-label="Registre des Livrables" className="flex flex-col gap-6">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
        <div>
          <h1 className="text-base font-bold text-foreground">Registre des Livrables</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Suivi de la production, validation et livraison des livrables projet</p>
        </div>
        <Button
          variant="default" size="sm" className="h-8 text-xs"
          onClick={() => { setSelectedDeliverable(null); setSlideOverMode('new'); setSlideOverOpen(true); }}
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
          Nouveau livrable
        </Button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Livrables"
          value={mockDeliverablesKPIs.total}
          icon={<ListChecks className="h-4 w-4 text-primary" aria-hidden="true" />}
          iconVariant="primary"
          description={`Taux global ${mockDeliverablesKPIs.tauxAvancement}%`}
        />
        <StatCard
          title="Validés"
          value={mockDeliverablesKPIs.valides}
          icon={<CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />}
          iconVariant="success"
          description="Complétés et approuvés"
        />
        <StatCard
          title="En Cours"
          value={mockDeliverablesKPIs.enCours}
          icon={<Clock className="h-4 w-4 text-warning" aria-hidden="true" />}
          iconVariant="warning"
          description="En développement actif"
        />
        <StatCard
          title="En Retard"
          value={mockDeliverablesKPIs.enRetard}
          icon={<AlertTriangle className="h-4 w-4 text-destructive" aria-hidden="true" />}
          iconVariant="destructive"
          description="Dépassement de l'échéance"
        />
      </div>

      {/* Timeline + Livrables récents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Timeline simplifiée */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Prochains livrables</CardTitle>
          </CardHeader>
          <CardContent>
            {mockUpcomingDeliverablesList.length > 0 ? (
              <DeliverableTimeline items={mockUpcomingDeliverablesList} />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Aucun livrable à venir.</p>
            )}
          </CardContent>
        </Card>

        {/* Livrables récemment validés */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Livrables récemment validés</CardTitle>
          </CardHeader>
          <CardContent>
            {mockRecentDeliverables.length > 0 ? (
              <RecentDeliverablesCard items={mockRecentDeliverables} />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Aucun livrable validé.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* DataTable */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Registre complet des livrables</CardTitle>
          <Button
            variant="default" size="sm" aria-label="Ajouter un livrable"
            onClick={() => { setSelectedDeliverable(null); setSlideOverMode('new'); setSlideOverOpen(true); }}
          >
            <Plus className="h-4 w-4 mr-1.5" aria-hidden="true" />
            Ajouter
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={deliverables}
            searchKey="nom"
            searchPlaceholder="Rechercher un livrable..."
            filters={[
              {
                id: 'statut',
                title: 'Statut',
                options: [
                  { label: 'Validé', value: 'Validé' },
                  { label: 'En cours', value: 'En cours' },
                  { label: 'Non démarré', value: 'Non démarré' },
                  { label: 'En retard', value: 'En retard' },
                  { label: 'Abandonné', value: 'Abandonné' },
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
              {
                id: 'categorie',
                title: 'Catégorie',
                options: [
                  { label: 'Infrastructure', value: 'Infrastructure' },
                  { label: 'Formation', value: 'Formation' },
                  { label: 'Rapport', value: 'Rapport' },
                  { label: 'Étude', value: 'Étude' },
                  { label: 'Équipement', value: 'Équipement' },
                  { label: 'Système', value: 'Système' },
                ],
              },
            ]}
          />
        </CardContent>
      </Card>

      {/* SlideOver */}
      <DeliverableSlideOver
        open={slideOverOpen}
        onOpenChange={setSlideOverOpen}
        deliverable={selectedDeliverable}
        mode={slideOverMode}
      />
    </section>
  );
}
