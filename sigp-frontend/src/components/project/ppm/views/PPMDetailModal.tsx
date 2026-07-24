import type { ReactNode } from 'react';
import type { PPMLigne, CategorieAchat, MethodePassation } from '@/types/ppm';
import { formatCurrency } from '@/lib/utils';
import {
  Modal, ModalContent, ModalHeader, ModalTitle, ModalFooter, ModalClose,
} from '@/components/ui/overlays/Modal';
import { Button } from '@/components/ui/forms/Button';
import { Pencil } from 'lucide-react';
import { useWBS } from '@/hooks/useWBS';
import { useBudget, useBudgetVersion } from '@/hooks/useBudget';
import { useProject } from '@/hooks/useProjects';

// ── Labels partagés avec PPMMatrixRow.tsx/PPMFormSlideOver.tsx — dupliqués
// volontairement (même convention que ces deux fichiers) plutôt que d'ajouter
// un module de constantes partagé pour 12-15 entrées d'affichage.

const CATEGORIE_LABELS: Record<CategorieAchat, string> = {
  TRAVAUX:                  'Travaux',
  BIENS:                    'Fournitures',
  SERVICES_CONSULTANTS:     'Services de consultants',
  SERVICES_NON_CONSULTANTS: 'Services autres',
};

const METHODE_LABELS: Record<MethodePassation, string> = {
  AOI:  "Appel d'Offres International (AOI)",
  AON:  "Appel d'Offres National (AON)",
  AOPI: "Appel d'Offres Privé International",
  SFQC: 'Sélection Fondée sur Qualité et Coût (SFQC)',
  ED:   'Recrutement direct',
  DP:   'Demande de prix',
};

function formatDateFR(dateStr?: string): string {
  if (!dateStr) return '—';
  const dt = new Date(dateStr);
  if (isNaN(dt.getTime())) return '—';
  return dt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className="text-sm text-foreground font-medium">{value}</span>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3 pb-2 border-b border-border">
        {title}
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  );
}

interface PPMDetailModalProps {
  open:       boolean;
  onClose:    () => void;
  ligne:      PPMLigne | null;
  projectId:  string;
  canManage:  boolean;
  onEdit:     () => void;
}

export function PPMDetailModal({ open, onClose, ligne, projectId, canManage, onEdit }: PPMDetailModalProps) {
  // Résolution des libellés réels (WBS, ligne budgétaire, devise projet) —
  // même approche que PPMFormSlideOver.tsx : chaque consommateur récupère ses
  // propres données via les hooks plutôt que de faire remonter le plomberie
  // à travers PPMMatrix.tsx.
  const { data: wbsData } = useWBS(projectId);
  const wbsNode = wbsData?.data.find(n => n.id === ligne?.wbs_id);

  const { data: budget } = useBudget(projectId);
  const { data: budgetVersion } = useBudgetVersion(projectId, budget?.version_active_id);
  const budgetLigne = budgetVersion?.lignes?.find(l => l.id === ligne?.budget_ligne_id);

  const { data: project } = useProject(projectId);
  const devise = project?.devise || 'XOF';

  if (!ligne) return null;

  return (
    <Modal open={open} onOpenChange={o => { if (!o) onClose(); }}>
      <ModalContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <ModalHeader className="px-6 py-4 border-b border-border shrink-0 space-y-2">
          <ModalTitle className="font-mono">{ligne.reference_marche}</ModalTitle>
          <p className="text-sm text-muted-foreground">{ligne.description}</p>
        </ModalHeader>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          <SectionCard title="Rattachement & Configuration">
            <Field label="Activité WBS" value={wbsNode ? `${wbsNode.code_wbs} — ${wbsNode.titre}` : 'Non rattaché'} />
            <Field label="Ligne Budgétaire" value={budgetLigne ? `${budgetLigne.code_ligne} — ${budgetLigne.libelle}` : 'Non rattachée'} />
            <Field label="Type de marché" value={CATEGORIE_LABELS[ligne.categorie]} />
            <Field label="Méthode d'acquisition" value={METHODE_LABELS[ligne.methode]} />
            <Field
              label="Revue bailleur"
              value={ligne.type_revue === 'PRIOR' ? 'A priori (Approbation BID avant signature)' : 'A posteriori (Vérification après signature)'}
            />
          </SectionCard>

          <SectionCard title="Données Financières">
            <Field label={`Montant Estimé (${devise})`} value={formatCurrency(ligne.montant_estime_base, devise)} />
          </SectionCard>

          <SectionCard title="Suivi d'Exécution & Attribution">
            <Field label="Date Avis / Publication" value={formatDateFR(ligne.dates_cles.lancement_dao_prevue)} />
            <Field label="Date Signature Contrat" value={formatDateFR(ligne.dates_cles.signature_contrat_prevue)} />
          </SectionCard>
        </div>

        <ModalFooter className="px-6 py-4 border-t border-border shrink-0">
          <ModalClose asChild><Button variant="outline">Fermer</Button></ModalClose>
          {canManage && (
            <Button variant="default" leftIcon={<Pencil className="h-4 w-4" />} onClick={onEdit}>
              Modifier
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
