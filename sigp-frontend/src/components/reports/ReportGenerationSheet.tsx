import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, CheckCircle2, FileText, AlertCircle, Eye, Play } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/forms/Button';
import { Select } from '@/components/ui/forms/Select';
import { Input } from '@/components/ui/forms/Input';
import { Badge } from '@/components/ui/data-display/Badge';
import {
  SlideOver, SlideOverContent, SlideOverHeader, SlideOverTitle,
  SlideOverBody, SlideOverFooter, SlideOverClose,
} from '@/components/ui/overlays/SlideOver';
import { formatBadgeVariant } from '@/components/reports/ReportCatalogCard';
import type { ReportTemplate } from '@/mocks/reportsMocks';
import type { TypeRapport } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import { useUploadDocument } from '@/hooks/useDocuments';
import { useCreateReport } from '@/hooks/useReports';
import {
  buildReportFile, buildSections, fetchProjectHeader, triggerBrowserDownload,
  type ReportSection,
} from '@/lib/reportBuilder';

// ─────────────────────────────────────────────────────────────────────────────
// Vrai moteur de génération (cf. audit Documents & Rapports) : plus de barre
// de progression setInterval ni de bouton "Télécharger" vide. "Générer"
// construit un vrai PDF/Excel à partir des données réelles du projet
// (calculate_project_evm, budget_lignes version APPROUVE, ptba_activites,
// risques), déclenche le téléchargement navigateur, téléverse le fichier
// réel vers sigp-documents (documents-upload-version) et n'enregistre la
// ligne de catalogue rapports_projet qu'une fois les DEUX étapes confirmées.
// "Aperçu" affiche les mêmes données réelles sous forme de tableau, sans
// upload ni écriture — plus de skeleton figé "Prévisualisation simulée".
// ─────────────────────────────────────────────────────────────────────────────

export type GenerationMode = 'generate' | 'preview';

// Seuls ces deux formats ont une vraie librairie de génération dans le
// projet (jspdf/jspdf-autotable, xlsx) — Word/CSV ne sont pas proposés ici.
type RealFormat = 'PDF' | 'XLSX';

export interface ReportGenerationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: ReportTemplate | null;
  reportType: TypeRapport;
  mode: GenerationMode;
  canManage: boolean;
}

function useProjectOptions() {
  return useQuery({
    queryKey: ['projects-dropdown-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, nom')
        .is('deleted_at', null)
        .order('nom');
      if (error) throw error;
      return data as { id: string; nom: string }[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function ReportGenerationSheet({
  open, onOpenChange, report, reportType, mode, canManage,
}: ReportGenerationSheetProps) {
  const [format, setFormat] = useState<RealFormat>('PDF');
  const [dateDebut, setDateDebut] = useState('2026-01-01');
  const [dateFin, setDateFin] = useState(new Date().toISOString().slice(0, 10));
  const [projectId, setProjectId] = useState('');
  const [projectError, setProjectError] = useState(false);

  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewSections, setPreviewSections] = useState<ReportSection[] | null>(null);

  const { data: projectOptions = [] } = useProjectOptions();
  const currentUser = useAuthStore(s => s.user);
  const authorName = currentUser
    ? (`${currentUser.prenom ?? ''} ${currentUser.nom ?? ''}`.trim() || currentUser.email)
    : 'Utilisateur';

  const uploadMutation = useUploadDocument(projectId);
  const createReportMutation = useCreateReport(projectId || undefined);

  // Reset state on open
  useEffect(() => {
    if (open && report) {
      setFormat('PDF');
      setGenerating(false);
      setGenError(null);
      setDone(false);
      setPreviewing(false);
      setPreviewError(null);
      setPreviewSections(null);
      setProjectId('');
      setProjectError(false);
    }
  }, [open, report]);

  const isPreviewMode = mode === 'preview';

  async function handleGenerate() {
    if (!report) return;
    if (!projectId) { setProjectError(true); return; }
    setProjectError(false);
    setGenerating(true);
    setGenError(null);
    try {
      const built = await buildReportFile({
        type: reportType,
        format: format === 'XLSX' ? 'Excel' : 'PDF',
        projectId,
        reportTitle: report.nom,
        reportCode: report.code,
        dateDebut,
        dateFin,
      });

      // Téléchargement navigateur immédiat du fichier réel.
      triggerBrowserDownload(built.blob, built.fileName);

      const file = new File([built.blob], built.fileName, { type: built.mimeType });
      const today = new Date().toISOString().slice(0, 10);

      // 1. Fichier réel vers le bucket privé sigp-documents.
      const createdDoc = await uploadMutation.mutateAsync({
        file,
        meta: {
          projet_id: projectId,
          code_document: `RPT-${report.code}`,
          titre: built.fileName,
          categorie: 'Rapport',
          version: '1.0',
          auteur: authorName,
          responsable: authorName,
          date_creation: today,
          date_modification: today,
          statut: 'VALIDE',
          taille_ko: built.sizeKo,
          type_fichier: format === 'XLSX' ? 'Excel' : 'PDF',
          mots_cles: [],
          confidentialite: 'INTERNE',
        },
      });

      // 2. Ligne de catalogue rapports_projet, référençant le vrai fichier —
      // n'est écrite qu'une fois le fichier réellement stocké (pas avant).
      await createReportMutation.mutateAsync({
        projet_id: projectId,
        code_rapport: report.code,
        titre: report.nom,
        description: report.description,
        type: reportType,
        format: format === 'XLSX' ? 'Excel' : 'PDF',
        statut: 'GENERE',
        periode: `${dateDebut} → ${dateFin}`,
        version: '1.0',
        auteur: authorName,
        taille_ko: built.sizeKo,
        nb_telechargements: 0,
        date_generation: today,
        documentId: createdDoc.id,
      });

      setGenerating(false);
      setDone(true);
    } catch (err) {
      setGenerating(false);
      setGenError(err instanceof Error ? err.message : 'Échec de la génération du rapport.');
    }
  }

  async function handlePreview() {
    if (!report) return;
    if (!projectId) { setProjectError(true); return; }
    setProjectError(false);
    setPreviewing(true);
    setPreviewError(null);
    try {
      const project = await fetchProjectHeader(projectId);
      const sections = await buildSections(reportType, projectId, project?.devise ?? 'XOF');
      setPreviewSections(sections);
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : "Échec du chargement de l'aperçu.");
    } finally {
      setPreviewing(false);
    }
  }

  if (!report) return null;

  const title = isPreviewMode ? `Aperçu — ${report.nom}` : `Générer — ${report.nom}`;
  const busy = generating || previewing || uploadMutation.isPending || createReportMutation.isPending;

  return (
    <SlideOver open={open} onOpenChange={onOpenChange}>
      <SlideOverContent className="sm:max-w-lg">
        <SlideOverHeader>
          <div className="flex flex-col gap-1">
            <SlideOverTitle className="text-base">{title}</SlideOverTitle>
            <p className="text-[11px] text-muted-foreground">{report.categorie}</p>
          </div>
          <SlideOverClose asChild>
            <Button variant="ghost" size="sm" aria-label="Fermer">
              <X className="h-4 w-4" />
            </Button>
          </SlideOverClose>
        </SlideOverHeader>

        <SlideOverBody>
          <div className="flex flex-col gap-5">
            {/* Report info */}
            <div className="flex items-start gap-3 bg-muted/40 rounded-lg p-3">
              <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0" aria-hidden="true">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-[13px] font-semibold text-foreground">{report.nom}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{report.description}</p>
                {!isPreviewMode && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    <Badge variant={formatBadgeVariant('PDF')} className="text-[10px] px-1.5 py-0">PDF</Badge>
                    <Badge variant={formatBadgeVariant('XLSX')} className="text-[10px] px-1.5 py-0">XLSX</Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Config form */}
            {!done && (
              <div className="flex flex-col gap-4">
                {!isPreviewMode && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground" htmlFor="rpt-format">
                      Format d'export
                    </label>
                    <Select
                      id="rpt-format"
                      value={format}
                      onChange={(e) => setFormat(e.target.value as RealFormat)}
                      disabled={busy}
                    >
                      <option value="PDF">PDF</option>
                      <option value="XLSX">Excel (XLSX)</option>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground" htmlFor="rpt-debut">
                      Date début
                    </label>
                    <Input
                      id="rpt-debut"
                      type="date"
                      value={dateDebut}
                      onChange={(e) => setDateDebut(e.target.value)}
                      disabled={busy}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground" htmlFor="rpt-fin">
                      Date fin
                    </label>
                    <Input
                      id="rpt-fin"
                      type="date"
                      value={dateFin}
                      onChange={(e) => setDateFin(e.target.value)}
                      disabled={busy}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground" htmlFor="rpt-projet">
                    Projet <span className="text-destructive">*</span>
                  </label>
                  <Select
                    id="rpt-projet"
                    value={projectId}
                    onChange={(e) => { setProjectId(e.target.value); setProjectError(false); }}
                    disabled={busy}
                    error={projectError}
                  >
                    <option value="">Sélectionner un projet…</option>
                    {projectOptions.map((p) => (
                      <option key={p.id} value={p.id}>{p.nom}</option>
                    ))}
                  </Select>
                  {projectError && <p className="text-xs text-destructive">Un projet doit être sélectionné.</p>}
                </div>
              </div>
            )}

            {/* Erreurs réelles (génération ou aperçu) */}
            {(genError || previewError) && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive" role="alert">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{genError ?? previewError}</span>
              </div>
            )}

            {/* Success state */}
            {done && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-success text-sm bg-success/10 rounded-md px-4 py-3 border border-success/20">
                  <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <div>
                    <p className="font-medium">Rapport généré, téléchargé et enregistré</p>
                    <p className="text-[11px] text-success/80 mt-0.5">
                      {report.nom} — {format} · {dateDebut} → {dateFin}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Aperçu réel */}
            {isPreviewMode && !previewing && previewSections && (
              <div className="flex flex-col gap-4 max-h-[360px] overflow-y-auto">
                {previewSections.map((section) => (
                  <div key={section.title} className="border border-border rounded-lg overflow-hidden">
                    <div className="px-3 py-2 bg-muted/30 border-b border-border">
                      <p className="text-xs font-semibold text-foreground">{section.title}</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-[11px]">
                        <thead>
                          <tr className="bg-muted/10">
                            {section.head.map((h) => (
                              <th key={h} className="px-2 py-1.5 text-left font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {section.rows.slice(0, 8).map((row, i) => (
                            <tr key={i} className="border-t border-border">
                              {row.map((cell, j) => (
                                <td key={j} className="px-2 py-1.5 text-foreground whitespace-nowrap">{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {section.rows.length > 8 && (
                        <p className="text-[10px] text-muted-foreground px-2 py-1 bg-muted/10">
                          + {section.rows.length - 8} ligne{section.rows.length - 8 > 1 ? 's' : ''} supplémentaire{section.rows.length - 8 > 1 ? 's' : ''} dans le fichier généré
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isPreviewMode && !previewing && !previewSections && !previewError && (
              <div className="border border-border rounded-lg p-4 bg-muted/20 min-h-[140px] flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <AlertCircle className="h-8 w-8" aria-hidden="true" />
                <p className="text-[12px] text-center">
                  Sélectionnez un projet puis cliquez sur « Aperçu » pour charger les données réelles.
                </p>
              </div>
            )}
          </div>
        </SlideOverBody>

        <SlideOverFooter>
          <SlideOverClose asChild>
            <Button variant="outline">{done ? 'Fermer' : 'Annuler'}</Button>
          </SlideOverClose>
          {!done && canManage && (
            <Button
              variant="default"
              onClick={isPreviewMode ? handlePreview : handleGenerate}
              disabled={busy}
              leftIcon={isPreviewMode ? <Eye className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            >
              {isPreviewMode
                ? (previewing ? 'Chargement...' : 'Aperçu')
                : (generating || uploadMutation.isPending || createReportMutation.isPending ? 'Génération...' : 'Générer')
              }
            </Button>
          )}
        </SlideOverFooter>
      </SlideOverContent>
    </SlideOver>
  );
}

