import {
  FileText, FileSpreadsheet, File, Image as ImageIcon, Archive,
  Download, MessageSquare, Clock, Tag, Shield, History,
} from 'lucide-react';
import type { DocumentGlobal, TypeFichier, StatutGlobalDoc, ConfidentialiteGlobalDoc } from '@/types';
import { STATUT_GLOBAL_DOC_LABEL, CONF_GLOBAL_DOC_LABEL } from '@/mocks/globalDocumentsMocks';
import { Badge } from '@/components/ui/data-display/Badge';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch { return iso; }
}

function fmtSize(ko: number): string {
  if (ko >= 1024) return `${(ko / 1024).toFixed(1)} Mo`;
  return `${ko} Ko`;
}

function statutVariant(s: StatutGlobalDoc): 'default' | 'success' | 'warning' | 'secondary' | 'destructive' | 'info' {
  if (s === 'PUBLIE')        return 'success';
  if (s === 'BROUILLON')     return 'secondary';
  if (s === 'EN_VALIDATION') return 'warning';
  if (s === 'ARCHIVE')       return 'info';
  if (s === 'EXPIRE')        return 'destructive';
  return 'default';
}

function confVariant(c: ConfidentialiteGlobalDoc): 'default' | 'success' | 'warning' | 'secondary' | 'destructive' | 'info' {
  if (c === 'PUBLIQUE')       return 'success';
  if (c === 'INTERNE')        return 'info';
  if (c === 'CONFIDENTIELLE') return 'warning';
  if (c === 'RESTREINTE')     return 'destructive';
  return 'default';
}

function FileTypeIcon({ type }: { type: TypeFichier }) {
  if (type === 'Excel') return <FileSpreadsheet className="h-8 w-8 text-success" />;
  if (type === 'Word')  return <FileText className="h-8 w-8 text-info" />;
  if (type === 'PDF')   return <FileText className="h-8 w-8 text-destructive" />;
  if (type === 'Image') return <ImageIcon className="h-8 w-8 text-warning" />;
  if (type === 'ZIP')   return <Archive className="h-8 w-8 text-muted-foreground" />;
  return <File className="h-8 w-8 text-muted-foreground" />;
}

function fileTypeBg(type: TypeFichier): string {
  if (type === 'Excel') return 'bg-success/10';
  if (type === 'Word')  return 'bg-info/10';
  if (type === 'PDF')   return 'bg-destructive/10';
  if (type === 'Image') return 'bg-warning/10';
  return 'bg-muted/30';
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-2 items-start py-2 border-b border-border last:border-b-0">
      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide pt-0.5">{label}</span>
      <span className="text-xs text-foreground font-medium leading-relaxed">{value}</span>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

interface DocumentPreviewProps {
  document: DocumentGlobal;
}

export function DocumentPreview({ document: doc }: DocumentPreviewProps) {
  return (
    <div className="space-y-5">

      {/* En-tête visuel */}
      <div className="rounded-lg border border-border bg-muted/20 p-4 flex items-start gap-4">
        <div className={`h-14 w-14 rounded-xl flex items-center justify-center shrink-0 ${fileTypeBg(doc.type)}`}>
          <FileTypeIcon type={doc.type} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            <Badge variant={statutVariant(doc.statut)} className="text-[10px]">
              {STATUT_GLOBAL_DOC_LABEL[doc.statut]}
            </Badge>
            <Badge variant={confVariant(doc.confidentialite)} className="text-[10px]">
              <Shield className="h-2.5 w-2.5 mr-1" />
              {CONF_GLOBAL_DOC_LABEL[doc.confidentialite]}
            </Badge>
            <Badge variant="outline" className="text-[10px] font-mono">
              v{doc.version}
            </Badge>
          </div>
          <h3 className="text-sm font-bold text-foreground leading-snug">{doc.titre}</h3>
          <p className="text-[11px] text-muted-foreground mt-1 font-mono">{doc.code_document}</p>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <Download className="h-3.5 w-3.5" />
            <span className="text-[10px] font-medium">Téléchargements</span>
          </div>
          <p className="text-lg font-bold text-foreground">{doc.nb_telechargements}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="text-[10px] font-medium">Commentaires</span>
          </div>
          <p className="text-lg font-bold text-foreground">{doc.nb_commentaires}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <History className="h-3.5 w-3.5" />
            <span className="text-[10px] font-medium">Versions</span>
          </div>
          <p className="text-lg font-bold text-foreground">{doc.versions.length}</p>
        </div>
      </div>

      {/* Métadonnées */}
      <div className="space-y-2">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Métadonnées</p>
        <div className="rounded-lg border border-border bg-card p-3 divide-y divide-border">
          <Row label="Catégorie"    value={<Badge variant="outline" className="text-[10px]">{doc.categorie}</Badge>} />
          <Row label="Type"         value={doc.type} />
          <Row label="Taille"       value={fmtSize(doc.taille_ko)} />
          <Row label="Auteur"       value={doc.auteur} />
          <Row label="Service"      value={doc.service} />
          <Row label="Créé le"      value={fmtDate(doc.date_creation)} />
          <Row label="Modifié le"   value={fmtDate(doc.date_modification)} />
          {doc.date_expiration && (
            <Row label="Expire le"  value={
              <span className={new Date(doc.date_expiration) < new Date() ? 'text-destructive font-semibold' : ''}>
                {fmtDate(doc.date_expiration)}
              </span>
            } />
          )}
          {doc.description && (
            <Row label="Description" value={
              <span className="text-[11px] leading-relaxed whitespace-pre-wrap">{doc.description}</span>
            } />
          )}
        </div>
      </div>

      {/* Mots-clés */}
      {doc.mots_cles.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <Tag className="h-3 w-3" />Mots-clés
          </p>
          <div className="flex flex-wrap gap-1.5">
            {doc.mots_cles.map(tag => (
              <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-muted text-muted-foreground font-medium">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Historique des versions */}
      {doc.versions.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <Clock className="h-3 w-3" />Historique des versions
          </p>
          <div className="space-y-2">
            {[...doc.versions].reverse().map((v, i) => (
              <div key={v.version} className={`flex items-start gap-3 p-2.5 rounded-lg border ${i === 0 ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'}`}>
                <div className={`text-[10px] font-bold font-mono px-2 py-1 rounded ${i === 0 ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  v{v.version}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-foreground">{v.changements}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {v.auteur} · {fmtDate(v.date)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
