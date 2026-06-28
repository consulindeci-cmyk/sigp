import { FileText, Star, StarOff, Play, Eye, Copy, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/data-display/Badge';
import { Button } from '@/components/ui/forms/Button';
import { Card, CardContent } from '@/components/ui/data-display/Card';
import { ActionsMenu, type ActionItem } from '@/components/projects/ActionsMenu';
import type { ReportTemplate, ReportFormat, ReportFrequency } from '@/mocks/reportsMocks';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

export function formatBadgeVariant(f: ReportFormat): 'default' | 'success' | 'info' | 'warning' {
  switch (f) {
    case 'PDF':  return 'default';
    case 'XLSX': return 'success';
    case 'CSV':  return 'info';
    case 'DOCX': return 'warning';
  }
}

export function frequencyBadgeVariant(f: ReportFrequency): 'outline' | 'secondary' | 'warning' | 'info' | 'default' {
  switch (f) {
    case 'Manuel':       return 'outline';
    case 'Quotidien':    return 'warning';
    case 'Hebdomadaire': return 'info';
    case 'Mensuel':      return 'default';
    case 'Trimestriel':  return 'secondary';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ReportCatalogCard
// ─────────────────────────────────────────────────────────────────────────────

export interface ReportCatalogCardProps {
  report: ReportTemplate;
  onGenerate:    (r: ReportTemplate) => void;
  onPreview:     (r: ReportTemplate) => void;
  onToggleFav:   (id: string) => void;
  onDuplicate:   (r: ReportTemplate) => void;
  onDelete:      (r: ReportTemplate) => void;
}

export function ReportCatalogCard({
  report,
  onGenerate,
  onPreview,
  onToggleFav,
  onDuplicate,
  onDelete,
}: ReportCatalogCardProps) {
  const moreActions: ActionItem[] = [
    { label: 'Aperçu',     icon: <Eye className="h-3.5 w-3.5" />,    onClick: () => onPreview(report) },
    { label: 'Dupliquer',  icon: <Copy className="h-3.5 w-3.5" />,   onClick: () => onDuplicate(report) },
    { label: 'Supprimer',  icon: <Trash2 className="h-3.5 w-3.5" />, onClick: () => onDelete(report), variant: 'destructive', separator: true },
  ];

  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow duration-150">
      <CardContent className="flex flex-col gap-3 pt-4 flex-1">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0" aria-hidden="true">
              <FileText className="h-4 w-4" />
            </div>
            <Badge variant="outline" className="font-mono text-[10px]">{report.code}</Badge>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onToggleFav(report.id)}
              aria-label={report.favori ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-warning focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {report.favori
                ? <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                : <StarOff className="h-3.5 w-3.5" />
              }
            </button>
            <ActionsMenu actions={moreActions} aria-label={`Plus d'actions pour ${report.nom}`} />
          </div>
        </div>

        {/* Name + description */}
        <div className="flex flex-col gap-1">
          <p className="text-[13px] font-semibold text-foreground leading-snug">{report.nom}</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{report.description}</p>
        </div>

        {/* Formats */}
        <div className="flex flex-wrap gap-1">
          {report.formatsDisponibles.map((f) => (
            <Badge key={f} variant={formatBadgeVariant(f)} className="text-[10px] px-1.5 py-0">{f}</Badge>
          ))}
        </div>

        {/* Meta */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground border-t border-border pt-2 mt-auto">
          <Badge variant={frequencyBadgeVariant(report.frequence)} className="text-[10px]">{report.frequence}</Badge>
          <span className="font-mono">{report.nombreExports} exports</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="default"
            size="sm"
            className="flex-1 gap-1.5"
            leftIcon={<Play className="h-3 w-3" />}
            onClick={() => onGenerate(report)}
            aria-label={`Générer ${report.nom}`}
          >
            Générer
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            leftIcon={<Eye className="h-3 w-3" />}
            onClick={() => onPreview(report)}
            aria-label={`Aperçu de ${report.nom}`}
          >
            Aperçu
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
