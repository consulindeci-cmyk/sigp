import { useEffect, useState } from 'react';
import { X, Download, Copy, Archive, RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react';
import type { RapportProjet, TypeRapport, StatutRapport, FormatRapport } from '@/types';
import {
  TYPE_RAPPORT_OPTIONS, STATUT_RAPPORT_OPTIONS,
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
import { useAuthStore } from '@/stores/authStore';
import { useUploadDocument, useDownloadDocumentVersion } from '@/hooks/useDocuments';
import { useCreateReport } from '@/hooks/useReports';
import { buildReportFile, triggerBrowserDownload, type BuildableFormat } from '@/lib/reportBuilder';

// ─────────────────────────────────────────────────────────────────────────────
// "new" = vraie génération (cf. audit Documents & Rapports / moteur global
// reportBuilder.ts) : plus de simulateDownload() ni de blob .txt fictif.
// Construit le vrai PDF/Excel à partir des données réelles du projet,
// déclenche le téléchargement navigateur, téléverse le binaire réel vers
// sigp-documents et n'enregistre la fiche rapports_projet qu'une fois le
// fichier réellement stocké. "edit"/"view" restent des écrans de métadonnées
// sur un rapport déjà généré (pas de régénération du fichier).
// ─────────────────────────────────────────────────────────────────────────────

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

interface GenerateFormState {
  titre:        string;
  description:  string;
  type:         TypeRapport;
  format:       BuildableFormat;
  dateDebut:    string;
  dateFin:      string;
  commentaires: string;
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
  projectId:    string;
  canManage:    boolean;
  onSave:       (payload: ReportSavePayload, id: string) => void;
  onDelete?:    (id: string) => void;
  onDuplicate?: (id: string) => void;
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

const INIT_GEN: GenerateFormState = {
  titre:        '',
  description:  '',
  type:         'MENSUEL',
  format:       'PDF',
  dateDebut:    new Date().toISOString().slice(0, 10).slice(0, 8) + '01',
  dateFin:      new Date().toISOString().slice(0, 10),
  commentaires: '',
};

// ─── Component ───────────────────────────────────────────────────────────────

export function ReportSlideOver({
  open, onOpenChange, mode, rapport, nextCode = 'RPT-001', projectId, canManage,
  onSave, onDelete, onDuplicate, onArchive,
}: ReportSlideOverProps) {
  const [form, setForm]     = useState<FormState>(INIT);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [genForm, setGenForm]     = useState<GenerateFormState>(INIT_GEN);
  const [genErrors, setGenErrors] = useState<Partial<Record<keyof GenerateFormState, string>>>({});
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError]     = useState<string | null>(null);
  const [genDone, setGenDone]       = useState(false);

  const [downloadError, setDownloadError] = useState<string | null>(null);

  const currentUser = useAuthStore(s => s.user);
  const authorName = currentUser
    ? (`${currentUser.prenom ?? ''} ${currentUser.nom ?? ''}`.trim() || currentUser.email)
    : 'Utilisateur';

  const uploadMutation       = useUploadDocument(projectId);
  const createReportMutation = useCreateReport(projectId);
  const downloadMutation     = useDownloadDocumentVersion();

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
    } else if (mode === 'new') {
      setGenForm({ ...INIT_GEN });
      setGenErrors({});
      setGenerating(false);
      setGenError(null);
      setGenDone(false);
    }
    setErrors({});
    setDownloadError(null);
    setConfirmDelete(false);
  }, [open, mode, rapport, nextCode]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
  }

  function setGen<K extends keyof GenerateFormState>(key: K, value: GenerateFormState[K]) {
    setGenForm(prev => ({ ...prev, [key]: value }));
    if (genErrors[key]) setGenErrors(prev => ({ ...prev, [key]: undefined }));
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
    if (!rapport || !validate()) return;
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
        nb_telechargements: rapport.nb_telechargements,
      },
      rapport.id,
    );
  }

  function validateGen(): boolean {
    const e: Partial<Record<keyof GenerateFormState, string>> = {};
    if (!genForm.titre.trim())  e.titre     = 'Le titre est requis.';
    if (!genForm.dateDebut)     e.dateDebut = 'La date de début est requise.';
    if (!genForm.dateFin)       e.dateFin   = 'La date de fin est requise.';
    setGenErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleGenerate() {
    if (!validateGen()) return;
    setGenerating(true);
    setGenError(null);
    try {
      const built = await buildReportFile({
        type: genForm.type,
        format: genForm.format,
        projectId,
        reportTitle: genForm.titre.trim(),
        reportCode: nextCode,
        dateDebut: genForm.dateDebut,
        dateFin: genForm.dateFin,
      });

      // Téléchargement navigateur immédiat du fichier réellement construit.
      triggerBrowserDownload(built.blob, built.fileName);

      const file  = new File([built.blob], built.fileName, { type: built.mimeType });
      const today = new Date().toISOString().slice(0, 10);

      // 1. Fichier réel vers le bucket privé sigp-documents.
      const createdDoc = await uploadMutation.mutateAsync({
        file,
        meta: {
          projet_id: projectId,
          code_document: `RPT-${nextCode}`,
          titre: built.fileName,
          categorie: 'Rapport',
          version: '1.0',
          auteur: authorName,
          responsable: authorName,
          date_creation: today,
          date_modification: today,
          statut: 'VALIDE',
          taille_ko: built.sizeKo,
          type_fichier: genForm.format,
          mots_cles: [],
          confidentialite: 'INTERNE',
        },
      });

      // 2. Fiche de catalogue rapports_projet, référençant le vrai fichier —
      // n'est écrite qu'une fois le fichier réellement stocké (pas avant).
      await createReportMutation.mutateAsync({
        projet_id: projectId,
        code_rapport: nextCode,
        titre: genForm.titre.trim(),
        description: genForm.description.trim() || undefined,
        type: genForm.type,
        format: genForm.format,
        statut: 'GENERE',
        periode: `${genForm.dateDebut} → ${genForm.dateFin}`,
        version: '1.0',
        auteur: authorName,
        taille_ko: built.sizeKo,
        commentaires: genForm.commentaires.trim() || undefined,
        nb_telechargements: 0,
        date_generation: today,
        documentId: createdDoc.id,
      });

      setGenerating(false);
      setGenDone(true);
    } catch (err) {
      setGenerating(false);
      setGenError(err instanceof Error ? err.message : 'Échec de la génération du rapport.');
    }
  }

  function handleDownload() {
    if (!rapport?.documentId) return;
    setDownloadError(null);
    downloadMutation.mutate(rapport.documentId, {
      onSuccess: (data) => window.open(data.url, '_blank', 'noopener,noreferrer'),
      onError: (err) => setDownloadError(err instanceof Error ? err.message : 'Échec du téléchargement du rapport.'),
    });
  }

  function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    if (rapport?.id) onDelete?.(rapport.id);
  }

  const title =
    mode === 'new'  ? 'Générer un rapport' :
    mode === 'edit' ? 'Modifier le rapport' :
    'Détail du rapport';

  const statutLabel = STATUT_RAPPORT_OPTIONS.find(o => o.value === form.statut)?.label ?? '';
  const typeLabel   = TYPE_RAPPORT_OPTIONS.find(o => o.value === form.type)?.label ?? '';
  const genBusy     = generating || uploadMutation.isPending || createReportMutation.isPending;

  // ─── Mode "new" — vrai moteur de génération ──────────────────────────────
  if (mode === 'new') {
    return (
      <SlideOver open={open} onOpenChange={onOpenChange}>
        <SlideOverContent>
          <SlideOverHeader>
            <SlideOverTitle>Générer un rapport</SlideOverTitle>
            <SlideOverClose asChild>
              <Button variant="ghost" size="icon" aria-label="Fermer">
                <X className="h-4 w-4" />
              </Button>
            </SlideOverClose>
          </SlideOverHeader>

          <SlideOverBody className="space-y-5">
            {!genDone && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground" htmlFor="gen-titre">
                    Titre <span className="text-destructive">*</span>
                  </label>
                  <Input id="gen-titre" value={genForm.titre}
                    onChange={e => setGen('titre', e.target.value)}
                    placeholder="Ex: Rapport d'avancement T1 2026"
                    disabled={genBusy} error={!!genErrors.titre} />
                  {genErrors.titre && <p className="text-xs text-destructive">{genErrors.titre}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground" htmlFor="gen-desc">Description</label>
                  <Textarea id="gen-desc" value={genForm.description}
                    onChange={e => setGen('description', e.target.value)}
                    placeholder="Résumé du contenu et de l'objet du rapport…"
                    rows={2} disabled={genBusy} className="resize-none" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground" htmlFor="gen-type">Type</label>
                    <Select id="gen-type" value={genForm.type}
                      onChange={e => setGen('type', e.target.value as TypeRapport)}
                      disabled={genBusy}>
                      {TYPE_RAPPORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground" htmlFor="gen-format">Format</label>
                    <Select id="gen-format" value={genForm.format}
                      onChange={e => setGen('format', e.target.value as BuildableFormat)}
                      disabled={genBusy}>
                      <option value="PDF">PDF</option>
                      <option value="Excel">Excel (XLSX)</option>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground" htmlFor="gen-debut">
                      Date début <span className="text-destructive">*</span>
                    </label>
                    <Input id="gen-debut" type="date" value={genForm.dateDebut}
                      onChange={e => setGen('dateDebut', e.target.value)}
                      disabled={genBusy} error={!!genErrors.dateDebut} />
                    {genErrors.dateDebut && <p className="text-xs text-destructive">{genErrors.dateDebut}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground" htmlFor="gen-fin">
                      Date fin <span className="text-destructive">*</span>
                    </label>
                    <Input id="gen-fin" type="date" value={genForm.dateFin}
                      onChange={e => setGen('dateFin', e.target.value)}
                      disabled={genBusy} error={!!genErrors.dateFin} />
                    {genErrors.dateFin && <p className="text-xs text-destructive">{genErrors.dateFin}</p>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground" htmlFor="gen-commentaires">Commentaires</label>
                  <Textarea id="gen-commentaires" value={genForm.commentaires}
                    onChange={e => setGen('commentaires', e.target.value)}
                    placeholder="Observations, notes…"
                    rows={2} disabled={genBusy} className="resize-none" />
                </div>
              </div>
            )}

            {genError && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive" role="alert">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{genError}</span>
              </div>
            )}

            {genDone && (
              <div className="flex items-center gap-2 text-success text-sm bg-success/10 rounded-md px-4 py-3 border border-success/20">
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-medium">Rapport généré, téléchargé et enregistré</p>
                  <p className="text-[11px] text-success/80 mt-0.5">
                    {genForm.titre} — {genForm.format} · {genForm.dateDebut} → {genForm.dateFin}
                  </p>
                </div>
              </div>
            )}
          </SlideOverBody>

          <SlideOverFooter>
            <SlideOverClose asChild>
              <Button variant="outline">{genDone ? 'Fermer' : 'Annuler'}</Button>
            </SlideOverClose>
            {!genDone && (
              <Button onClick={handleGenerate} disabled={genBusy}>
                {genBusy ? 'Génération en cours…' : 'Générer le rapport'}
              </Button>
            )}
          </SlideOverFooter>
        </SlideOverContent>
      </SlideOver>
    );
  }

  // ─── Modes "edit" / "view" — métadonnées d'un rapport déjà généré ────────
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

          {downloadError && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive" role="alert">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{downloadError}</span>
            </div>
          )}

          {/* View mode — actions */}
          {readOnly && rapport && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline" size="sm"
                onClick={handleDownload}
                disabled={!rapport.documentId || downloadMutation.isPending}
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                {downloadMutation.isPending ? 'Téléchargement…' : 'Télécharger'}
              </Button>
              {canManage && onDuplicate && (
                <Button variant="outline" size="sm" onClick={() => onDuplicate(rapport.id)}>
                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                  Dupliquer
                </Button>
              )}
              {canManage && onArchive && (
                <Button variant="outline" size="sm" onClick={() => onArchive(rapport.id)}>
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
                  placeholder="RPT-001" disabled={true} error={!!errors.code_rapport} />
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
                <Input id="rpt-format" value={form.format} disabled className="font-mono" />
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
                <Input id="rpt-periode" value={form.periode} disabled className="font-mono" />
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
                  Date de génération
                </label>
                <Input id="rpt-date" type="date" value={form.date_generation} disabled />
              </div>
              <div className="space-y-1.5 col-span-2">
                <label className="text-xs font-medium text-foreground" htmlFor="rpt-taille">Taille (Ko)</label>
                <Input id="rpt-taille" type="number" min={0} value={form.taille_ko} disabled />
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
          {mode === 'edit' && rapport && onDelete && canManage && (
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
          {!readOnly && canManage && (
            <Button onClick={handleSave}>
              Enregistrer
            </Button>
          )}
        </SlideOverFooter>
      </SlideOverContent>
    </SlideOver>
  );
}
