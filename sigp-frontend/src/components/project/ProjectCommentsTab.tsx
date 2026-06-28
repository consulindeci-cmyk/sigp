import { useState } from 'react';
import { Paperclip, Reply, Edit, Trash2, Send, X, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/forms/Button';
import { Textarea } from '@/components/ui/forms/Textarea';
import { Badge } from '@/components/ui/data-display/Badge';
import { Card, CardContent } from '@/components/ui/data-display/Card';
import { mockComments, type ProjectComment, type CommentReply } from '@/mocks/commentsMocks';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
      + ' · '
      + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

function timeAgo(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1) return 'il y a quelques minutes';
    if (h < 24) return `il y a ${h}h`;
    const d = Math.floor(h / 24);
    if (d < 7) return `il y a ${d} jour${d > 1 ? 's' : ''}`;
    return formatDateTime(iso);
  } catch { return iso; }
}

// ─────────────────────────────────────────────────────────────────────────────
// Avatar inline
// ─────────────────────────────────────────────────────────────────────────────

const AVATAR_COLORS: Record<string, string> = {
  AD: 'bg-primary/10 text-primary',
  FM: 'bg-success/10 text-success',
  AK: 'bg-warning/10 text-warning',
  RH: 'bg-info/10 text-info',
  BI: 'bg-destructive/10 text-destructive',
  ST: 'bg-secondary text-foreground',
};

function Avatar({ initiales, size = 'md' }: { initiales: string; size?: 'sm' | 'md' | 'lg' }) {
  const color = AVATAR_COLORS[initiales] ?? 'bg-muted text-muted-foreground';
  const dim = size === 'sm' ? 'h-6 w-6 text-[9px]' : size === 'lg' ? 'h-10 w-10 text-[13px]' : 'h-8 w-8 text-[11px]';
  return (
    <div className={`${dim} ${color} rounded-full flex items-center justify-center font-bold shrink-0`} aria-hidden="true">
      {initiales}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Réponse individuelle
// ─────────────────────────────────────────────────────────────────────────────

function ReplyItem({
  reply,
  onEdit,
  onDelete,
}: {
  reply: CommentReply;
  onEdit: (r: CommentReply) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex gap-2.5">
      <Avatar initiales={reply.initialesAuteur} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-[12px] font-semibold text-foreground">{reply.auteur}</span>
          <span className="text-[11px] text-muted-foreground">{timeAgo(reply.date)}</span>
        </div>
        <p className="text-[12px] text-foreground leading-relaxed">{reply.message}</p>
        <div className="flex items-center gap-1 mt-1.5">
          <Button variant="ghost" size="sm" aria-label="Modifier cette réponse"
            className="h-5 px-1.5 text-[10px] text-muted-foreground"
            onClick={() => onEdit(reply)}
          >
            <Edit className="h-2.5 w-2.5 mr-0.5" />Modifier
          </Button>
          <Button variant="ghost" size="sm" aria-label="Supprimer cette réponse"
            className="h-5 px-1.5 text-[10px] text-destructive hover:text-destructive"
            onClick={() => onDelete(reply.id)}
          >
            <Trash2 className="h-2.5 w-2.5 mr-0.5" />Supprimer
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Carte commentaire
// ─────────────────────────────────────────────────────────────────────────────

function CommentCard({
  comment,
  onEdit,
  onDelete,
  onAddReply,
  onEditReply,
  onDeleteReply,
}: {
  comment: ProjectComment;
  onEdit: (c: ProjectComment) => void;
  onDelete: (id: string) => void;
  onAddReply: (commentId: string, message: string) => void;
  onEditReply: (commentId: string, reply: CommentReply) => void;
  onDeleteReply: (commentId: string, replyId: string) => void;
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');

  function submitReply() {
    const msg = replyText.trim();
    if (!msg) return;
    onAddReply(comment.id, msg);
    setReplyText('');
    setShowReplyForm(false);
  }

  return (
    <Card>
      <CardContent className="pt-4">
        {/* Header */}
        <div className="flex gap-3">
          <Avatar initiales={comment.initialesAuteur} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap mb-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[13px] font-semibold text-foreground">{comment.auteur}</span>
                <span className="text-[11px] text-muted-foreground" title={formatDateTime(comment.date)}>
                  {timeAgo(comment.date)}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="sm" aria-label="Modifier ce commentaire"
                  className="h-6 px-2 text-[10px] text-muted-foreground"
                  onClick={() => onEdit(comment)}
                >
                  <Edit className="h-3 w-3 mr-0.5" />Modifier
                </Button>
                <Button variant="ghost" size="sm" aria-label="Supprimer ce commentaire"
                  className="h-6 px-2 text-[10px] text-destructive hover:text-destructive"
                  onClick={() => onDelete(comment.id)}
                >
                  <Trash2 className="h-3 w-3 mr-0.5" />Supprimer
                </Button>
              </div>
            </div>

            {/* Message */}
            <p className="text-[13px] text-foreground leading-relaxed mb-2">{comment.message}</p>

            {/* Pièce jointe simulée */}
            {comment.pieceJointe && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted text-[11px] text-muted-foreground border border-border mb-2">
                <Paperclip className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span className="truncate max-w-[200px]">{comment.pieceJointe}</span>
                <Badge variant="secondary" className="text-[9px] ml-1">Simulé</Badge>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 mt-1">
              <Button
                variant="ghost" size="sm" aria-label="Répondre"
                className="h-6 px-2 text-[11px] text-muted-foreground"
                onClick={() => setShowReplyForm((v) => !v)}
              >
                <Reply className="h-3 w-3 mr-0.5" />Répondre
                {comment.reponses.length > 0 && (
                  <span className="ml-1 text-[10px] text-primary">({comment.reponses.length})</span>
                )}
              </Button>
            </div>

            {/* Réponses */}
            {comment.reponses.length > 0 && (
              <div className="mt-4 pl-2 border-l-2 border-border flex flex-col gap-3">
                {comment.reponses.map((r) => (
                  <ReplyItem
                    key={r.id}
                    reply={r}
                    onEdit={(reply) => onEditReply(comment.id, reply)}
                    onDelete={(id) => onDeleteReply(comment.id, id)}
                  />
                ))}
              </div>
            )}

            {/* Formulaire réponse */}
            {showReplyForm && (
              <div className="mt-3 pl-2 border-l-2 border-primary">
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Écrire une réponse..."
                  className="min-h-[70px] text-[13px]"
                  aria-label="Écrire une réponse"
                />
                <div className="flex items-center gap-2 mt-2">
                  <Button variant="default" size="sm" onClick={submitReply} disabled={!replyText.trim()}>
                    <Send className="h-3 w-3 mr-1" aria-hidden="true" />Envoyer
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setShowReplyForm(false); setReplyText(''); }}>
                    <X className="h-3 w-3 mr-1" aria-hidden="true" />Annuler
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

const CURRENT_USER = { initiales: 'AD', nom: 'Amadou Diallo' };

export default function ProjectCommentsTab() {
  const [comments, setComments] = useState<ProjectComment[]>(mockComments);
  const [newMessage, setNewMessage] = useState('');
  const [editingComment, setEditingComment] = useState<ProjectComment | null>(null);
  const [editMessage, setEditMessage] = useState('');

  function addComment() {
    const msg = newMessage.trim();
    if (!msg) return;
    const c: ProjectComment = {
      id: `c${Date.now()}`,
      auteur: CURRENT_USER.nom,
      initialesAuteur: CURRENT_USER.initiales,
      date: new Date().toISOString(),
      message: msg,
      pieceJointe: null,
      reponses: [],
    };
    setComments((prev) => [c, ...prev]);
    setNewMessage('');
  }

  function deleteComment(id: string) {
    setComments((prev) => prev.filter((c) => c.id !== id));
  }

  function startEdit(c: ProjectComment) {
    setEditingComment(c);
    setEditMessage(c.message);
  }

  function saveEdit() {
    if (!editingComment) return;
    setComments((prev) =>
      prev.map((c) => c.id === editingComment.id ? { ...c, message: editMessage } : c)
    );
    setEditingComment(null);
    setEditMessage('');
  }

  function addReply(commentId: string, message: string) {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id !== commentId) return c;
        const reply: CommentReply = {
          id: `r${Date.now()}`,
          auteur: CURRENT_USER.nom,
          initialesAuteur: CURRENT_USER.initiales,
          date: new Date().toISOString(),
          message,
        };
        return { ...c, reponses: [...c.reponses, reply] };
      })
    );
  }

  function editReply(commentId: string, updatedReply: CommentReply) {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id !== commentId) return c;
        return { ...c, reponses: c.reponses.map((r) => r.id === updatedReply.id ? updatedReply : r) };
      })
    );
  }

  function deleteReply(commentId: string, replyId: string) {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id !== commentId) return c;
        return { ...c, reponses: c.reponses.filter((r) => r.id !== replyId) };
      })
    );
  }

  return (
    <section aria-label="Commentaires et Discussions" className="flex flex-col gap-6">

      {/* Formulaire nouveau commentaire */}
      <div className="bg-card border border-border rounded-lg p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <Avatar initiales={CURRENT_USER.initiales} size="md" />
          <p className="text-[13px] font-medium text-foreground">{CURRENT_USER.nom}</p>
          {editingComment && (
            <Badge variant="warning" className="text-[10px]">Mode édition</Badge>
          )}
        </div>

        {editingComment ? (
          <>
            <Textarea
              value={editMessage}
              onChange={(e) => setEditMessage(e.target.value)}
              placeholder="Modifier votre commentaire..."
              className="min-h-[90px] text-[13px]"
              aria-label="Modifier le commentaire"
            />
            <div className="flex items-center gap-2">
              <Button variant="default" size="sm" onClick={saveEdit} disabled={!editMessage.trim()}>
                <Send className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />Enregistrer
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setEditingComment(null); setEditMessage(''); }}>
                <X className="h-3.5 w-3.5 mr-1" aria-hidden="true" />Annuler
              </Button>
            </div>
          </>
        ) : (
          <>
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Ajouter un commentaire ou une information..."
              className="min-h-[90px] text-[13px]"
              aria-label="Nouveau commentaire"
            />
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-[11px] text-muted-foreground">
                <MessageSquare className="h-3 w-3 inline mr-1" aria-hidden="true" />
                {comments.length} commentaire{comments.length !== 1 ? 's' : ''} · {comments.reduce((s, c) => s + c.reponses.length, 0)} réponse{comments.reduce((s, c) => s + c.reponses.length, 0) !== 1 ? 's' : ''}
              </p>
              <Button variant="default" size="sm" onClick={addComment} disabled={!newMessage.trim()}>
                <Send className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />Publier
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Liste commentaires */}
      {comments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <MessageSquare className="h-10 w-10 text-muted-foreground mb-3" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground mb-1">Aucun commentaire</p>
          <p className="text-xs text-muted-foreground">Soyez le premier à commenter ce projet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {comments.map((c) => (
            <CommentCard
              key={c.id}
              comment={c}
              onEdit={startEdit}
              onDelete={deleteComment}
              onAddReply={addReply}
              onEditReply={editReply}
              onDeleteReply={deleteReply}
            />
          ))}
        </div>
      )}
    </section>
  );
}
