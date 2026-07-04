import { useEffect, useState } from 'react';
import { X, Paperclip, Reply } from 'lucide-react';
import type { CommentaireProjet, ModuleCommentaire, StatutCommentaire, PrioriteCommentaire } from '@/types';
import {
  MODULE_OPTIONS, STATUT_OPTIONS, PRIORITE_OPTIONS, STATUT_COMMENTAIRE_LABEL,
  PRIORITE_COMMENTAIRE_LABEL, ELEMENTS_PAR_MODULE, UTILISATEURS_MENTION,
} from '@/mocks/commentsMocks';
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
  module:       ModuleCommentaire;
  element_id:   string;
  element_nom:  string;
  auteur:       string;
  role:         string;
  message:      string;
  statut:       StatutCommentaire;
  priorite:     PrioriteCommentaire;
  parent_id:    string;
  piece_jointe: string;
  mention:      string;
}

export interface CommentSavePayload {
  module:         ModuleCommentaire;
  element_id:     string;
  element_nom:    string;
  auteur:         string;
  role:           string;
  message:        string;
  statut:         StatutCommentaire;
  priorite:       PrioriteCommentaire;
  parent_id:      string | null;
  piece_jointe:   string | null;
  mention:        string | null;
  date_creation:  string;
  date_modification: string;
  lu:             boolean;
}

export interface CommentSlideOverProps {
  open:          boolean;
  onOpenChange:  (v: boolean) => void;
  mode:          'new' | 'edit' | 'view';
  commentaire?:  CommentaireProjet | null;
  parentRef?:    CommentaireProjet | null;
  replies?:      CommentaireProjet[];
  defaultParentId?: string;
  onSave:        (payload: CommentSavePayload, id?: string) => void;
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
  element_id:   'PRJ-001',
  element_nom:  'Informations générales',
  auteur:       'Amadou Diallo',
  role:         'Coordonnateur de Projet',
  message:      '',
  statut:       'OUVERT',
  priorite:     'NORMALE',
  parent_id:    '',
  piece_jointe: '',
  mention:      '',
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
  defaultParentId, onSave, onDelete, onReply,
}: CommentSlideOverProps) {
  const [form, setForm]               = useState<FormState>(INIT);
  const [errors, setErrors]           = useState<Partial<Record<keyof FormState, string>>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  const readOnly = mode === 'view';

  useEffect(() => {
    if (!open) { setConfirmDelete(false); return; }
    if ((mode === 'edit' || mode === 'view') && commentaire) {
      setForm({
        module:       commentaire.module,
        element_id:   commentaire.element_id,
        element_nom:  commentaire.element_nom,
        auteur:       commentaire.auteur,
        role:         commentaire.role,
        message:      commentaire.message,
        statut:       commentaire.statut,
        priorite:     commentaire.priorite,
        parent_id:    commentaire.parent_id ?? '',
        piece_jointe: commentaire.piece_jointe ?? '',
        mention:      commentaire.mention ?? '',
      });
    } else {
      setForm({ ...INIT, parent_id: defaultParentId ?? '' });
    }
    setErrors({});
    setConfirmDelete(false);
  }, [open, mode, commentaire, defaultParentId]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
  }

  function handleModuleChange(module: ModuleCommentaire) {
    const elements = ELEMENTS_PAR_MODULE[module];
    setForm(prev => ({
      ...prev,
      module,
      element_id:  elements[0]?.id  ?? '',
      element_nom: elements[0]?.nom ?? '',
    }));
    if (errors.module) setErrors(prev => ({ ...prev, module: undefined }));
  }

  function handleElementChange(eid: string) {
    const elements = ELEMENTS_PAR_MODULE[form.module];
    const found    = elements.find(e => e.id === eid);
    setForm(prev => ({ ...prev, element_id: eid, element_nom: found?.nom ?? eid }));
  }

  function validate(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.message.trim()) e.message = 'Le message est requis.';
    if (!form.auteur.trim())  e.auteur  = "L'auteur est requis.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    const today = new Date().toISOString().slice(0, 10);
    onSave(
      {
        module:           form.module,
        element_id:       form.element_id,
        element_nom:      form.element_nom,
        auteur:           form.auteur.trim(),
        role:             form.role.trim(),
        message:          form.message.trim(),
        statut:           form.statut,
        priorite:         form.priorite,
        parent_id:        form.parent_id.trim() || null,
        piece_jointe:     form.piece_jointe.trim() || null,
        mention:          form.mention.trim() || null,
        date_creation:    commentaire?.date_creation ?? today,
        date_modification: today,
        lu:               true,
      },
      commentaire?.id,
    );
    onOpenChange(false);
  }

  function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    if (commentaire?.id) onDelete?.(commentaire.id);
    onOpenChange(false);
  }

  const title =
    mode === 'new'  ? 'Nouveau commentaire' :
    mode === 'edit' ? 'Modifier le commentaire' :
    'Détail du commentaire';

  const elementOptions = ELEMENTS_PAR_MODULE[form.module] ?? [];
  const initials = commentaire
    ? commentaire.auteur.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
    : '';

  return (
    <SlideOver open={open} onOpenChange={onOpenChange}>
      <SlideOverContent>
        {/* ── Header ── */}
        <SlideOverHeader>
          <div>
            <SlideOverTitle>{title}</SlideOverTitle>
            {commentaire && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {commentaire.id} · {fmtDate(commentaire.date_creation)}
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
                    <span> · ↩ Réponse à {commentaire.parent_id}</span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Bouton Répondre (view) */}
          {readOnly && commentaire && onReply && !commentaire.parent_id && (
            <Button
              variant="outline" size="sm"
              onClick={() => { onReply(commentaire); onOpenChange(false); }}
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
                {commentaire?.piece_jointe && (
                  <Row label="Pièce jointe" value={
                    <span className="flex items-center gap-1 text-[12px] text-info">
                      <Paperclip className="h-3 w-3 shrink-0" />{commentaire.piece_jointe}
                    </span>
                  } />
                )}
                {commentaire?.mention && (
                  <Row label="Mention" value={
                    <span className="text-[12px] font-medium text-primary">{commentaire.mention}</span>
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
                    onChange={e => handleModuleChange(e.target.value as ModuleCommentaire)}
                    disabled={readOnly}
                  >
                    {MODULE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground" htmlFor="cmt-element">Élément</label>
                  <Select
                    id="cmt-element"
                    value={form.element_id}
                    onChange={e => handleElementChange(e.target.value)}
                    disabled={readOnly}
                  >
                    {elementOptions.map(e => <option key={e.id} value={e.id}>{e.nom}</option>)}
                  </Select>
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

          {/* Section: Auteur */}
          {!readOnly && (
            <div className="space-y-4 pt-1 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-3">
                Auteur
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground" htmlFor="cmt-auteur">
                    Nom <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="cmt-auteur"
                    value={form.auteur}
                    onChange={e => set('auteur', e.target.value)}
                    placeholder="Nom complet"
                    error={!!errors.auteur}
                  />
                  {errors.auteur && <p className="text-xs text-destructive">{errors.auteur}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground" htmlFor="cmt-role">Rôle</label>
                  <Input
                    id="cmt-role"
                    value={form.role}
                    onChange={e => set('role', e.target.value)}
                    placeholder="Rôle dans le projet"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section: Auteur (view) */}
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

          {/* Section: Options (new/edit) */}
          {!readOnly && (
            <div className="space-y-4 pt-1 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-3">
                Options
              </p>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground" htmlFor="cmt-mention">
                    Mention utilisateur
                  </label>
                  <Input
                    id="cmt-mention"
                    value={form.mention}
                    onChange={e => set('mention', e.target.value)}
                    placeholder={UTILISATEURS_MENTION[0]}
                    list="mention-list"
                  />
                  <datalist id="mention-list">
                    {UTILISATEURS_MENTION.map(u => <option key={u} value={u} />)}
                  </datalist>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground" htmlFor="cmt-pj">
                    Pièce jointe (nom de fichier)
                  </label>
                  <div className="flex items-center gap-2">
                    <Paperclip className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <Input
                      id="cmt-pj"
                      value={form.piece_jointe}
                      onChange={e => set('piece_jointe', e.target.value)}
                      placeholder="Ex : rapport_mars.pdf"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground" htmlFor="cmt-parent">
                    Réponse à (ID commentaire parent)
                  </label>
                  <Input
                    id="cmt-parent"
                    value={form.parent_id}
                    onChange={e => set('parent_id', e.target.value)}
                    placeholder="Ex : cmt-001"
                  />
                </div>
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
          {mode === 'edit' && commentaire && onDelete && (
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
        </SlideOverBody>

        {/* ── Footer ── */}
        <SlideOverFooter>
          <SlideOverClose asChild>
            <Button variant="outline">Fermer</Button>
          </SlideOverClose>
          {!readOnly && (
            <Button onClick={handleSave}>
              {mode === 'new' ? 'Ajouter le commentaire' : 'Enregistrer'}
            </Button>
          )}
        </SlideOverFooter>
      </SlideOverContent>
    </SlideOver>
  );
}
