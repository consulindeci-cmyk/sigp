import { useState } from 'react';
import { Edit2, Share2, FileText, AlertTriangle, AlertCircle, Copy, Check, X, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/forms/Button';
import { Badge } from '@/components/ui/data-display/Badge';
import { Input } from '@/components/ui/forms/Input';
import { Select } from '@/components/ui/forms/Select';
import { Card, CardContent } from '@/components/ui/data-display/Card';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription,
  ModalFooter, ModalClose,
} from '@/components/ui/overlays/Modal';
import { ProjectEditModal } from '@/components/projects/ProjectEditModal';
import type { Project } from '@/lib/projectAdapter';
import { useAuthStore } from '@/stores/authStore';
import { buildReportFile, triggerBrowserDownload } from '@/lib/reportBuilder';
import type { TypeRapport } from '@/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDateShort(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
  } catch { return iso; }
}

function statusBadgeVariant(
  status: Project['status'],
): 'warning' | 'destructive' | 'success' | 'secondary' {
  switch (status) {
    case 'En retard':      return 'destructive';
    case 'À risque':       return 'warning';
    case 'En bonne voie':  return 'success';
    case 'Clôturé':        return 'secondary';
    default:               return 'secondary';
  }
}

// ── Gauge bar ─────────────────────────────────────────────────────────────────

function GaugeBar({
  label, value, barClass, valueClass,
}: {
  label: string; value: number; barClass: string; valueClass: string;
}) {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-semibold text-muted-foreground">{label}</span>
        <span className={`text-xs font-bold ${valueClass}`}>{value}%</span>
      </div>
      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${barClass}`}
          style={{ width: `${Math.min(value, 100)}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface ProjectHeaderProps {
  project: Project;
  onProjectUpdate: (data: Partial<Project>) => Promise<void>;
  isUpdating?: boolean;
  updateError?: string | null;
}

// ── Main export ───────────────────────────────────────────────────────────────

const RAPPORT_TYPE_MAP: Record<string, TypeRapport> = {
  avancement: 'AVANCEMENT',
  financier:  'FINANCIER',
  evm:        'EVM',
  risques:    'RISQUES',
  final:      'FINAL',
};

export default function ProjectHeader({ project, onProjectUpdate, isUpdating = false, updateError = null }: ProjectHeaderProps) {
  const [showEdit,    setShowEdit]    = useState(false);
  const [showShare,   setShowShare]   = useState(false);
  const [showRapport, setShowRapport] = useState(false);
  const [linkCopied,  setLinkCopied]  = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false); // DEFAULT TO EXPANDED

  // Miroir de requireRole(profile, ['COORDINATEUR', 'ADMIN']) sur
  // projects-update — SUPER_ADMIN exclu par choix : la modification d'un
  // projet reste une responsabilité org_admin, pas plateforme.
  const currentRole = useAuthStore(s => s.user?.role);
  const canManageProject = currentRole === 'COORDINATEUR' || currentRole === 'ADMIN';

  const [rapportType,       setRapportType]       = useState('avancement');
  const [rapportFormat,     setRapportFormat]     = useState<'PDF' | 'Excel'>('PDF');
  const [rapportGenerating, setRapportGenerating] = useState(false);
  const [rapportDone,       setRapportDone]       = useState(false);
  const [rapportError,      setRapportError]      = useState<string | null>(null);

  async function handleSaveProject(data: Partial<Project>) {
    try {
      await onProjectUpdate(data);
      setShowEdit(false);
    } catch {
      // Erreur affichée via updateError — le panneau reste ouvert.
    }
  }

  function handleCopyLink() {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    navigator.clipboard.writeText(url).catch(() => {});
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  // Vrai moteur de génération (reportBuilder.ts) — remplace la simulation
  // setTimeout et les formats "(simulé)" (cf. audit Paramètres du Projet) :
  // un rapport de synthèse réel (EVM + Budget + Risques + PTBA), construit à
  // partir des données réellement stockées pour ce projet, téléchargé
  // immédiatement. Pas de catalogage dans rapports_projet ici — ce bouton
  // reste un export rapide, le Centre de Rapports (TabReports.tsx) couvre
  // déjà le cycle complet génération+stockage+historique.
  async function handleGenerateReport() {
    setRapportGenerating(true);
    setRapportError(null);
    try {
      const built = await buildReportFile({
        type: RAPPORT_TYPE_MAP[rapportType] ?? 'AVANCEMENT',
        format: rapportFormat,
        projectId: project.id,
        reportTitle: `Rapport de synthèse — ${project.name}`,
        reportCode: project.code,
        dateDebut: project.startDate,
        dateFin: project.endDate,
      });
      triggerBrowserDownload(built.blob, built.fileName);
      setRapportGenerating(false);
      setRapportDone(true);
    } catch (err) {
      setRapportGenerating(false);
      setRapportError(err instanceof Error ? err.message : 'Échec de la génération du rapport.');
    }
  }

  const physBarClass = project.progressScore >= 70
    ? 'bg-success' : project.progressScore >= 40 ? 'bg-warning' : 'bg-destructive';
  const physValClass = project.progressScore >= 70
    ? 'text-success' : project.progressScore >= 40 ? 'text-warning' : 'text-destructive';

  const hasAlert = project.status === 'En retard' || project.status === 'À risque';

  return (
    <>
      <Card className="mb-6 border-t-4 border-t-primary rounded-lg shadow-sm bg-card border-border">
        <CardContent className={`p-6 transition-all duration-300 ${isCollapsed ? 'pb-4' : ''}`}>

          <PageHeader
            title={project.name}
            badges={
              <>
                <span className="font-mono text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded">
                  {project.code}
                </span>
                <Badge variant={statusBadgeVariant(project.status)}>{project.status}</Badge>
                <Badge variant="outline">{project.sector}</Badge>
              </>
            }
            actions={
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  title={isCollapsed ? "Afficher les détails du projet" : "Masquer les détails du projet"}
                  className="px-2"
                >
                  {isCollapsed ? <ChevronDown className="w-5 h-5 text-muted-foreground" /> : <ChevronUp className="w-5 h-5 text-muted-foreground" />}
                </Button>
                {canManageProject && (
                  <Button
                    variant="outline"
                    leftIcon={<Edit2 className="w-4 h-4" />}
                    onClick={() => setShowEdit(true)}
                    className="hidden md:flex"
                  >
                    Modifier
                  </Button>
                )}
                <Button
                  variant="outline"
                  leftIcon={<Share2 className="w-4 h-4" />}
                  onClick={() => setShowShare(true)}
                  className="hidden md:flex"
                >
                  Partager
                </Button>
                <Button
                  variant="secondary"
                  leftIcon={<FileText className="w-4 h-4" />}
                  onClick={() => { setRapportDone(false); setRapportError(null); setShowRapport(true); }}
                  className="hidden md:flex"
                >
                  Rapport
                </Button>
              </>
            }
          />

          {/* Wrapper collapsible */}
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isCollapsed ? 'max-h-0 opacity-0 mt-0' : 'max-h-[1000px] opacity-100 mt-6'}`}>


          {/* Meta info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 pb-6 border-b border-border">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Bailleur Principal</span>
              <span className="text-sm font-semibold text-foreground">{project.donor}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Chef de Projet</span>
              <span className="text-sm font-semibold text-foreground">{project.manager}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Budget Total</span>
              <span className="text-sm font-bold text-primary">{project.budgetDisplay}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Calendrier</span>
              <span className="text-sm font-semibold text-foreground">
                {formatDateShort(project.startDate)} – {formatDateShort(project.endDate)}
              </span>
            </div>
          </div>

          {/* Progress bars + alert */}
          <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              <GaugeBar
                label="Profil / Complétude"
                value={project.profileScore}
                barClass="bg-warning"
                valueClass="text-warning"
              />
              <GaugeBar
                label="Progression Physique"
                value={project.progressScore}
                barClass={physBarClass}
                valueClass={physValClass}
              />
              <GaugeBar
                label="Taux d'exécution budgétaire"
                value={project.tauxDecaissement}
                barClass={project.tauxDecaissement >= 60 ? 'bg-success' : 'bg-warning'}
                valueClass={project.tauxDecaissement >= 60 ? 'text-success' : 'text-warning'}
              />
            </div>

            {hasAlert && (
              <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-md flex items-start gap-3 min-w-0 lg:min-w-[280px] w-full lg:w-auto">
                <div className="shrink-0 p-1 bg-destructive/10 text-destructive rounded-full mt-0.5">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-destructive">Alerte Projet</div>
                  <div className="text-xs text-destructive/80 mt-0.5">
                    {project.status === 'En retard'
                      ? 'Projet en retard — progression insuffisante par rapport au calendrier.'
                      : 'Projet à risque — surveiller les indicateurs EVM et les risques.'}
                  </div>
                </div>
              </div>
            )}
          </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Modale de modification ───────────────────────────────────────── */}
      <ProjectEditModal
        open={showEdit}
        onOpenChange={setShowEdit}
        project={project}
        onSave={handleSaveProject}
        isSaving={isUpdating}
        saveError={updateError}
      />

      {/* ── Modal Partager ─────────────────────────────────────────────── */}
      <Modal open={showShare} onOpenChange={setShowShare}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Partager ce projet</ModalTitle>
            <ModalDescription>
              Partagez le lien vers <strong className="text-foreground">{project.name}</strong> avec votre équipe.
            </ModalDescription>
          </ModalHeader>
          <div className="py-2 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Input
                value={typeof window !== 'undefined' ? window.location.href : ''}
                readOnly
                className="flex-1 font-mono text-xs"
                aria-label="Lien du projet"
              />
              <Button variant="outline" size="sm" onClick={handleCopyLink} className="shrink-0">
                {linkCopied
                  ? <><Check className="h-4 w-4 text-success" /><span className="ml-1.5 text-success">Copié !</span></>
                  : <><Copy className="h-4 w-4" /><span className="ml-1.5">Copier</span></>
                }
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Les utilisateurs ayant accès à l'application pourront consulter ce projet via ce lien.
            </p>
          </div>
          <ModalFooter>
            <ModalClose asChild>
              <Button variant="outline">
                <X className="h-4 w-4 mr-1.5" />
                Fermer
              </Button>
            </ModalClose>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ── Modal Rapport ──────────────────────────────────────────────── */}
      <Modal open={showRapport} onOpenChange={open => { if (!rapportGenerating) setShowRapport(open); }}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Générer un rapport</ModalTitle>
            <ModalDescription>
              Rapport pour le projet <strong className="text-foreground">{project.name}</strong>.
            </ModalDescription>
          </ModalHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="rpt-type">
                Type de rapport
              </label>
              <Select
                id="rpt-type"
                value={rapportType}
                onChange={e => setRapportType(e.target.value)}
                disabled={rapportGenerating || rapportDone}
              >
                <option value="avancement">Rapport d'avancement</option>
                <option value="financier">Rapport financier</option>
                <option value="evm">Rapport EVM</option>
                <option value="risques">Rapport des risques</option>
                <option value="final">Rapport final</option>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="rpt-format">
                Format d'export
              </label>
              <Select
                id="rpt-format"
                value={rapportFormat}
                onChange={e => setRapportFormat(e.target.value as 'PDF' | 'Excel')}
                disabled={rapportGenerating || rapportDone}
              >
                <option value="PDF">PDF</option>
                <option value="Excel">Excel (XLSX)</option>
              </Select>
            </div>
            {rapportError && (
              <div className="flex items-start gap-2 text-destructive text-sm bg-destructive/10 rounded-md px-3 py-2 border border-destructive/20" role="alert">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{rapportError}</span>
              </div>
            )}
            {rapportDone && (
              <div className="flex items-center gap-2 text-success text-sm bg-success/10 rounded-md px-3 py-2 border border-success/20">
                <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
                Rapport généré et téléchargé.
              </div>
            )}
          </div>
          <ModalFooter>
            <ModalClose asChild>
              <Button variant="outline" disabled={rapportGenerating}>{rapportDone ? 'Fermer' : 'Annuler'}</Button>
            </ModalClose>
            {!rapportDone && (
            <Button
              variant="default"
              onClick={handleGenerateReport}
              disabled={rapportGenerating}
            >
              <FileText className="h-4 w-4 mr-1.5" aria-hidden="true" />
              {rapportGenerating ? 'Génération…' : 'Générer'}
            </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
