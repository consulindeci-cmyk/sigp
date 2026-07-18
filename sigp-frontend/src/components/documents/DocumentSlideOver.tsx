import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type {
  DocumentGlobal, CategorieGlobalDoc, StatutGlobalDoc,
  ConfidentialiteGlobalDoc, TypeFichier,
} from '@/types';
import {
  CATEGORIE_GLOBAL_DOC_OPTIONS, STATUT_GLOBAL_DOC_OPTIONS,
  CONF_GLOBAL_DOC_OPTIONS, TYPE_FICHIER_OPTIONS,
  STATUT_GLOBAL_DOC_LABEL, SERVICES_GLOBAL_DOC,
} from '@/mocks/globalDocumentsMocks';
import {
  SlideOver, SlideOverContent, SlideOverHeader, SlideOverTitle,
  SlideOverBody, SlideOverFooter, SlideOverClose,
} from '@/components/ui/overlays/SlideOver';
import { Button }   from '@/components/ui/forms/Button';
import { Input }    from '@/components/ui/forms/Input';
import { Textarea } from '@/components/ui/forms/Textarea';
import { Select }   from '@/components/ui/forms/Select';
import { Badge }    from '@/components/ui/data-display/Badge';
import { DocumentPreview } from './DocumentPreview';

// ─── Types ───────────────────────────────────────────────────────────────────

interface FormState {
  titre:          string;
  description:    string;
  categorie:      CategorieGlobalDoc;
  type:           TypeFichier;
  statut:         StatutGlobalDoc;
  version:        string;
  confidentialite: ConfidentialiteGlobalDoc;
  auteur:         string;
  service:        string;
  mots_cles:      string;
  taille_ko:      string;
  date_expiration: string;
  projectId:      string;
}

export interface DocumentSavePayload {
  titre:           string;
  description:     string;
  categorie:       CategorieGlobalDoc;
  type:            TypeFichier;
  statut:          StatutGlobalDoc;
  version:         string;
  confidentialite: ConfidentialiteGlobalDoc;
  auteur:          string;
  service:         string;
  mots_cles:       string[];
  taille_ko:       number;
  date_creation:   string;
  date_modification: string;
  date_expiration?: string;
  /** Obligatoire à la création uniquement — documents_projet.project_id est
   * NOT NULL, un document ne peut exister sans être rattaché à un projet. */
  projectId?:      string;
}

export interface DocumentSlideOverProps {
  open:          boolean;
  onOpenChange:  (v: boolean) => void;
  mode:          'new' | 'edit' | 'view';
  document?:     DocumentGlobal | null;
  onSave:        (payload: DocumentSavePayload, id?: string) => void;
  onDelete?:     (id: string) => void;
  onDownload?:   (doc: DocumentGlobal) => void;
  onNewVersion?: (doc: DocumentGlobal) => void;
  /** Auteurs réels déjà présents dans les documents existants (dérivés côté
   * page, pas une liste figée). */
  auteurOptions: string[];
  /** Projets disponibles pour le sélecteur — requis en mode création. */
  projectOptions: { id: string; label: string }[];
  /** Nom complet de l'utilisateur connecté — auteur par défaut d'un nouveau document. */
  currentUserName: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch { return iso; }
}

function statutVariant(s: StatutGlobalDoc): 'default' | 'success' | 'warning' | 'secondary' | 'destructive' | 'info' {
  if (s === 'PUBLIE')        return 'success';
  if (s === 'BROUILLON')     return 'secondary';
  if (s === 'EN_VALIDATION') return 'warning';
  if (s === 'ARCHIVE')       return 'info';
  if (s === 'EXPIRE')        return 'destructive';
  return 'default';
}

function buildInit(currentUserName: string): FormState {
  return {
    titre:           '',
    description:     '',
    categorie:       'Administration',
    type:            'PDF',
    statut:          'BROUILLON',
    version:         '1.0',
    confidentialite: 'INTERNE',
    auteur:          currentUserName,
    service:         'Direction Générale',
    mots_cles:       '',
    taille_ko:       '512',
    date_expiration: '',
    projectId:       '',
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export function DocumentSlideOver({
  open, onOpenChange, mode, document: doc, onSave, onDelete, onDownload, onNewVersion, auteurOptions,
  projectOptions, currentUserName,
}: DocumentSlideOverProps) {
  const [form, setForm]               = useState<FormState>(() => buildInit(currentUserName));
  const [errors, setErrors]           = useState<Partial<Record<keyof FormState, string>>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  const readOnly = mode === 'view';

  useEffect(() => {
    if (!open) { setConfirmDelete(false); return; }
    if ((mode === 'edit' || mode === 'view') && doc) {
      setForm({
        titre:           doc.titre,
        description:     doc.description,
        categorie:       doc.categorie,
        type:            doc.type,
        statut:          doc.statut,
        version:         doc.version,
        confidentialite: doc.confidentialite,
        auteur:          doc.auteur,
        service:         doc.service,
        mots_cles:       doc.mots_cles.join(', '),
        taille_ko:       String(doc.taille_ko),
        date_expiration: doc.date_expiration ?? '',
        projectId:       '',
      });
    } else {
      setForm(buildInit(currentUserName));
    }
    setErrors({});
    setConfirmDelete(false);
  }, [open, mode, doc, currentUserName]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.titre.trim()) e.titre = 'Le titre est requis.';
    if (!form.description.trim()) e.description = 'La description est requise.';
    if (!form.version.trim()) e.version = 'La version est requise.';
    // documents_projet.project_id est NOT NULL — un document ne peut être créé
    // sans être rattaché à un projet existant.
    if (mode === 'new' && !form.projectId) e.projectId = 'Le projet de rattachement est requis.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    const today = new Date().toISOString().slice(0, 10);
    onSave(
      {
        titre:            form.titre.trim(),
        description:      form.description.trim(),
        categorie:        form.categorie,
        type:             form.type,
        statut:           form.statut,
        version:          form.version.trim(),
        confidentialite:  form.confidentialite,
        auteur:           form.auteur,
        service:          form.service,
        mots_cles:        form.mots_cles.split(',').map(s => s.trim()).filter(Boolean),
        taille_ko:        parseInt(form.taille_ko, 10) || 512,
        date_creation:    doc?.date_creation ?? today,
        date_modification: today,
        date_expiration:  form.date_expiration.trim() || undefined,
        projectId:        mode === 'new' ? form.projectId : undefined,
      },
      doc?.id,
    );
    onOpenChange(false);
  }

  function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    if (doc?.id) onDelete?.(doc.id);
    onOpenChange(false);
  }

  const title =
    mode === 'new'  ? 'Nouveau document' :
    mode === 'edit' ? 'Modifier le document' :
    'Aperçu du document';

  return (
    <SlideOver open={open} onOpenChange={onOpenChange}>
      <SlideOverContent>

        {/* ── Header ── */}
        <SlideOverHeader>
          <div>
            <SlideOverTitle>{title}</SlideOverTitle>
            {doc && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {doc.code_document} · modifié le {fmtDate(doc.date_modification)}
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

          {/* View: aperçu complet via DocumentPreview */}
          {readOnly && doc ? (
            <div className="space-y-4">
              <DocumentPreview document={doc} />

              {/* Actions en mode view */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                {onDownload && (
                  <Button
                    variant="outline" size="sm"
                    onClick={() => { onDownload(doc); onOpenChange(false); }}
                  >
                    Télécharger
                  </Button>
                )}
                {onNewVersion && doc.statut !== 'ARCHIVE' && (
                  <Button
                    variant="outline" size="sm"
                    onClick={() => { onNewVersion(doc); onOpenChange(false); }}
                  >
                    Nouvelle version
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* ── Section: Identification ── */}
              <div className="space-y-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Identification
                </p>

                <div className="space-y-3">
                  {doc && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-[10px] font-mono">{doc.code_document}</Badge>
                      <Badge variant={statutVariant(doc.statut)} className="text-[10px]">
                        {STATUT_GLOBAL_DOC_LABEL[doc.statut]}
                      </Badge>
                    </div>
                  )}
                  {mode === 'new' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground" htmlFor="gdoc-projet">
                        Projet de rattachement <span className="text-destructive">*</span>
                      </label>
                      <Select
                        id="gdoc-projet"
                        value={form.projectId}
                        onChange={e => set('projectId', e.target.value)}
                        error={!!errors.projectId}
                      >
                        <option value="">Sélectionner un projet…</option>
                        {projectOptions.map(p => (
                          <option key={p.id} value={p.id}>{p.label}</option>
                        ))}
                      </Select>
                      {errors.projectId && <p className="text-xs text-destructive">{errors.projectId}</p>}
                      <p className="text-[11px] text-muted-foreground">
                        Tout document doit être rattaché à un projet — ce document apparaîtra aussi dans
                        l'onglet Documents de ce projet.
                      </p>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground" htmlFor="gdoc-titre">
                      Titre <span className="text-destructive">*</span>
                    </label>
                    <Input
                      id="gdoc-titre"
                      value={form.titre}
                      onChange={e => set('titre', e.target.value)}
                      placeholder="Titre du document"
                      error={!!errors.titre}
                    />
                    {errors.titre && <p className="text-xs text-destructive">{errors.titre}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground" htmlFor="gdoc-desc">
                      Description <span className="text-destructive">*</span>
                    </label>
                    <Textarea
                      id="gdoc-desc"
                      value={form.description}
                      onChange={e => set('description', e.target.value)}
                      placeholder="Description du contenu du document…"
                      rows={3}
                      className="resize-none"
                    />
                    {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground" htmlFor="gdoc-cat">Catégorie</label>
                      <Select
                        id="gdoc-cat"
                        value={form.categorie}
                        onChange={e => set('categorie', e.target.value as CategorieGlobalDoc)}
                      >
                        {CATEGORIE_GLOBAL_DOC_OPTIONS.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground" htmlFor="gdoc-type">Type</label>
                      <Select
                        id="gdoc-type"
                        value={form.type}
                        onChange={e => set('type', e.target.value as TypeFichier)}
                      >
                        {TYPE_FICHIER_OPTIONS.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Section: Versioning & Classification ── */}
              <div className="space-y-4 pt-1 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-3">
                  Versioning & Classification
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground" htmlFor="gdoc-version">
                      Version <span className="text-destructive">*</span>
                    </label>
                    <Input
                      id="gdoc-version"
                      value={form.version}
                      onChange={e => set('version', e.target.value)}
                      placeholder="Ex : 1.0"
                      error={!!errors.version}
                    />
                    {errors.version && <p className="text-xs text-destructive">{errors.version}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground" htmlFor="gdoc-statut">Statut</label>
                    <Select
                      id="gdoc-statut"
                      value={form.statut}
                      onChange={e => set('statut', e.target.value as StatutGlobalDoc)}
                    >
                      {STATUT_GLOBAL_DOC_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground" htmlFor="gdoc-conf">Confidentialité</label>
                  <Select
                    id="gdoc-conf"
                    value={form.confidentialite}
                    onChange={e => set('confidentialite', e.target.value as ConfidentialiteGlobalDoc)}
                  >
                    {CONF_GLOBAL_DOC_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground" htmlFor="gdoc-expiration">
                    Date d'expiration (optionnel)
                  </label>
                  <Input
                    id="gdoc-expiration"
                    type="date"
                    value={form.date_expiration}
                    onChange={e => set('date_expiration', e.target.value)}
                  />
                </div>
              </div>

              {/* ── Section: Auteur & Service ── */}
              <div className="space-y-4 pt-1 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-3">
                  Auteur & Service
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground" htmlFor="gdoc-auteur">Auteur</label>
                    <Select
                      id="gdoc-auteur"
                      value={form.auteur}
                      onChange={e => set('auteur', e.target.value)}
                    >
                      {auteurOptions.map(a => <option key={a} value={a}>{a}</option>)}
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground" htmlFor="gdoc-service">Service</label>
                    <Select
                      id="gdoc-service"
                      value={form.service}
                      onChange={e => set('service', e.target.value)}
                    >
                      {SERVICES_GLOBAL_DOC.map(s => <option key={s} value={s}>{s}</option>)}
                    </Select>
                  </div>
                </div>
              </div>

              {/* ── Section: Options ── */}
              <div className="space-y-4 pt-1 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-3">
                  Options
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground" htmlFor="gdoc-taille">
                      Taille (Ko)
                    </label>
                    <Input
                      id="gdoc-taille"
                      type="number"
                      value={form.taille_ko}
                      onChange={e => set('taille_ko', e.target.value)}
                      placeholder="512"
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground" htmlFor="gdoc-mots">
                      Mots-clés (séparés par virgule)
                    </label>
                    <Input
                      id="gdoc-mots"
                      value={form.mots_cles}
                      onChange={e => set('mots_cles', e.target.value)}
                      placeholder="Ex : budget, rapport, 2026"
                    />
                  </div>
                </div>
              </div>

              {/* ── Supprimer (edit) ── */}
              {mode === 'edit' && doc && onDelete && (
                <div className="pt-2 border-t border-border">
                  {confirmDelete ? (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2">
                      <p className="text-xs text-destructive font-medium">
                        Confirmer la suppression de « {doc.titre} » ?
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
                      Supprimer ce document
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </SlideOverBody>

        {/* ── Footer ── */}
        <SlideOverFooter>
          <SlideOverClose asChild>
            <Button variant="outline">Fermer</Button>
          </SlideOverClose>
          {!readOnly && (
            <Button onClick={handleSave}>
              {mode === 'new' ? 'Créer le document' : 'Enregistrer'}
            </Button>
          )}
        </SlideOverFooter>
      </SlideOverContent>
    </SlideOver>
  );
}
