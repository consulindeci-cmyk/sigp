import { useEffect, useRef, useState } from 'react';
import { Upload, Download, Paperclip, Reply, AlertCircle } from 'lucide-react';
import type { CommentaireProjet, ModuleCommentaire, StatutCommentaire, PrioriteCommentaire } from '@/types';
import {
  MODULE_OPTIONS, STATUT_OPTIONS, PRIORITE_OPTIONS, STATUT_COMMENTAIRE_LABEL,
  PRIORITE_COMMENTAIRE_LABEL,
} from '@/mocks/commentsMocks';
import {
  Modal, ModalContent, ModalHeader, ModalTitle, ModalClose,
} from '@/components/ui/overlays/Modal';
import { Button }   from '@/components/ui/forms/Button';
import { Input }    from '@/components/ui/forms/Input';
import { Textarea } from '@/components/ui/forms/Textarea';
import { Select }   from '@/components/ui/forms/Select';
import { Badge }    from '@/components/ui/data-display/Badge';
import { useOrganisationMembersForPicker } from '@/hooks/useGovernance';
import { useDownloadDocumentVersion } from '@/hooks/useDocuments';

// ─── Types ───────────────────────────────────────────────────────────────────

interface FormState {
  module:       ModuleCommentaire;
  element_id:   string;
  element_nom:  string;
  message:      string;
  statut:       StatutCommentaire;
  priorite:     PrioriteCommentaire;
  parent_id:    string;
  mention_user_id: string;
}

// L'auteur (auteur_id) est résolu côté serveur depuis la session — plus de
// champ auteur/role saisi à la main comme dans l'ancien mock. pieceJointe et
// mention sont désormais de vraies références (document réellement stocké /
// utilisateur réel) — cf. audit Commentaires.
export interface CommentSavePayload {
  module:            ModuleCommentaire;
  element_id:         string;
  element_nom:        string;
  message:            string;
  statut:             StatutCommentaire;
  priorite:           PrioriteCommentaire;
  parent_id:          string | null;
  mention_user_id:    string | null;
  /** true si l'utilisateur a explicitement retiré la pièce jointe existante (édition). */
  removeAttachment?:  boolean;
}

export interface CommentSlideOverProps {
  open:          boolean;
  onOpenChange:  (v: boolean) => void;
  mode:          'new' | 'edit' | 'view';
  commentaire?:  CommentaireProjet | null;
  parentRef?:    CommentaireProjet | null;
  replies?:      CommentaireProjet[];
  defaultParentId?: string;
  projectId:     string;
  /** Le commentaire appartient-il à l'utilisateur connecté (ou est-il ADMIN/SUPER_ADMIN) ? Contrôle l'affichage des actions modifier/supprimer. */
  canManage?:    boolean;
  /** Miroir de requireRole(documents-create) : seuls ces rôles peuvent réellement stocker un fichier. */
  canAttachFile?: boolean;
  isSaving?:     boolean;
  error?:        string | null;
  onSave:        (payload: CommentSavePayload, id: string | undefined, file: File | null) => void;
  onDelete?:     (id: string) => void;
  onReply?:      (parent: CommentaireProjet) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statutVariant(s: StatutCommentaire): 'default' | 'success' | 'warning' | 'secondary' | 'destructive' | 'info' {
  if (s === 'OUVERT')     return 'warning';
  if (s === 'EN_COURS')   return 'info';
  if (s === 'RESOLU')     return 'success';
  if (s === 'FERME')      return 'secondary';
  return 'default';
}

function prioriteVariant(p: PrioriteCommentaire): 'default' | 'success' | 'warning' | 'destructive' | 'secondary' {
  if (p === 'URGENTE') return 'destructive';
  if (p === 'HAUTE')   return 'warning';
  if (p === 'NORMALE') return 'default';
  return 'secondary';
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch { return iso; }
}

const INIT: FormState = {
  module:       'Projet',
  element_id:   '',
  element_nom:  '',
  message:      '',
  statut:       'OUVERT',
  priorite:     'NORMALE',
  parent_id:    '',
  mention_user_id: '',
};

// ─── Row helper (view) ────────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-2 items-start text-sm py-2 border-b border-border last:border-b-0">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide pt-0.5">{label}</span>
      <span className="text-sm text-foreground font-medium leading-relaxed">{value}</span>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CommentSlideOver({
  open, onOpenChange, mode, commentaire, parentRef, replies = [],
  defaultParentId, projectId, canManage = true, canAttachFile = false,
  isSaving = false, error = null, onSave, onDelete, onReply,
}: CommentSlideOverProps) {
  const [form, setForm]               = useState<FormState>(INIT);
  const [errors, setErrors]           = useState<Partial<Record<keyof FormState, string>>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [removeAttachment, setRemoveAttachment] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: members = [] } = useOrganisationMembersForPicker(projectId);
  const downloadMutation = useDownloadDocumentVersion();
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const readOnly = mode === 'view';

  useEffect(() => {
    if (!open) { setConfirmDelete(false); return; }
    if ((mode === 'edit' || mode === 'view') && commentaire) {
      setForm({
        module:       commentaire.module,
        element_id:   commentaire.element_id,
        element_nom:  commentaire.element_nom,
        message:      commentaire.message,
        statut:       commentaire.statut,
        priorite:     commentaire.priorite,
        parent_id:    commentaire.parent_id ?? '',
        mention_user_id: commentaire.mentionUserId ?? '',
      });
    } else {
      setForm({ ...INIT, parent_id: defaultParentId ?? '' });
    }
    setErrors({});
    setConfirmDelete(false);
    setSelectedFile(null);
    setRemoveAttachment(false);
    setDownloadError(null);
  }, [open, mode, commentaire, defaultParentId]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setRemoveAttachment(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  function handleDownload() {
    if (!commentaire?.pieceJointeDocumentId) return;
    setDownloadError(null);
    downloadMutation.mutate(commentaire.pieceJointeDocumentId, {
      onSuccess: (data) => window.open(data.url, '_blank', 'noopener,noreferrer'),
      onError: (err) => setDownloadError(err instanceof Error ? err.message : 'Échec du téléchargement.'),
    });
  }

  function validate(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.message.trim()) e.message = 'Le message est requis.';
    if (!form.element_id.trim()) e.element_id = "L'élément référencé est requis.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // Le SlideOver ne se ferme plus lui-même : le parent possède la mutation
  // (fiche + éventuelle pièce jointe séquencée derrière, cf. TabComments.tsx)
  // et ne ferme qu'après confirmation serveur (cf. audit — fermeture aveugle
  // qui masquait tout échec 403/réseau, notamment pour les non-auteurs).
  function handleSave() {
    if (!validate()) return;
    onSave(
      {
        module:            form.module,
        element_id:        form.element_id.trim(),
        element_nom:       form.element_nom.trim() || form.element_id.trim(),
        message:           form.message.trim(),
        statut:            form.statut,
        priorite:          form.priorite,
        parent_id:         form.parent_id.trim() || null,
        mention_user_id:   form.mention_user_id.trim() || null,
        removeAttachment,
      },
      commentaire?.id,
      selectedFile,
    );
  }

  function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    if (commentaire?.id) onDelete?.(commentaire.id);
  }

  const title =
    mode === 'new'  ? 'Nouveau commentaire' :
    mode === 'edit' ? 'Modifier le commentaire' :
    'Détail du commentaire';

  const initials = commentaire
    ? commentaire.auteur.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
    : '';

  const attachmentLabel = selectedFile
    ? selectedFile.name
    : (commentaire?.pieceJointeDocumentId && !removeAttachment ? 'Pièce jointe déjà attachée' : null);

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        {/* ── Header ── */}
        <ModalHeader className="px-6 py-4 border-b border-border shrink-0 space-y-1">
          <ModalTitle>{title}</ModalTitle>
          {commentaire && (
            <p className="text-xs text-muted-foreground">{fmtDate(commentaire.date_creation)}</p>
          )}
        </ModalHeader>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">

          {/* Résumé visuel (view/edit) */}
          {commentaire && (
            <div className="rounded-lg border border-border bg-muted/30 p-4 flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <Badge variant={prioriteVariant(commentaire.priorite)} className="text-[10px]">
                    {PRIORITE_COMMENTAIRE_LABEL[commentaire.priorite]}
                  </Badge>
                  <Badge variant={statutVariant(commentaire.statut)} className="text-[10px]">
                    {STATUT_COMMENTAIRE_LABEL[commentaire.statut]}
                  </Badge>
                  {commentaire.lu === false && (
                    <Badge variant="info" className="text-[10px]">Non lu</Badge>
                  )}
                </div>
                <p className="text-[13px] font-semibold text-foreground leading-snug">
                  {commentaire.element_nom}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  <span className="font-medium">{commentaire.module}</span>
                  {commentaire.parent_id && (
                    <span> · ↩ réponse</span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Bouton Répondre (view) */}
          {readOnly && commentaire && onReply && !commentaire.parent_id && (
            <Button
              variant="outline" size="sm"
              onClick={() => onReply(commentaire)}
            >
              <Reply className="h-3.5 w-3.5 mr-1.5" />
              Répondre
            </Button>
          )}

          {/* Référence parent (view, si réponse) */}
          {readOnly && parentRef && (
            <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                Commentaire parent
              </p>
              <p className="text-[12px] text-foreground line-clamp-3">{parentRef.message}</p>
              <p className="text-[11px] text-muted-foreground">
                — {parentRef.auteur} · {fmtDate(parentRef.date_creation)}
              </p>
            </div>
          )}

          {/* Section: Contexte */}
          <div className="space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Contexte
            </p>

            {readOnly ? (
              <div className="rounded-lg border border-border bg-card p-3 divide-y divide-border">
                <Row label="Module"  value={<Badge variant="outline" className="text-[10px]">{commentaire?.module}</Badge>} />
                <Row label="Élément" value={commentaire?.element_nom} />
                {commentaire?.pieceJointeDocumentId && (
                  <Row label="Pièce jointe" value={
                    <Button variant="outline" size="sm" onClick={handleDownload} disabled={downloadMutation.isPending}>
                      <Download className="h-3.5 w-3.5 mr-1.5" />
                      {downloadMutation.isPending ? 'Préparation…' : 'Télécharger'}
                    </Button>
                  } />
                )}
                {commentaire?.mentionUserName && (
                  <Row label="Mention" value={
                    <span className="text-[12px] font-medium text-primary">{commentaire.mentionUserName}</span>
                  } />
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground" htmlFor="cmt-module">Module</label>
                  <Select
                    id="cmt-module"
                    value={form.module}
                    onChange={e => set('module', e.target.value as ModuleCommentaire)}
                    disabled={readOnly}
                  >
                    {MODULE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground" htmlFor="cmt-element-nom">
                    Élément référencé <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="cmt-element-nom"
                    value={form.element_nom}
                    onChange={e => set('element_nom', e.target.value)}
                    placeholder="Ex : Ligne budgétaire n°3"
                  />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-medium text-foreground" htmlFor="cmt-element-id">
                    Code / identifiant de l'élément <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="cmt-element-id"
                    value={form.element_id}
                    onChange={e => set('element_id', e.target.value)}
                    placeholder="Ex : RSQ-003, BL-012…"
                    error={!!errors.element_id}
                  />
                  {errors.element_id && <p className="text-xs text-destructive">{errors.element_id}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Section: Message */}
          <div className="space-y-4 pt-1 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-3">
              Message
            </p>

            {readOnly ? (
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {commentaire?.message}
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground" htmlFor="cmt-message">
                  Message <span className="text-destructive">*</span>
                </label>
                <Textarea
                  id="cmt-message"
                  value={form.message}
                  onChange={e => set('message', e.target.value)}
                  placeholder="Saisir votre commentaire, observation ou question…"
                  rows={5}
                  disabled={readOnly}
                  className="resize-none"
                />
                {errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
              </div>
            )}
          </div>

          {/* Section: Classification */}
          {!readOnly && (
            <div className="space-y-4 pt-1 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-3">
                Classification
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground" htmlFor="cmt-statut">Statut</label>
                  <Select
                    id="cmt-statut"
                    value={form.statut}
                    onChange={e => set('statut', e.target.value as StatutCommentaire)}
                  >
                    {STATUT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground" htmlFor="cmt-priorite">Priorité</label>
                  <Select
                    id="cmt-priorite"
                    value={form.priorite}
                    onChange={e => set('priorite', e.target.value as PrioriteCommentaire)}
                  >
                    {PRIORITE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Section: Auteur (view uniquement — résolu depuis la session) */}
          {readOnly && commentaire && (
            <div className="space-y-1 pt-1 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-3 mb-3">
                Auteur
              </p>
              <div className="rounded-lg border border-border bg-card p-3 divide-y divide-border">
                <Row label="Utilisateur" value={
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-bold shrink-0">
                      {initials}
                    </div>
                    {commentaire.auteur}
                  </div>
                } />
                <Row label="Rôle" value={commentaire.role} />
                <Row label="Statut" value={
                  <Badge variant={statutVariant(commentaire.statut)} className="text-[10px]">
                    {STATUT_COMMENTAIRE_LABEL[commentaire.statut]}
                  </Badge>
                } />
                <Row label="Priorité" value={
                  <Badge variant={prioriteVariant(commentaire.priorite)} className="text-[10px]">
                    {PRIORITE_COMMENTAIRE_LABEL[commentaire.priorite]}
                  </Badge>
                } />
              </div>
            </div>
          )}

          {downloadError && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive" role="alert">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{downloadError}</span>
            </div>
          )}

          {/* Section: Options (new/edit) */}
          {!readOnly && (
            <div className="space-y-4 pt-1 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-3">
                Options
              </p>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground" htmlFor="cmt-mention">Mentionner un utilisateur</label>
                  <Select
                    id="cmt-mention"
                    value={form.mention_user_id}
                    onChange={e => set('mention_user_id', e.target.value)}
                  >
                    <option value="">Aucune mention</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.displayName}</option>
                    ))}
                  </Select>
                </div>
                {canAttachFile ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Pièce jointe</label>
                    <div className="rounded-lg border-2 border-dashed border-border bg-muted/10 p-3 flex items-center gap-3">
                      <Button variant="outline" size="sm" type="button" onClick={() => fileRef.current?.click()}>
                        <Upload className="h-3.5 w-3.5 mr-1.5" />
                        Sélectionner un fichier
                      </Button>
                      {attachmentLabel ? (
                        <p className="text-xs text-foreground truncate flex items-center gap-1">
                          <Paperclip className="h-3 w-3 shrink-0" />{attachmentLabel}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Aucun fichier attaché</p>
                      )}
                      <input ref={fileRef} type="file" className="sr-only" aria-hidden="true" tabIndex={-1} onChange={handleFileSelect} />
                    </div>
                    {mode === 'edit' && commentaire?.pieceJointeDocumentId && !selectedFile && (
                      <Button
                        variant="ghost" size="sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setRemoveAttachment(prev => !prev)}
                      >
                        {removeAttachment ? 'Annuler le retrait' : 'Retirer la pièce jointe'}
                      </Button>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    Votre rôle ne permet pas d'attacher de fichier à un commentaire.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Réponses (view) */}
          {readOnly && replies.length > 0 && (
            <div className="space-y-3 pt-1 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-3">
                Réponses ({replies.length})
              </p>
              <div className="space-y-2">
                {replies.map(r => {
                  const ri = r.auteur.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
                  return (
                    <div key={r.id} className="ml-4 rounded-lg border border-border bg-muted/20 p-3 flex items-start gap-3">
                      <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                        {ri}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-[12px] font-semibold text-foreground">{r.auteur}</span>
                          <span className="text-[10px] text-muted-foreground">{r.role}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">{fmtDate(r.date_creation)}</span>
                        </div>
                        <p className="text-[12px] text-foreground leading-relaxed">{r.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Supprimer (edit) */}
          {mode === 'edit' && commentaire && onDelete && canManage && (
            <div className="pt-2 border-t border-border">
              {confirmDelete ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2">
                  <p className="text-xs text-destructive font-medium">
                    Confirmer la suppression de ce commentaire ?
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
                  Supprimer ce commentaire
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
            <Button variant="outline">Fermer</Button>
          </ModalClose>
          {!readOnly && canManage && (
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Enregistrement…' : mode === 'new' ? 'Ajouter le commentaire' : 'Enregistrer'}
            </Button>
          )}
        </div>
      </ModalContent>
    </Modal>
  );
}
