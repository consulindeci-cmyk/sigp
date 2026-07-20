import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Upload, Download, Paperclip, Trash2 } from 'lucide-react';
import type { Livrable, LivrableCategorie, StatutLivrable, PrioriteLivrable } from '@/types';
import {
  LIVRABLE_CATEGORIES, STATUT_LIVRABLE_OPTIONS, PRIORITE_LIVRABLE_OPTIONS,
} from '@/mocks/deliverablesMocks';
import {
  Modal, ModalContent, ModalHeader, ModalTitle, ModalClose,
} from '@/components/ui/overlays/Modal';
import { Button }   from '@/components/ui/forms/Button';
import { Input }    from '@/components/ui/forms/Input';
import { Textarea } from '@/components/ui/forms/Textarea';
import { Select }   from '@/components/ui/forms/Select';
import { Badge }    from '@/components/ui/data-display/Badge';
import { ProgressBar } from '@/components/ui/data-display/ProgressBar';
import { useOrganisationMembersForPicker } from '@/hooks/useGovernance';
import { useWBS } from '@/hooks/useWBS';
import {
  useLivrableAttachments, useUploadLivrableAttachment, useDeleteLivrableAttachment,
  useDownloadDocumentVersion,
} from '@/hooks/useDocuments';

// ─── Types ───────────────────────────────────────────────────────────────────

interface FormState {
  code_livrable:    string;
  nom:              string;
  description:      string;
  categorie:        LivrableCategorie;
  composante:       string;
  responsableId:    string;
  validateurId:     string;
  wbsId:            string;
  date_prevue:      string;
  date_soumission:  string;
  date_validation:  string;
  avancement:       number;
  statut:           StatutLivrable;
  priorite:         PrioriteLivrable;
}

export interface LivrableSavePayload {
  code_livrable:    string;
  nom:              string;
  description?:     string;
  categorie:        LivrableCategorie;
  composante?:      string;
  responsable:      string;
  responsableId:    string;
  validateur:       string;
  validateurId:     string;
  wbsId:            string;
  date_prevue:      string;
  date_soumission?: string;
  date_validation?: string;
  avancement:       number;
  statut:           StatutLivrable;
  priorite:         PrioriteLivrable;
}

export interface LivrableSlideOverProps {
  open:         boolean;
  onOpenChange: (v: boolean) => void;
  mode:         'new' | 'edit' | 'view';
  projectId:    string;
  livrable?:    Livrable | null;
  nextCode?:    string;
  onSave:       (payload: LivrableSavePayload, id?: string) => void;
  onDelete?:    (id: string) => void;
  canManage?:   boolean;
  canDelete?:   boolean;
  isSaving?:    boolean;
  isDeleting?:  boolean;
  error?:       string | null;
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

function fmtDateTime(iso: string): string {
  try { return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
  catch { return '—'; }
}

const INIT: FormState = {
  code_livrable:   '',
  nom:             '',
  description:     '',
  categorie:       'Rapport',
  composante:      '',
  responsableId:   '',
  validateurId:    '',
  wbsId:           '',
  date_prevue:     new Date().toISOString().slice(0, 10),
  date_soumission: '',
  date_validation: '',
  avancement:      0,
  statut:          'A_FAIRE',
  priorite:        'MOYENNE',
};

// ─── Sous-composant : Pièces jointes / Preuves matérielles ────────────────────
// Uniquement disponible en mode edit/view (un livrable doit exister en base
// avant qu'un document ne puisse lui être rattaché via livrable_id).

function AttachmentsSection({
  projectId, livrableId, canManage,
}: { projectId: string; livrableId: string; canManage: boolean }) {
  const { data: attachments = [], isLoading } = useLivrableAttachments(projectId, livrableId);
  const uploadMutation = useUploadLivrableAttachment(projectId, livrableId);
  const deleteMutation = useDeleteLivrableAttachment(projectId, livrableId);
  const downloadMutation = useDownloadDocumentVersion();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    uploadMutation.mutate(file, {
      onError: (err) => setUploadError(err instanceof Error ? err.message : 'Échec du téléversement.'),
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleDownload(documentId: string) {
    setDownloadError(null);
    downloadMutation.mutate(documentId, {
      onSuccess: (data) => window.open(data.url, '_blank', 'noopener,noreferrer'),
      onError: (err) => setDownloadError(err instanceof Error ? err.message : 'Échec du téléchargement.'),
    });
  }

  return (
    <div className="space-y-3 pt-1 border-t border-border">
      <div className="flex items-center justify-between pt-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Pièces jointes / Preuves matérielles
        </p>
        {canManage && (
          <>
            <input ref={fileInputRef} type="file" className="sr-only" aria-hidden="true" tabIndex={-1} onChange={handleFileChange} />
            <Button
              variant="outline" size="sm" className="h-7 text-xs"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
            >
              <Upload className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
              {uploadMutation.isPending ? 'Envoi...' : 'Téléverser'}
            </Button>
          </>
        )}
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Chargement...</p>
      ) : attachments.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">Aucune pièce jointe pour ce livrable.</p>
      ) : (
        <ul className="space-y-1.5">
          {attachments.map(a => (
            <li key={a.id} className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/20 px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <Paperclip className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                <span className="text-xs text-foreground truncate" title={a.titre}>{a.titre}</span>
                <span className="text-[10px] text-muted-foreground shrink-0">{fmtDateTime(a.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost" size="icon" className="h-6 w-6" aria-label="Télécharger"
                  onClick={() => handleDownload(a.id)}
                  disabled={downloadMutation.isPending}
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
                {canManage && (
                  <Button
                    variant="ghost" size="icon" className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Supprimer la pièce jointe"
                    onClick={() => deleteMutation.mutate(a.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
      {downloadError && <p className="text-xs text-destructive">{downloadError}</p>}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function LivrableSlideOver({
  open, onOpenChange, mode, projectId, livrable, nextCode = 'LIV-001', onSave, onDelete,
  canManage = true, canDelete = true, isSaving = false, isDeleting = false, error = null,
}: LivrableSlideOverProps) {
  const [form, setForm] = useState<FormState>(INIT);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  const readOnly = mode === 'view';

  const { data: orgMembers = [], isLoading: isLoadingMembers } = useOrganisationMembersForPicker(projectId);
  const responsableOptions = useMemo(() => {
    if (livrable?.responsableId && !orgMembers.some(m => m.id === livrable.responsableId)) {
      return [...orgMembers, { id: livrable.responsableId, displayName: livrable.responsable || 'Utilisateur inconnu' }];
    }
    return orgMembers;
  }, [orgMembers, livrable]);
  const validateurOptions = useMemo(() => {
    if (livrable?.validateurId && !orgMembers.some(m => m.id === livrable.validateurId)) {
      return [...orgMembers, { id: livrable.validateurId, displayName: livrable.validateur || 'Utilisateur inconnu' }];
    }
    return orgMembers;
  }, [orgMembers, livrable]);

  // Nœuds WBS terminaux réels du projet — livrables.wbs_id référence un vrai
  // nœud existant (cf. audit : champ jusqu'ici jamais exposé dans ce formulaire).
  const { data: wbsData } = useWBS(projectId);
  const terminalWbsNodes = useMemo(() => {
    const all = wbsData?.data ?? [];
    return all.filter(n => !all.some(other => other.parent_id === n.id));
  }, [wbsData]);

  useEffect(() => {
    if (!open) { setConfirmDelete(false); return; }
    if ((mode === 'edit' || mode === 'view') && livrable) {
      setForm({
        code_livrable:   livrable.code_livrable,
        nom:             livrable.nom,
        description:     livrable.description ?? '',
        categorie:       livrable.categorie,
        composante:      livrable.composante ?? '',
        responsableId:   livrable.responsableId ?? '',
        validateurId:    livrable.validateurId ?? '',
        wbsId:           livrable.wbsId ?? '',
        date_prevue:     livrable.date_prevue,
        date_soumission: livrable.date_soumission ?? '',
        date_validation: livrable.date_validation ?? '',
        avancement:      livrable.avancement,
        statut:          livrable.statut,
        priorite:        livrable.priorite,
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
    if (!form.responsableId)        e.responsableId = 'Le responsable est requis.';
    if (!form.date_prevue)          e.date_prevue   = 'La date est requise.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // Le SlideOver ne se ferme plus lui-même : le parent possède la mutation et
  // ne ferme qu'après confirmation serveur (cf. audit — fermeture aveugle
  // avant réponse du serveur, qui masquait tout échec 403/réseau).
  function handleSave() {
    if (!validate()) return;
    const selectedMember   = responsableOptions.find(m => m.id === form.responsableId);
    const selectedValidateur = validateurOptions.find(m => m.id === form.validateurId);
    onSave(
      {
        code_livrable:   form.code_livrable.trim(),
        nom:             form.nom.trim(),
        description:     form.description.trim() || undefined,
        categorie:       form.categorie,
        composante:      form.composante.trim() || undefined,
        responsable:     selectedMember?.displayName ?? '',
        responsableId:   form.responsableId,
        validateur:      selectedValidateur?.displayName ?? '',
        validateurId:    form.validateurId,
        wbsId:           form.wbsId,
        date_prevue:     form.date_prevue,
        date_soumission: form.date_soumission || undefined,
        date_validation: form.date_validation || undefined,
        avancement:      form.avancement,
        statut:          form.statut,
        priorite:        form.priorite,
      },
      livrable?.id,
    );
  }

  function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    if (livrable?.id) onDelete?.(livrable.id);
  }

  const title =
    mode === 'new'  ? 'Nouveau livrable' :
    mode === 'edit' ? 'Modifier le livrable' :
    'Détail du livrable';

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        {/* ── Header ── */}
        <ModalHeader className="px-6 py-4 border-b border-border shrink-0 space-y-1">
          <ModalTitle>{title}</ModalTitle>
          {livrable && (
            <p className="text-xs text-muted-foreground">{livrable.code_livrable}</p>
          )}
        </ModalHeader>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">

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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground" htmlFor="liv-comp">Composante</label>
                <Input id="liv-comp" value={form.composante}
                  onChange={e => set('composante', e.target.value)}
                  placeholder="Ex: Composante A — Infrastructures" disabled={readOnly} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground" htmlFor="liv-wbs">Composante WBS</label>
                <Select id="liv-wbs" value={form.wbsId}
                  onChange={e => set('wbsId', e.target.value)}
                  disabled={readOnly}>
                  <option value="">Aucune</option>
                  {terminalWbsNodes.map(n => (
                    <option key={n.id} value={n.id}>{n.code_wbs} — {n.titre}</option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          {/* Section: Planification */}
          <div className="space-y-4 pt-1 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-3">
              Planification & Réalisation
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground" htmlFor="liv-prevue">
                Date prévue <span className="text-destructive">*</span>
              </label>
              <Input id="liv-prevue" type="date" value={form.date_prevue}
                onChange={e => set('date_prevue', e.target.value)}
                disabled={readOnly} error={!!errors.date_prevue} />
              {errors.date_prevue && <p className="text-xs text-destructive">{errors.date_prevue}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground" htmlFor="liv-soumission">Date de soumission</label>
                <Input id="liv-soumission" type="date" value={form.date_soumission}
                  onChange={e => set('date_soumission', e.target.value)}
                  disabled={readOnly} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground" htmlFor="liv-validation">Date de validation</label>
                <Input id="liv-validation" type="date" value={form.date_validation}
                  onChange={e => set('date_validation', e.target.value)}
                  disabled={readOnly} />
              </div>
            </div>
          </div>

          {/* Section: Responsable + Classification */}
          <div className="space-y-4 pt-1 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-3">
              Responsable & Classification
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground" htmlFor="liv-resp">
                  Responsable <span className="text-destructive">*</span>
                </label>
                <Select
                  id="liv-resp"
                  value={form.responsableId}
                  onChange={e => set('responsableId', e.target.value)}
                  disabled={readOnly || isLoadingMembers}
                  error={!!errors.responsableId}
                >
                  <option value="">{isLoadingMembers ? 'Chargement…' : 'Sélectionner une personne'}</option>
                  {responsableOptions.map(m => (
                    <option key={m.id} value={m.id}>{m.displayName}</option>
                  ))}
                </Select>
                {errors.responsableId && <p className="text-xs text-destructive">{errors.responsableId}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground" htmlFor="liv-validateur">Validateur</label>
                <Select
                  id="liv-validateur"
                  value={form.validateurId}
                  onChange={e => set('validateurId', e.target.value)}
                  disabled={readOnly || isLoadingMembers}
                >
                  <option value="">Non désigné</option>
                  {validateurOptions.map(m => (
                    <option key={m.id} value={m.id}>{m.displayName}</option>
                  ))}
                </Select>
              </div>
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

          {/* Section: Pièces jointes — uniquement si le livrable existe déjà */}
          {livrable ? (
            <AttachmentsSection projectId={projectId} livrableId={livrable.id} canManage={canManage} />
          ) : (
            <div className="pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground italic">
                Enregistrez d'abord le livrable pour pouvoir y attacher des pièces jointes.
              </p>
            </div>
          )}

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
                <span className="text-foreground font-medium">{livrable.responsable || '—'}</span>
                <span className="text-muted-foreground">Validateur</span>
                <span className="text-foreground font-medium">{livrable.validateur || '—'}</span>
              </div>
            </div>
          )}

          {/* Bouton Supprimer (mode edit) */}
          {mode === 'edit' && livrable && onDelete && canDelete && (
            <div className="pt-2 border-t border-border">
              {confirmDelete ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2">
                  <p className="text-xs text-destructive font-medium">
                    Confirmer la suppression de {livrable.code_livrable} ?
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
                  Supprimer ce livrable
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
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border shrink-0">
          <ModalClose asChild>
            <Button variant="outline">{readOnly ? 'Fermer' : 'Annuler'}</Button>
          </ModalClose>
          {!readOnly && (
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Enregistrement...' : mode === 'new' ? 'Créer le livrable' : 'Enregistrer'}
            </Button>
          )}
        </div>
      </ModalContent>
    </Modal>
  );
}
