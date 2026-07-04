import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { Livrable, LivrableCategorie, StatutLivrable, PrioriteLivrable } from '@/types';
import {
  LIVRABLE_CATEGORIES, STATUT_LIVRABLE_OPTIONS, PRIORITE_LIVRABLE_OPTIONS,
} from '@/mocks/deliverablesMocks';
import {
  SlideOver, SlideOverContent, SlideOverHeader, SlideOverTitle,
  SlideOverBody, SlideOverFooter, SlideOverClose,
} from '@/components/ui/overlays/SlideOver';
import { Button }   from '@/components/ui/forms/Button';
import { Input }    from '@/components/ui/forms/Input';
import { Textarea } from '@/components/ui/forms/Textarea';
import { Select }   from '@/components/ui/forms/Select';
import { Badge }    from '@/components/ui/data-display/Badge';
import { ProgressBar } from '@/components/ui/data-display/ProgressBar';

// ─── Types ───────────────────────────────────────────────────────────────────

interface FormState {
  code_livrable:  string;
  nom:            string;
  description:    string;
  categorie:      LivrableCategorie;
  composante:     string;
  responsable:    string;
  date_prevue:    string;
  date_reelle:    string;
  avancement:     number;
  statut:         StatutLivrable;
  priorite:       PrioriteLivrable;
}

export interface LivrableSavePayload {
  code_livrable:  string;
  nom:            string;
  description?:   string;
  categorie:      LivrableCategorie;
  composante?:    string;
  responsable:    string;
  date_prevue:    string;
  date_reelle?:   string;
  avancement:     number;
  statut:         StatutLivrable;
  priorite:       PrioriteLivrable;
}

export interface LivrableSlideOverProps {
  open:         boolean;
  onOpenChange: (v: boolean) => void;
  mode:         'new' | 'edit' | 'view';
  livrable?:    Livrable | null;
  nextCode?:    string;
  onSave:       (payload: LivrableSavePayload, id?: string) => void;
  onDelete?:    (id: string) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUT_LABEL: Record<StatutLivrable, string> = {
  A_FAIRE:  'À faire',
  EN_COURS: 'En cours',
  SOUMIS:   'Soumis',
  VALIDE:   'Validé',
  REFUSE:   'Refusé',
  TERMINE:  'Terminé',
};

function statutVariant(s: StatutLivrable): 'outline' | 'info' | 'secondary' | 'success' | 'destructive' | 'warning' {
  if (s === 'VALIDE' || s === 'TERMINE') return 'success';
  if (s === 'EN_COURS') return 'warning';
  if (s === 'SOUMIS')   return 'info';
  if (s === 'REFUSE')   return 'destructive';
  return 'outline';
}

function avancementColor(pct: number): 'success' | 'primary' | 'warning' | 'destructive' {
  if (pct === 100) return 'success';
  if (pct >= 60)   return 'primary';
  if (pct >= 20)   return 'warning';
  return 'destructive';
}

const INIT: FormState = {
  code_livrable: '',
  nom:           '',
  description:   '',
  categorie:     'Rapport',
  composante:    '',
  responsable:   '',
  date_prevue:   new Date().toISOString().slice(0, 10),
  date_reelle:   '',
  avancement:    0,
  statut:        'A_FAIRE',
  priorite:      'MOYENNE',
};

// ─── Component ───────────────────────────────────────────────────────────────

export function LivrableSlideOver({
  open, onOpenChange, mode, livrable, nextCode = 'LIV-001', onSave, onDelete,
}: LivrableSlideOverProps) {
  const [form, setForm] = useState<FormState>(INIT);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  const readOnly = mode === 'view';

  useEffect(() => {
    if (!open) { setConfirmDelete(false); return; }
    if ((mode === 'edit' || mode === 'view') && livrable) {
      setForm({
        code_livrable: livrable.code_livrable,
        nom:           livrable.nom,
        description:   livrable.description ?? '',
        categorie:     livrable.categorie,
        composante:    livrable.composante ?? '',
        responsable:   livrable.responsable,
        date_prevue:   livrable.date_prevue,
        date_reelle:   livrable.date_reelle ?? '',
        avancement:    livrable.avancement,
        statut:        livrable.statut,
        priorite:      livrable.priorite,
      });
    } else {
      setForm({ ...INIT, code_livrable: nextCode });
    }
    setErrors({});
    setConfirmDelete(false);
  }, [open, mode, livrable, nextCode]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.code_livrable.trim()) e.code_livrable = 'Le code est requis.';
    if (!form.nom.trim())           e.nom           = 'Le nom est requis.';
    if (!form.responsable.trim())   e.responsable   = 'Le responsable est requis.';
    if (!form.date_prevue)          e.date_prevue   = 'La date est requise.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    onSave(
      {
        code_livrable: form.code_livrable.trim(),
        nom:           form.nom.trim(),
        description:   form.description.trim() || undefined,
        categorie:     form.categorie,
        composante:    form.composante.trim() || undefined,
        responsable:   form.responsable.trim(),
        date_prevue:   form.date_prevue,
        date_reelle:   form.date_reelle || undefined,
        avancement:    form.avancement,
        statut:        form.statut,
        priorite:      form.priorite,
      },
      livrable?.id,
    );
    onOpenChange(false);
  }

  function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    if (livrable?.id) onDelete?.(livrable.id);
    onOpenChange(false);
  }

  const title =
    mode === 'new'  ? 'Nouveau livrable' :
    mode === 'edit' ? 'Modifier le livrable' :
    'Détail du livrable';

  return (
    <SlideOver open={open} onOpenChange={onOpenChange}>
      <SlideOverContent>
        {/* ── Header ── */}
        <SlideOverHeader>
          <div>
            <SlideOverTitle>{title}</SlideOverTitle>
            {livrable && (
              <p className="text-xs text-muted-foreground mt-0.5">{livrable.code_livrable}</p>
            )}
          </div>
          <SlideOverClose asChild>
            <Button variant="ghost" size="icon" aria-label="Fermer">
              <X className="h-4 w-4" />
            </Button>
          </SlideOverClose>
        </SlideOverHeader>

        {/* ── Body ── */}
        <SlideOverBody className="space-y-5">

          {/* Aperçu statut (view/edit) */}
          {livrable && (
            <div className="rounded-lg border border-border bg-muted/30 p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Avancement</p>
                <p className="text-3xl font-bold font-mono mt-0.5">{readOnly ? livrable.avancement : form.avancement}%</p>
              </div>
              <Badge variant={statutVariant(readOnly ? livrable.statut : form.statut)}>
                {STATUT_LABEL[readOnly ? livrable.statut : form.statut]}
              </Badge>
            </div>
          )}

          {/* Section: Informations générales */}
          <div className="space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Informations générales
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground" htmlFor="liv-code">
                  Code <span className="text-destructive">*</span>
                </label>
                <Input id="liv-code" value={form.code_livrable}
                  onChange={e => set('code_livrable', e.target.value)}
                  placeholder="LIV-001" disabled={readOnly} error={!!errors.code_livrable} />
                {errors.code_livrable && <p className="text-xs text-destructive">{errors.code_livrable}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground" htmlFor="liv-cat">Catégorie</label>
                <Select id="liv-cat" value={form.categorie}
                  onChange={e => set('categorie', e.target.value as LivrableCategorie)}
                  disabled={readOnly}>
                  {LIVRABLE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground" htmlFor="liv-nom">
                Nom <span className="text-destructive">*</span>
              </label>
              <Input id="liv-nom" value={form.nom}
                onChange={e => set('nom', e.target.value)}
                placeholder="Nom du livrable" disabled={readOnly} error={!!errors.nom} />
              {errors.nom && <p className="text-xs text-destructive">{errors.nom}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground" htmlFor="liv-desc">Description</label>
              <Textarea id="liv-desc" value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Description du livrable et de son contenu attendu…"
                rows={3} disabled={readOnly} className="resize-none" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground" htmlFor="liv-comp">Composante</label>
              <Input id="liv-comp" value={form.composante}
                onChange={e => set('composante', e.target.value)}
                placeholder="Ex: Composante A — Infrastructures" disabled={readOnly} />
            </div>
          </div>

          {/* Section: Planification */}
          <div className="space-y-4 pt-1 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-3">
              Planification & Réalisation
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground" htmlFor="liv-prevue">
                  Date prévue <span className="text-destructive">*</span>
                </label>
                <Input id="liv-prevue" type="date" value={form.date_prevue}
                  onChange={e => set('date_prevue', e.target.value)}
                  disabled={readOnly} error={!!errors.date_prevue} />
                {errors.date_prevue && <p className="text-xs text-destructive">{errors.date_prevue}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground" htmlFor="liv-reelle">Date réelle</label>
                <Input id="liv-reelle" type="date" value={form.date_reelle}
                  onChange={e => set('date_reelle', e.target.value)}
                  disabled={readOnly} />
              </div>
            </div>
          </div>

          {/* Section: Responsable + Classification */}
          <div className="space-y-4 pt-1 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-3">
              Responsable & Classification
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground" htmlFor="liv-resp">
                Responsable <span className="text-destructive">*</span>
              </label>
              <Input id="liv-resp" value={form.responsable}
                onChange={e => set('responsable', e.target.value)}
                placeholder="Nom du responsable" disabled={readOnly} error={!!errors.responsable} />
              {errors.responsable && <p className="text-xs text-destructive">{errors.responsable}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground" htmlFor="liv-prio">Priorité</label>
                <Select id="liv-prio" value={form.priorite}
                  onChange={e => set('priorite', e.target.value as PrioriteLivrable)}
                  disabled={readOnly}>
                  {PRIORITE_LIVRABLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground" htmlFor="liv-statut">Statut</label>
                <Select id="liv-statut" value={form.statut}
                  onChange={e => set('statut', e.target.value as StatutLivrable)}
                  disabled={readOnly}>
                  {STATUT_LIVRABLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </Select>
              </div>
            </div>
          </div>

          {/* Section: Avancement */}
          <div className="space-y-3 pt-1 border-t border-border">
            <div className="flex items-center justify-between pt-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Avancement
              </p>
              <span className="text-lg font-bold font-mono">{form.avancement}%</span>
            </div>
            {readOnly ? (
              <ProgressBar value={livrable?.avancement ?? 0} size="md"
                color={avancementColor(livrable?.avancement ?? 0)}
                aria-label={`Avancement ${livrable?.avancement ?? 0}%`} />
            ) : (
              <div className="space-y-2">
                <input
                  type="range" min={0} max={100} step={5}
                  value={form.avancement}
                  onChange={e => set('avancement', Number(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-secondary"
                  aria-label="Avancement en pourcentage"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
                </div>
                <ProgressBar value={form.avancement} size="sm"
                  color={avancementColor(form.avancement)}
                  aria-label={`Avancement ${form.avancement}%`} />
              </div>
            )}
          </div>

          {/* Historique (view/edit) */}
          {livrable && (
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Historique</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <span className="text-muted-foreground">Date de création</span>
                <span className="text-foreground font-medium">
                  {new Date(livrable.createdAt).toLocaleDateString('fr-FR')}
                </span>
                <span className="text-muted-foreground">Dernière modification</span>
                <span className="text-foreground font-medium">
                  {new Date(livrable.updatedAt).toLocaleDateString('fr-FR')}
                </span>
                <span className="text-muted-foreground">Responsable</span>
                <span className="text-foreground font-medium">{livrable.responsable}</span>
              </div>
            </div>
          )}

          {/* Bouton Supprimer (mode edit) */}
          {mode === 'edit' && livrable && onDelete && (
            <div className="pt-2 border-t border-border">
              {confirmDelete ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2">
                  <p className="text-xs text-destructive font-medium">
                    Confirmer la suppression de {livrable.code_livrable} ?
                  </p>
                  <div className="flex gap-2">
                    <Button variant="destructive" size="sm" onClick={handleDelete}>
                      Supprimer définitivement
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="ghost" size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setConfirmDelete(true)}
                >
                  Supprimer ce livrable
                </Button>
              )}
            </div>
          )}
        </SlideOverBody>

        {/* ── Footer ── */}
        <SlideOverFooter>
          <SlideOverClose asChild>
            <Button variant="outline">Fermer</Button>
          </SlideOverClose>
          {!readOnly && (
            <Button onClick={handleSave}>
              {mode === 'new' ? 'Créer le livrable' : 'Enregistrer'}
            </Button>
          )}
        </SlideOverFooter>
      </SlideOverContent>
    </SlideOver>
  );
}
