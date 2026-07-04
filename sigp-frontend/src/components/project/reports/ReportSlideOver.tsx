import { useEffect, useState } from 'react';
import { X, Download, Copy, Archive, RotateCcw } from 'lucide-react';
import type { RapportProjet, TypeRapport, StatutRapport, FormatRapport } from '@/types';
import {
  TYPE_RAPPORT_OPTIONS, STATUT_RAPPORT_OPTIONS, FORMAT_RAPPORT_OPTIONS,
} from '@/mocks/reportsMocks';
import {
  SlideOver, SlideOverContent, SlideOverHeader, SlideOverTitle,
  SlideOverBody, SlideOverFooter, SlideOverClose,
} from '@/components/ui/overlays/SlideOver';
import { Button }   from '@/components/ui/forms/Button';
import { Input }    from '@/components/ui/forms/Input';
import { Textarea } from '@/components/ui/forms/Textarea';
import { Select }   from '@/components/ui/forms/Select';
import { Badge }    from '@/components/ui/data-display/Badge';

// ─── Types ───────────────────────────────────────────────────────────────────

interface FormState {
  code_rapport:    string;
  titre:           string;
  description:     string;
  type:            TypeRapport;
  format:          FormatRapport;
  statut:          StatutRapport;
  periode:         string;
  version:         string;
  auteur:          string;
  taille_ko:       string;
  commentaires:    string;
  date_generation: string;
}

export interface ReportSavePayload {
  code_rapport:     string;
  titre:            string;
  description?:     string;
  type:             TypeRapport;
  format:           FormatRapport;
  statut:           StatutRapport;
  periode:          string;
  version:          string;
  auteur:           string;
  taille_ko:        number;
  commentaires?:    string;
  date_generation:  string;
  nb_telechargements: number;
}

export interface ReportSlideOverProps {
  open:         boolean;
  onOpenChange: (v: boolean) => void;
  mode:         'new' | 'edit' | 'view';
  rapport?:     RapportProjet | null;
  nextCode?:    string;
  onSave:       (payload: ReportSavePayload, id?: string) => void;
  onDelete?:    (id: string) => void;
  onDuplicate?: (id: string) => void;
  onDownload?:  (id: string) => void;
  onArchive?:   (id: string) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtTaille(ko: number): string {
  if (ko < 1024)        return `${ko} Ko`;
  if (ko < 1024 * 1024) return `${(ko / 1024).toFixed(1)} Mo`;
  return `${(ko / (1024 * 1024)).toFixed(1)} Go`;
}

function statutVariant(s: StatutRapport): 'outline' | 'warning' | 'success' | 'secondary' | 'info' {
  if (s === 'VALIDE')     return 'success';
  if (s === 'EN_ATTENTE') return 'warning';
  if (s === 'GENERE')     return 'info';
  return 'secondary';
}

function formatToExt(f: FormatRapport): string {
  const map: Record<FormatRapport, string> = { PDF: 'pdf', Excel: 'xlsx', Word: 'docx' };
  return map[f];
}

function simulateDownload(rapport: RapportProjet) {
  const ext     = formatToExt(rapport.format);
  const content = `Rapport: ${rapport.titre}\nCode: ${rapport.code_rapport}\nType: ${rapport.type}\nPériode: ${rapport.periode}\nAuteur: ${rapport.auteur}\nStatut: ${rapport.statut}`;
  const blob    = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const url     = URL.createObjectURL(blob);
  const a       = document.createElement('a');
  a.href     = url;
  a.download = `${rapport.code_rapport}_${rapport.titre.replace(/\s+/g, '_')}.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
}

const INIT: FormState = {
  code_rapport:    '',
  titre:           '',
  description:     '',
  type:            'MENSUEL',
  format:          'PDF',
  statut:          'GENERE',
  periode:         '',
  version:         '1.0',
  auteur:          '',
  taille_ko:       '0',
  commentaires:    '',
  date_generation: new Date().toISOString().slice(0, 10),
};

// ─── Component ───────────────────────────────────────────────────────────────

export function ReportSlideOver({
  open, onOpenChange, mode, rapport, nextCode = 'RPT-001',
  onSave, onDelete, onDuplicate, onDownload, onArchive,
}: ReportSlideOverProps) {
  const [form, setForm]           = useState<FormState>(INIT);
  const [errors, setErrors]       = useState<Partial<Record<keyof FormState, string>>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  const readOnly = mode === 'view';

  useEffect(() => {
    if (!open) { setConfirmDelete(false); return; }
    if ((mode === 'edit' || mode === 'view') && rapport) {
      setForm({
        code_rapport:    rapport.code_rapport,
        titre:           rapport.titre,
        description:     rapport.description ?? '',
        type:            rapport.type,
        format:          rapport.format,
        statut:          rapport.statut,
        periode:         rapport.periode,
        version:         rapport.version,
        auteur:          rapport.auteur,
        taille_ko:       String(rapport.taille_ko),
        commentaires:    rapport.commentaires ?? '',
        date_generation: rapport.date_generation,
      });
    } else {
      setForm({ ...INIT, code_rapport: nextCode });
    }
    setErrors({});
    setConfirmDelete(false);
  }, [open, mode, rapport, nextCode]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.code_rapport.trim())    e.code_rapport    = 'Le code est requis.';
    if (!form.titre.trim())           e.titre           = 'Le titre est requis.';
    if (!form.auteur.trim())          e.auteur          = "L'auteur est requis.";
    if (!form.periode.trim())         e.periode         = 'La période est requise.';
    if (!form.version.trim())         e.version         = 'La version est requise.';
    if (!form.date_generation.trim()) e.date_generation = 'La date est requise.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    onSave(
      {
        code_rapport:    form.code_rapport.trim(),
        titre:           form.titre.trim(),
        description:     form.description.trim() || undefined,
        type:            form.type,
        format:          form.format,
        statut:          form.statut,
        periode:         form.periode.trim(),
        version:         form.version.trim(),
        auteur:          form.auteur.trim(),
        taille_ko:       Math.max(0, parseInt(form.taille_ko, 10) || 0),
        commentaires:    form.commentaires.trim() || undefined,
        date_generation: form.date_generation,
        nb_telechargements: rapport?.nb_telechargements ?? 0,
      },
      rapport?.id,
    );
    onOpenChange(false);
  }

  function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    if (rapport?.id) onDelete?.(rapport.id);
    onOpenChange(false);
  }

  const title =
    mode === 'new'  ? 'Générer un rapport' :
    mode === 'edit' ? 'Modifier le rapport' :
    'Détail du rapport';

  const statutLabel = STATUT_RAPPORT_OPTIONS.find(o => o.value === form.statut)?.label ?? '';
  const typeLabel   = TYPE_RAPPORT_OPTIONS.find(o => o.value === form.type)?.label ?? '';

  return (
    <SlideOver open={open} onOpenChange={onOpenChange}>
      <SlideOverContent>
        {/* ── Header ── */}
        <SlideOverHeader>
          <div>
            <SlideOverTitle>{title}</SlideOverTitle>
            {rapport && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {rapport.code_rapport} · {typeLabel} · v{rapport.version}
              </p>
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
          {rapport && (
            <div className="rounded-lg border border-border bg-muted/30 p-4 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Format</p>
                  <p className="text-lg font-bold font-mono text-primary">{rapport.format}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Taille</p>
                  <p className="text-sm font-semibold">{fmtTaille(rapport.taille_ko)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Téléchargements</p>
                  <p className="text-sm font-semibold">{rapport.nb_telechargements}</p>
                </div>
              </div>
              <Badge variant={statutVariant(rapport.statut)}>{statutLabel}</Badge>
            </div>
          )}

          {/* View mode — actions */}
          {readOnly && rapport && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline" size="sm"
                onClick={() => { simulateDownload(rapport); onDownload?.(rapport.id); }}
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Télécharger
              </Button>
              {onDuplicate && (
                <Button variant="outline" size="sm" onClick={() => { onDuplicate(rapport.id); onOpenChange(false); }}>
                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                  Dupliquer
                </Button>
              )}
              {onArchive && (
                <Button variant="outline" size="sm" onClick={() => { onArchive(rapport.id); onOpenChange(false); }}>
                  {rapport.statut === 'ARCHIVE'
                    ? <><RotateCcw className="h-3.5 w-3.5 mr-1.5" />Restaurer</>
                    : <><Archive className="h-3.5 w-3.5 mr-1.5" />Archiver</>}
                </Button>
              )}
            </div>
          )}

          {/* Section: Identification */}
          <div className="space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Identification
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground" htmlFor="rpt-code">
                  Code <span className="text-destructive">*</span>
                </label>
                <Input id="rpt-code" value={form.code_rapport}
                  onChange={e => set('code_rapport', e.target.value)}
                  placeholder="RPT-001" disabled={readOnly} error={!!errors.code_rapport} />
                {errors.code_rapport && <p className="text-xs text-destructive">{errors.code_rapport}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground" htmlFor="rpt-version">
                  Version <span className="text-destructive">*</span>
                </label>
                <Input id="rpt-version" value={form.version}
                  onChange={e => set('version', e.target.value)}
                  placeholder="1.0" disabled={readOnly} error={!!errors.version} />
                {errors.version && <p className="text-xs text-destructive">{errors.version}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground" htmlFor="rpt-titre">
                Titre <span className="text-destructive">*</span>
              </label>
              <Input id="rpt-titre" value={form.titre}
                onChange={e => set('titre', e.target.value)}
                placeholder="Titre du rapport" disabled={readOnly} error={!!errors.titre} />
              {errors.titre && <p className="text-xs text-destructive">{errors.titre}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground" htmlFor="rpt-desc">Description</label>
              <Textarea id="rpt-desc" value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Résumé du contenu et de l'objet du rapport…"
                rows={3} disabled={readOnly} className="resize-none" />
            </div>
          </div>

          {/* Section: Classification */}
          <div className="space-y-4 pt-1 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-3">
              Classification
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground" htmlFor="rpt-type">Type</label>
                <Select id="rpt-type" value={form.type}
                  onChange={e => set('type', e.target.value as TypeRapport)}
                  disabled={readOnly}>
                  {TYPE_RAPPORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground" htmlFor="rpt-format">Format</label>
                <Select id="rpt-format" value={form.format}
                  onChange={e => set('format', e.target.value as FormatRapport)}
                  disabled={readOnly}>
                  {FORMAT_RAPPORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground" htmlFor="rpt-statut">Statut</label>
                <Select id="rpt-statut" value={form.statut}
                  onChange={e => set('statut', e.target.value as StatutRapport)}
                  disabled={readOnly}>
                  {STATUT_RAPPORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground" htmlFor="rpt-periode">
                  Période <span className="text-destructive">*</span>
                </label>
                <Input id="rpt-periode" value={form.periode}
                  onChange={e => set('periode', e.target.value)}
                  placeholder="Ex: T1 2026, Janvier 2026, Annuel 2025"
                  disabled={readOnly} error={!!errors.periode} />
                {errors.periode && <p className="text-xs text-destructive">{errors.periode}</p>}
              </div>
            </div>
          </div>

          {/* Section: Auteur & Fichier */}
          <div className="space-y-4 pt-1 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-3">
              Auteur & Fichier
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground" htmlFor="rpt-auteur">
                  Auteur <span className="text-destructive">*</span>
                </label>
                <Input id="rpt-auteur" value={form.auteur}
                  onChange={e => set('auteur', e.target.value)}
                  placeholder="Nom de l'auteur" disabled={readOnly} error={!!errors.auteur} />
                {errors.auteur && <p className="text-xs text-destructive">{errors.auteur}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground" htmlFor="rpt-date">
                  Date de génération <span className="text-destructive">*</span>
                </label>
                <Input id="rpt-date" type="date" value={form.date_generation}
                  onChange={e => set('date_generation', e.target.value)}
                  disabled={readOnly} error={!!errors.date_generation} />
                {errors.date_generation && <p className="text-xs text-destructive">{errors.date_generation}</p>}
              </div>
              <div className="space-y-1.5 col-span-2">
                <label className="text-xs font-medium text-foreground" htmlFor="rpt-taille">Taille (Ko)</label>
                <Input id="rpt-taille" type="number" min={0} value={form.taille_ko}
                  onChange={e => set('taille_ko', e.target.value)}
                  placeholder="0" disabled={readOnly} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground" htmlFor="rpt-commentaires">Commentaires</label>
              <Textarea id="rpt-commentaires" value={form.commentaires}
                onChange={e => set('commentaires', e.target.value)}
                placeholder="Observations, notes de validation, recommandations…"
                rows={3} disabled={readOnly} className="resize-none" />
            </div>
          </div>

          {/* Historique (view/edit) */}
          {rapport && (
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Historique</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <span className="text-muted-foreground">Créé le</span>
                <span className="text-foreground font-medium">
                  {new Date(rapport.createdAt).toLocaleDateString('fr-FR')}
                </span>
                <span className="text-muted-foreground">Modifié le</span>
                <span className="text-foreground font-medium">
                  {new Date(rapport.updatedAt).toLocaleDateString('fr-FR')}
                </span>
                {rapport.date_telechargement && (
                  <>
                    <span className="text-muted-foreground">Dernier téléchargement</span>
                    <span className="text-foreground font-medium">
                      {new Date(rapport.date_telechargement).toLocaleDateString('fr-FR')}
                    </span>
                  </>
                )}
                <span className="text-muted-foreground">Téléchargements</span>
                <span className="text-foreground font-medium">{rapport.nb_telechargements}</span>
              </div>
            </div>
          )}

          {/* Supprimer (edit) */}
          {mode === 'edit' && rapport && onDelete && (
            <div className="pt-2 border-t border-border">
              {confirmDelete ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2">
                  <p className="text-xs text-destructive font-medium">
                    Confirmer la suppression de {rapport.code_rapport} ?
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
                  Supprimer ce rapport
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
              {mode === 'new' ? 'Générer le rapport' : 'Enregistrer'}
            </Button>
          )}
        </SlideOverFooter>
      </SlideOverContent>
    </SlideOver>
  );
}
