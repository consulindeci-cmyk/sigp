import { useEffect, useRef, useState } from 'react';
import { X, Upload, Download, Copy, Archive, RotateCcw, AlertCircle } from 'lucide-react';
import type {
  DocumentProjet, DocumentCategorie, TypeFichier,
  StatutDocument, ConfidentialiteDocument,
} from '@/types';
import {
  DOCUMENT_CATEGORIES, TYPE_FICHIER_OPTIONS,
  STATUT_DOCUMENT_OPTIONS, CONFIDENTIALITE_OPTIONS,
} from '@/mocks/documentsMocks';
import {
  SlideOver, SlideOverContent, SlideOverHeader, SlideOverTitle,
  SlideOverBody, SlideOverFooter, SlideOverClose,
} from '@/components/ui/overlays/SlideOver';
import { Button }   from '@/components/ui/forms/Button';
import { Input }    from '@/components/ui/forms/Input';
import { Textarea } from '@/components/ui/forms/Textarea';
import { Select }   from '@/components/ui/forms/Select';
import { Badge }    from '@/components/ui/data-display/Badge';
import { useDownloadDocumentVersion } from '@/hooks/useDocuments';

// ─── Types ───────────────────────────────────────────────────────────────────

interface FormState {
  code_document:   string;
  titre:           string;
  description:     string;
  categorie:       DocumentCategorie;
  activite_liee:   string;
  version:         string;
  auteur:          string;
  responsable:     string;
  date_creation:   string;
  statut:          StatutDocument;
  taille_ko:       string;
  type_fichier:    TypeFichier;
  mots_cles:       string;
  confidentialite: ConfidentialiteDocument;
}

export interface DocumentSavePayload {
  code_document:   string;
  titre:           string;
  description?:    string;
  categorie:       DocumentCategorie;
  activite_liee?:  string;
  version:         string;
  auteur:          string;
  responsable:     string;
  date_creation:   string;
  statut:          StatutDocument;
  taille_ko:       number;
  type_fichier:    TypeFichier;
  mots_cles:       string[];
  confidentialite: ConfidentialiteDocument;
}

export interface DocumentSlideOverProps {
  open:          boolean;
  onOpenChange:  (v: boolean) => void;
  mode:          'new' | 'edit' | 'view';
  document?:     DocumentProjet | null;
  nextCode?:     string;
  onSave:        (payload: DocumentSavePayload, id?: string) => void;
  onDelete?:     (id: string) => void;
  onDuplicate?:  (id: string) => void;
  onArchive?:    (id: string) => void;
  canManage?:    boolean;
  canDelete?:    boolean;
  isSaving?:     boolean;
  isDeleting?:   boolean;
  error?:        string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtTaille(ko: number): string {
  if (ko < 1024)          return `${ko} Ko`;
  if (ko < 1024 * 1024)   return `${(ko / 1024).toFixed(1)} Mo`;
  return `${(ko / (1024 * 1024)).toFixed(1)} Go`;
}

function statutVariant(s: StatutDocument): 'outline' | 'warning' | 'success' | 'secondary' {
  if (s === 'VALIDE')        return 'success';
  if (s === 'EN_VALIDATION') return 'warning';
  if (s === 'BROUILLON')     return 'outline';
  return 'secondary';
}

function typeColor(t: TypeFichier): string {
  if (t === 'PDF')   return 'text-destructive';
  if (t === 'Word')  return 'text-primary';
  if (t === 'Excel') return 'text-success';
  if (t === 'Image') return 'text-warning';
  return 'text-muted-foreground';
}

const INIT: FormState = {
  code_document:   '',
  titre:           '',
  description:     '',
  categorie:       'Rapport',
  activite_liee:   '',
  version:         '1.0',
  auteur:          '',
  responsable:     '',
  date_creation:   new Date().toISOString().slice(0, 10),
  statut:          'BROUILLON',
  taille_ko:       '0',
  type_fichier:    'PDF',
  mots_cles:       '',
  confidentialite: 'INTERNE',
};

// ─── Component ───────────────────────────────────────────────────────────────

export function DocumentSlideOver({
  open, onOpenChange, mode, document: doc, nextCode = 'DOC-001',
  onSave, onDelete, onDuplicate, onArchive,
  canManage = true, canDelete = true, isSaving = false, isDeleting = false, error = null,
}: DocumentSlideOverProps) {
  const [form, setForm]           = useState<FormState>(INIT);
  const [errors, setErrors]       = useState<Partial<Record<keyof FormState, string>>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const downloadMutation = useDownloadDocumentVersion();

  const readOnly = mode === 'view';

  useEffect(() => {
    if (!open) { setConfirmDelete(false); return; }
    if ((mode === 'edit' || mode === 'view') && doc) {
      setForm({
        code_document:   doc.code_document,
        titre:           doc.titre,
        description:     doc.description ?? '',
        categorie:       doc.categorie,
        activite_liee:   doc.activite_liee ?? '',
        version:         doc.version,
        auteur:          doc.auteur,
        responsable:     doc.responsable,
        date_creation:   doc.date_creation,
        statut:          doc.statut,
        taille_ko:       String(doc.taille_ko),
        type_fichier:    doc.type_fichier,
        mots_cles:       doc.mots_cles.join(', '),
        confidentialite: doc.confidentialite,
      });
    } else {
      setForm({ ...INIT, code_document: nextCode });
    }
    setErrors({});
    setConfirmDelete(false);
  }, [open, mode, doc, nextCode]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    const typeMap: Record<string, TypeFichier> = {
      pdf: 'PDF', docx: 'Word', doc: 'Word',
      xlsx: 'Excel', xls: 'Excel',
      png: 'Image', jpg: 'Image', jpeg: 'Image', gif: 'Image', webp: 'Image',
      zip: 'ZIP', rar: 'ZIP',
    };
    const type: TypeFichier = typeMap[ext] ?? 'Autre';
    const taille = Math.max(1, Math.round(file.size / 1024));
    const auto_titre = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ');
    setForm(prev => ({
      ...prev,
      type_fichier: type,
      taille_ko: String(taille),
      titre: prev.titre || auto_titre,
    }));
    if (fileRef.current) fileRef.current.value = '';
  }

  // Fichier réel via URL signée (60s) — remplace l'ancien téléchargement
  // simulé qui générait un .txt fabriqué au lieu du vrai document (cf. audit).
  function handleDownload() {
    if (!doc) return;
    setDownloadError(null);
    downloadMutation.mutate(doc.id, {
      onSuccess: (data) => window.open(data.url, '_blank', 'noopener,noreferrer'),
      onError: (err) => setDownloadError(err instanceof Error ? err.message : 'Échec du téléchargement.'),
    });
  }

  function validate(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.code_document.trim()) e.code_document = 'Le code est requis.';
    if (!form.titre.trim())         e.titre         = 'Le titre est requis.';
    if (!form.auteur.trim())        e.auteur        = 'L\'auteur est requis.';
    if (!form.responsable.trim())   e.responsable   = 'Le responsable est requis.';
    if (!form.version.trim())       e.version       = 'La version est requise.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // Le SlideOver ne se ferme plus lui-même : le parent possède la mutation et
  // ne ferme qu'après confirmation serveur (cf. audit — fermeture aveugle
  // avant réponse du serveur, qui masquait tout échec 403/réseau).
  function handleSave() {
    if (!validate()) return;
    onSave(
      {
        code_document:   form.code_document.trim(),
        titre:           form.titre.trim(),
        description:     form.description.trim() || undefined,
        categorie:       form.categorie,
        activite_liee:   form.activite_liee.trim() || undefined,
        version:         form.version.trim(),
        auteur:          form.auteur.trim(),
        responsable:     form.responsable.trim(),
        date_creation:   form.date_creation,
        statut:          form.statut,
        taille_ko:       Math.max(0, parseInt(form.taille_ko, 10) || 0),
        type_fichier:    form.type_fichier,
        mots_cles:       form.mots_cles.split(',').map(k => k.trim()).filter(Boolean),
        confidentialite: form.confidentialite,
      },
      doc?.id,
    );
  }

  function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    if (doc?.id) onDelete?.(doc.id);
  }

  const title =
    mode === 'new'  ? 'Nouveau document' :
    mode === 'edit' ? 'Modifier le document' :
    'Détail du document';

  const statutLabel = STATUT_DOCUMENT_OPTIONS.find(o => o.value === (readOnly ? doc?.statut : form.statut))?.label ?? '';

  return (
    <SlideOver open={open} onOpenChange={onOpenChange}>
      <SlideOverContent>
        {/* ── Header ── */}
        <SlideOverHeader>
          <div>
            <SlideOverTitle>{title}</SlideOverTitle>
            {doc && (
              <p className="text-xs text-muted-foreground mt-0.5">{doc.code_document} · v{doc.version}</p>
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
          {doc && (
            <div className="rounded-lg border border-border bg-muted/30 p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`text-3xl font-bold font-mono ${typeColor(readOnly ? doc.type_fichier : form.type_fichier as TypeFichier)}`}>
                  {(readOnly ? doc.type_fichier : form.type_fichier).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Taille</p>
                  <p className="text-sm font-semibold">{fmtTaille(readOnly ? doc.taille_ko : parseInt(form.taille_ko, 10) || 0)}</p>
                </div>
              </div>
              <Badge variant={statutVariant(readOnly ? doc.statut : form.statut as StatutDocument)}>
                {statutLabel}
              </Badge>
            </div>
          )}

          {/* View mode — actions */}
          {readOnly && doc && (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload} disabled={downloadMutation.isPending}>
                <Download className="h-3.5 w-3.5 mr-1.5" />
                {downloadMutation.isPending ? 'Préparation...' : 'Télécharger'}
              </Button>
              {onDuplicate && canManage && (
                <Button variant="outline" size="sm" onClick={() => onDuplicate(doc.id)}>
                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                  Dupliquer
                </Button>
              )}
              {onArchive && canManage && (
                <Button variant="outline" size="sm" onClick={() => onArchive(doc.id)}>
                  {doc.statut === 'ARCHIVE'
                    ? <><RotateCcw className="h-3.5 w-3.5 mr-1.5" />Restaurer</>
                    : <><Archive className="h-3.5 w-3.5 mr-1.5" />Archiver</>
                  }
                </Button>
              )}
            </div>
          )}
          {downloadError && (
            <p className="text-xs text-destructive flex items-center gap-1.5" role="alert">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {downloadError}
            </p>
          )}

          {/* Section: Identification */}
          <div className="space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Identification
            </p>

            {/* Sélecteur de fichier (new / edit uniquement) — auto-détecte
                type/taille pour le formulaire, mais n'envoie PAS encore le
                fichier réel vers documents-upload-version (contrairement à
                la zone de dépôt globale de TabDocuments.tsx, corrigée cette
                session). Hors périmètre de ce chantier — signalé, non
                corrigé : ce sélecteur reste, pour l'instant, un remplissage
                automatique de champs, pas un vrai téléversement. */}
            {!readOnly && (
              <div className="rounded-lg border-2 border-dashed border-border bg-muted/10 p-3 flex items-center gap-3">
                <Button variant="outline" size="sm" type="button" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  Sélectionner un fichier
                </Button>
                <p className="text-xs text-muted-foreground">Auto-détecte type et taille</p>
                <input ref={fileRef} type="file" className="sr-only" aria-hidden="true" tabIndex={-1} onChange={handleFileSelect} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground" htmlFor="doc-code">
                  Code <span className="text-destructive">*</span>
                </label>
                <Input id="doc-code" value={form.code_document}
                  onChange={e => set('code_document', e.target.value)}
                  placeholder="DOC-001" disabled={readOnly} error={!!errors.code_document} />
                {errors.code_document && <p className="text-xs text-destructive">{errors.code_document}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground" htmlFor="doc-version">
                  Version <span className="text-destructive">*</span>
                </label>
                <Input id="doc-version" value={form.version}
                  onChange={e => set('version', e.target.value)}
                  placeholder="1.0" disabled={readOnly} error={!!errors.version} />
                {errors.version && <p className="text-xs text-destructive">{errors.version}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground" htmlFor="doc-titre">
                Titre <span className="text-destructive">*</span>
              </label>
              <Input id="doc-titre" value={form.titre}
                onChange={e => set('titre', e.target.value)}
                placeholder="Titre du document" disabled={readOnly} error={!!errors.titre} />
              {errors.titre && <p className="text-xs text-destructive">{errors.titre}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground" htmlFor="doc-desc">Description</label>
              <Textarea id="doc-desc" value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Résumé du contenu et de l'objet du document…"
                rows={3} disabled={readOnly} className="resize-none" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground" htmlFor="doc-activite">Activité liée</label>
              <Input id="doc-activite" value={form.activite_liee}
                onChange={e => set('activite_liee', e.target.value)}
                placeholder="Ex: Composante A — Infrastructures" disabled={readOnly} />
            </div>
          </div>

          {/* Section: Classification */}
          <div className="space-y-4 pt-1 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-3">
              Classification
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground" htmlFor="doc-cat">Catégorie</label>
                <Select id="doc-cat" value={form.categorie}
                  onChange={e => set('categorie', e.target.value as DocumentCategorie)}
                  disabled={readOnly}>
                  {DOCUMENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground" htmlFor="doc-type">Type de fichier</label>
                <Select id="doc-type" value={form.type_fichier}
                  onChange={e => set('type_fichier', e.target.value as TypeFichier)}
                  disabled={readOnly}>
                  {TYPE_FICHIER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground" htmlFor="doc-statut">Statut</label>
                <Select id="doc-statut" value={form.statut}
                  onChange={e => set('statut', e.target.value as StatutDocument)}
                  disabled={readOnly}>
                  {STATUT_DOCUMENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground" htmlFor="doc-conf">Confidentialité</label>
                <Select id="doc-conf" value={form.confidentialite}
                  onChange={e => set('confidentialite', e.target.value as ConfidentialiteDocument)}
                  disabled={readOnly}>
                  {CONFIDENTIALITE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground" htmlFor="doc-mots">Mots-clés</label>
              <Input id="doc-mots" value={form.mots_cles}
                onChange={e => set('mots_cles', e.target.value)}
                placeholder="contrat, eau, zone nord (séparés par des virgules)"
                disabled={readOnly} />
              {readOnly && doc && doc.mots_cles.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {doc.mots_cles.map(kw => (
                    <Badge key={kw} variant="outline" className="text-[10px]">{kw}</Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section: Responsabilité & Fichier */}
          <div className="space-y-4 pt-1 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-3">
              Responsabilité & Fichier
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground" htmlFor="doc-auteur">
                  Auteur <span className="text-destructive">*</span>
                </label>
                <Input id="doc-auteur" value={form.auteur}
                  onChange={e => set('auteur', e.target.value)}
                  placeholder="Nom de l'auteur" disabled={readOnly} error={!!errors.auteur} />
                {errors.auteur && <p className="text-xs text-destructive">{errors.auteur}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground" htmlFor="doc-resp">
                  Responsable <span className="text-destructive">*</span>
                </label>
                <Input id="doc-resp" value={form.responsable}
                  onChange={e => set('responsable', e.target.value)}
                  placeholder="Nom du responsable" disabled={readOnly} error={!!errors.responsable} />
                {errors.responsable && <p className="text-xs text-destructive">{errors.responsable}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground" htmlFor="doc-date">Date de création</label>
                <Input id="doc-date" type="date" value={form.date_creation}
                  onChange={e => set('date_creation', e.target.value)}
                  disabled={readOnly} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground" htmlFor="doc-taille">Taille (Ko)</label>
                <Input id="doc-taille" type="number" min={0} value={form.taille_ko}
                  onChange={e => set('taille_ko', e.target.value)}
                  placeholder="0" disabled={readOnly} />
              </div>
            </div>
          </div>

          {/* Historique (view/edit) */}
          {doc && (
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Historique</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <span className="text-muted-foreground">Créé le</span>
                <span className="text-foreground font-medium">
                  {new Date(doc.createdAt).toLocaleDateString('fr-FR')}
                </span>
                <span className="text-muted-foreground">Modifié le</span>
                <span className="text-foreground font-medium">
                  {doc.date_modification
                    ? new Date(doc.date_modification).toLocaleDateString('fr-FR')
                    : '—'}
                </span>
                <span className="text-muted-foreground">Auteur</span>
                <span className="text-foreground font-medium">{doc.auteur}</span>
                <span className="text-muted-foreground">Responsable</span>
                <span className="text-foreground font-medium">{doc.responsable}</span>
              </div>
            </div>
          )}

          {/* Bouton Supprimer (edit) */}
          {mode === 'edit' && doc && onDelete && canDelete && (
            <div className="pt-2 border-t border-border">
              {confirmDelete ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2">
                  <p className="text-xs text-destructive font-medium">
                    Confirmer la suppression de {doc.code_document} ?
                  </p>
                  <div className="flex gap-2">
                    <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isDeleting}>
                      {isDeleting ? 'Suppression...' : 'Supprimer définitivement'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)} disabled={isDeleting}>
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
                  Supprimer ce document
                </Button>
              )}
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive" role="alert">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}
        </SlideOverBody>

        {/* ── Footer ── */}
        <SlideOverFooter>
          <SlideOverClose asChild>
            <Button variant="outline">{readOnly ? 'Fermer' : 'Annuler'}</Button>
          </SlideOverClose>
          {!readOnly && (
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Enregistrement...' : mode === 'new' ? 'Créer le document' : 'Enregistrer'}
            </Button>
          )}
        </SlideOverFooter>
      </SlideOverContent>
    </SlideOver>
  );
}
