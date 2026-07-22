import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks';
import { useWBS } from '@/hooks/useWBS';
import { useOrganisationMembersForPicker } from '@/hooks/useGovernance';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import type { Tache } from '@/types';
import { ColumnDef } from '@tanstack/react-table';
import {
  Activity as ActivityIcon, CheckCircle2, Clock, AlertTriangle,
  Plus, Eye, Edit, Trash2, CalendarDays, AlertCircle,
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
  Modal, ModalContent, ModalHeader, ModalTitle, ModalFooter, ModalClose,
} from '@/components/ui/overlays/Modal';
import {
  type Activity,
  type ActivityStatus,
} from '@/mocks/activitiesMocks';

// ─── Adapters Tache ↔ Activity ─────────────────────────────────────────────────

const STATUT_TO_ACTIVITY: Record<string, ActivityStatus> = {
  A_FAIRE:    'Non démarré',
  EN_COURS:   'En cours',
  TERMINE:    'Terminé',
  ANNULE:     'Suspendu',
  EN_ATTENTE: 'Non démarré',
};

const ACTIVITY_TO_STATUT: Record<ActivityStatus, string> = {
  'Non démarré': 'A_FAIRE',
  'En cours':    'EN_COURS',
  'Terminé':     'TERMINE',
  'En retard':   'EN_COURS',
  'Suspendu':    'ANNULE',
};

function adaptTache(t: Tache): Activity {
  return {
    id: t.id,
    code: t.code_tache,
    libelle: t.description,
    description: t.description,
    responsable: t.responsable ?? '—',
    responsableId: t.responsableId ?? null,
    initialesResponsable: getInitiales(t.responsable ?? ''),
    dateDebut: t.date_debut ?? '',
    dateFin: t.date_fin ?? '',
    avancement: t.avancement,
    priorite: 'Moyenne',
    statut: STATUT_TO_ACTIVITY[t.statut] ?? 'Non démarré',
    composante: '',
    budgetAlloue: parseFloat(t.cout_prevu) || 0,
    budgetRealise: parseFloat(t.cout_reel) || 0,
    wbsNodeId: t.wbs_id ?? null,
  };
}

function activityToDto(data: Omit<Activity, 'id'>, projectId: string): Partial<Tache> {
  return {
    projet_id:    projectId,
    code_tache:   data.code,
    description:  data.libelle || data.description,
    responsableId: data.responsableId || undefined,
    date_debut:   data.dateDebut || undefined,
    date_fin:     data.dateFin   || undefined,
    avancement:   data.avancement,
    statut:       ACTIVITY_TO_STATUT[data.statut] as Tache['statut'],
    cout_prevu:   String(data.budgetAlloue || 0),
    cout_reel:    String(data.budgetRealise || 0),
    wbs_id:       data.wbsNodeId || undefined,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return '—'; }
}

// XOF (FCFA) — devise utilisée partout ailleurs dans l'app (Contrats, PPM,
// WBS, Dashboard, EVM) ; "USD" était une erreur isolée à ce fichier.
function formatBudget(n: number): string {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n) + ' XOF';
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
  code:          string;
  // UUID choisi dans le vivier de l'organisation (ptba_activites.responsable_id
  // est une vraie FK vers users) — plus de saisie libre d'un nom.
  responsableId: string;
  libelle:       string;
  description:   string;
  statut:        string; // cast to ActivityStatus on save
  avancement:    string;
  budgetAlloue:  string;
  budgetRealise: string;
  dateDebut:     string;
  dateFin:       string;
  wbsNodeId:     string;
};

const EMPTY_FORM: ActivityFormState = {
  code: '', responsableId: '', libelle: '', description: '',
  statut: 'Non démarré',
  avancement: '0', budgetAlloue: '', budgetRealise: '',
  dateDebut: '', dateFin: '',
  wbsNodeId: '',
};

function formFromActivity(a: Activity): ActivityFormState {
  return {
    code:          a.code,
    responsableId: a.responsableId ?? '',
    libelle:       a.libelle,
    description:   a.description,
    statut:        a.statut,
    avancement:    String(a.avancement),
    budgetAlloue:  String(a.budgetAlloue),
    budgetRealise: String(a.budgetRealise),
    dateDebut:     a.dateDebut,
    dateFin:       a.dateFin,
    wbsNodeId:     a.wbsNodeId ?? '',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal (view / edit / new) — formulaire contrôlé avec validation
// ─────────────────────────────────────────────────────────────────────────────

type FormMode = 'view' | 'edit' | 'new';

function ActivityFormModal({
  open, onOpenChange, activity, mode, onSave, projectId, isSaving, error,
}: {
  open:          boolean;
  onOpenChange:  (open: boolean) => void;
  activity:      Activity | null;
  mode:          FormMode;
  onSave:        (data: Omit<Activity, 'id'>) => void;
  projectId:     string;
  isSaving?:     boolean;
  error?:        string | null;
}) {
  const titles: Record<FormMode, string> = {
    view: "Détails de l'activité",
    edit: "Modifier l'activité",
    new:  'Nouvelle activité',
  };
  const readOnly = mode === 'view';

  const [form, setForm]     = useState<ActivityFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Nœuds WBS terminaux du projet — seuls éligibles au rattachement d'une activité.
  const { data: wbsNodes } = useWBS(projectId);
  const terminalWbsNodes = useMemo(() => {
    const all = wbsNodes?.data ?? [];
    return all.filter(n => !all.some(other => other.parent_id === n.id));
  }, [wbsNodes]);

  // Vivier de l'organisation pour le sélecteur Responsable — ptba_activites.
  // responsable_id est une vraie FK vers users(id), plus de saisie libre.
  const { data: orgMembers = [], isLoading: isLoadingMembers } = useOrganisationMembersForPicker(projectId);

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
    if (!form.libelle.trim())      errs.libelle       = 'Requis';
    if (!form.code.trim())         errs.code          = 'Requis';
    if (!form.responsableId.trim()) errs.responsableId = 'Requis';
    const av = Number(form.avancement);
    if (isNaN(av) || av < 0 || av > 100) errs.avancement = 'Entre 0 et 100';
    if (form.dateDebut && form.dateFin && form.dateFin < form.dateDebut)
      errs.dateFin = 'Date fin antérieure à la date début';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    const selectedMember = orgMembers.find(m => m.id === form.responsableId);
    onSave({
      code:                 form.code.trim(),
      responsableId:        form.responsableId || null,
      responsable:          selectedMember?.displayName ?? '',
      initialesResponsable: getInitiales(selectedMember?.displayName ?? ''),
      libelle:              form.libelle.trim(),
      description:          form.description.trim(),
      statut:               form.statut as ActivityStatus,
      priorite:             'Moyenne',
      avancement:           Math.min(100, Math.max(0, Number(form.avancement) || 0)),
      budgetAlloue:         Math.max(0, Number(form.budgetAlloue) || 0),
      budgetRealise:        Math.max(0, Number(form.budgetRealise) || 0),
      dateDebut:            form.dateDebut,
      dateFin:              form.dateFin,
      composante:           '',
      wbsNodeId:            form.wbsNodeId || null,
    });
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <ModalHeader className="px-6 py-4 border-b border-border shrink-0 space-y-1">
          <ModalTitle>{titles[mode]}</ModalTitle>
        </ModalHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {readOnly && activity ? (
            /* ── Mode lecture ── */
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge variant="outline" className="text-[11px] font-mono">{activity.code}</Badge>
                  <Badge variant={statutVariant(activity.statut)} className="text-[11px]">{activity.statut}</Badge>
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
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Nœud WBS lié</p>
                  <p className="text-[12px] text-muted-foreground">
                    {(wbsNodes?.data ?? []).find(n => n.id === activity.wbsNodeId)?.titre ?? '—'}
                  </p>
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
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Montant réalisé</p>
                  <p className="font-mono text-[13px] font-semibold text-foreground">{formatBudget(activity.budgetRealise)}</p>
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
                <Select
                  id="act-resp"
                  value={form.responsableId}
                  onChange={e => set('responsableId', e.target.value)}
                  disabled={isLoadingMembers}
                  className={errors.responsableId ? 'border-destructive' : ''}
                >
                  <option value="">{isLoadingMembers ? 'Chargement…' : 'Sélectionner une personne'}</option>
                  {orgMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.displayName}</option>
                  ))}
                </Select>
                {errors.responsableId && <p className="text-[11px] text-destructive">{errors.responsableId}</p>}
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
                <label className="text-sm font-medium text-foreground" htmlFor="act-budget">Budget alloué (XOF)</label>
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
                <label className="text-sm font-medium text-foreground" htmlFor="act-realise">Montant réalisé (XOF)</label>
                <Input
                  id="act-realise"
                  type="number"
                  min={0}
                  value={form.budgetRealise}
                  onChange={e => set('budgetRealise', e.target.value)}
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
                <label className="text-sm font-medium text-foreground" htmlFor="act-wbs">Nœud WBS lié</label>
                <Select
                  id="act-wbs"
                  value={form.wbsNodeId}
                  onChange={e => set('wbsNodeId', e.target.value)}
                >
                  <option value="">Aucun</option>
                  {terminalWbsNodes.map(n => (
                    <option key={n.id} value={n.id}>{n.code_wbs} — {n.titre}</option>
                  ))}
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Le budget et l'avancement du nœud WBS choisi seront calculés automatiquement
                  à partir des activités qui lui sont rattachées.
                </p>
              </div>

            </div>
          )}

          {error && (
            <p className="mt-4 text-xs text-destructive flex items-center gap-1.5" role="alert">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {error}
            </p>
          )}
        </div>

        <ModalFooter className="px-6 py-4 border-t border-border bg-muted/20 shrink-0">
          <ModalClose asChild>
            <Button variant="outline">{readOnly ? 'Fermer' : 'Annuler'}</Button>
          </ModalClose>
          {!readOnly && (
            <Button variant="default" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Enregistrement...' : mode === 'edit' ? 'Enregistrer' : 'Ajouter'}
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal de confirmation de suppression
// ─────────────────────────────────────────────────────────────────────────────

function DeleteConfirmModal({
  activity,
  onConfirm,
  onCancel,
  isDeleting,
  error,
}: {
  activity:  Activity | null;
  onConfirm: () => void;
  onCancel:  () => void;
  isDeleting?: boolean;
  error?: string | null;
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
        {error && (
          <p className="text-xs text-destructive flex items-center gap-1.5" role="alert">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>Annuler</Button>
          <Button variant="destructive" size="sm" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? 'Suppression...' : 'Supprimer'}
          </Button>
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
  canManage: boolean,
  canDelete: boolean,
): ColumnDef<Activity, unknown>[] {
  return [
    {
      id: 'code',
      accessorKey: 'code',
      header: 'Code / Libellé',
      meta: { isSticky: true } as Record<string, unknown>,
      cell: ({ row }) => {
        const { code, libelle } = row.original;
        return (
          <div className="flex flex-col gap-0.5 min-w-[220px] max-w-[320px]">
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="text-[10px] font-mono shrink-0">{code}</Badge>
            </div>
            <span className="text-[13px] font-semibold text-foreground leading-snug line-clamp-2" title={libelle}>{libelle}</span>
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
          {canManage && (
            <Button variant="ghost" size="sm" aria-label="Modifier" onClick={() => onEdit(row.original)}>
              <Edit className="h-3.5 w-3.5" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              aria-label="Supprimer"
              className="text-destructive hover:text-destructive"
              onClick={() => onDelete(row.original.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

interface ProjectActivitiesTabProps {
  /** Année actuellement sélectionnée dans PTBAPage — doit rester identique à
   * celle utilisée par la Matrice Financière/Calendrier/Gantt (même hook
   * usePTBA/useTasks, même filtre), sinon une activité créée ici peut
   * atterrir sous une année invisible ailleurs dans le PTBA. */
  annee: number;
}

export default function ProjectActivitiesTab({ annee }: ProjectActivitiesTabProps) {
  const { id: urlProjectId } = useParams<{ id: string }>();
  const activeProjectId      = useUIStore(s => s.activeProjectId);
  const projectId            = urlProjectId || activeProjectId || '';

  const { data: apiData, isLoading } = useTasks(projectId, { annee, limit: 100 });
  const createMutation = useCreateTask(projectId, annee);
  const updateMutation = useUpdateTask(projectId);
  const deleteMutation = useDeleteTask(projectId);

  // Miroir des rôles serveur (requireRole) sur ptba-create/update
  // (COORDINATEUR/CHARGE_PROGRAMME/ADMIN/SUPER_ADMIN) et ptba-delete
  // (ADMIN/SUPER_ADMIN) — cet onglet lit/écrit la même table ptba_activites.
  const currentRole = useAuthStore(s => s.user?.role);
  const canManage = !!currentRole && ['COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN', 'SUPER_ADMIN'].includes(currentRole);
  const canDelete = currentRole === 'ADMIN' || currentRole === 'SUPER_ADMIN';

  const [activities,    setActivities]    = useState<Activity[]>([]);

  useEffect(() => {
    const list = (apiData as any)?.data?.data ?? (apiData as any)?.data ?? (Array.isArray(apiData) ? apiData as Tache[] : []);
    setActivities(list.map(adaptTache));
  }, [apiData]);
  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const [slideOverMode, setSlideOverMode] = useState<FormMode>('new');
  const [selected,      setSelected]      = useState<Activity | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [saveError,   setSaveError]   = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function extractErrorMessage(err: unknown): string {
    return err instanceof Error ? err.message : 'Une erreur est survenue. Veuillez réessayer.';
  }

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
    setSaveError(null);
    if (slideOverMode === 'new') {
      createMutation.mutate(activityToDto(data, projectId), {
        onSuccess: (created) => {
          setActivities(prev => [...prev, adaptTache(created)]);
          setSlideOverOpen(false);
        },
        onError: (err) => setSaveError(extractErrorMessage(err)),
      });
    } else if (slideOverMode === 'edit' && selected) {
      updateMutation.mutate(
        { id: selected.id, ...activityToDto(data, projectId) },
        {
          onSuccess: (updated) => {
            setActivities(prev => prev.map(a => a.id === selected.id ? adaptTache(updated) : a));
            setSlideOverOpen(false);
          },
          onError: (err) => setSaveError(extractErrorMessage(err)),
        }
      );
    }
  }

  // ── Suppression confirmée ─────────────────────────────────────────────────
  function handleDeleteConfirm() {
    if (!deleteTargetId) return;
    setDeleteError(null);
    deleteMutation.mutate(deleteTargetId, {
      onSuccess: () => {
        setActivities(prev => prev.filter(a => a.id !== deleteTargetId));
        if (selected?.id === deleteTargetId) { setSlideOverOpen(false); setSelected(null); }
        setDeleteTargetId(null);
      },
      onError: (err) => setDeleteError(extractErrorMessage(err)),
    });
  }

  const columns = buildActivityColumns(
    (a) => { setSelected(a); setSlideOverMode('view'); setSlideOverOpen(true); },
    (a) => { setSelected(a); setSaveError(null); setSlideOverMode('edit'); setSlideOverOpen(true); },
    (id) => { setDeleteError(null); setDeleteTargetId(id); },
    canManage,
    canDelete,
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
          {canManage && (
            <Button
              variant="default"
              size="sm"
              onClick={() => { setSelected(null); setSaveError(null); setSlideOverMode('new'); setSlideOverOpen(true); }}
            >
              <Plus className="h-4 w-4 mr-1.5" aria-hidden="true" />
              Ajouter
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={activities}
            isLoading={isLoading}
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
            ]}
          />
        </CardContent>
      </Card>

      {/* ── SlideOver (vue / édition / création) ──────────────────────────────── */}
      <ActivityFormModal
        open={slideOverOpen}
        onOpenChange={(open) => { setSlideOverOpen(open); if (!open) setSaveError(null); }}
        activity={selected}
        mode={slideOverMode}
        onSave={handleSave}
        projectId={projectId}
        isSaving={createMutation.isPending || updateMutation.isPending}
        error={saveError}
      />

      {/* ── Modal de confirmation de suppression ──────────────────────────────── */}
      <DeleteConfirmModal
        activity={deleteTarget}
        onConfirm={handleDeleteConfirm}
        onCancel={() => { setDeleteTargetId(null); setDeleteError(null); }}
        isDeleting={deleteMutation.isPending}
        error={deleteError}
      />

    </section>
  );
}
