import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import type { PtbaActiviteDto } from '@/hooks/usePTBA';
import { useWBS } from '@/hooks/useWBS';
import { useLogframe } from '@/hooks/useLogframe';
import { useOrganisationMembersForPicker } from '@/hooks/useGovernance';
import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/forms/Input';
import { Select } from '@/components/ui/forms/Select';
import { Textarea } from '@/components/ui/forms/Textarea';
import { Checkbox } from '@/components/ui/forms/Checkbox';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalFooter,
  ModalClose,
} from '@/components/ui/overlays/Modal';

export interface PTBAActiviteFormPayload {
  code?: string;
  libelle: string;
  description?: string;
  statut: string;
  annee: number;
  /** Une activité peut être cochée sur plusieurs trimestres (ex: Q1+Q2+Q3) —
   * le montant est alors ventilé également sur tous les mois concernés. */
  trimestres: number[];
  wbsId?: string;
  logframeIndicatorId?: string;
  /** Toujours envoyés ensemble (l'un explicitement null quand l'autre est
   * choisi) pour garantir l'exclusivité mutuelle utilisateur/externe. */
  responsableId?: string | null;
  responsableExterne?: string | null;
  dateDebutPrevue?: string;
  dateFinPrevue?: string;
  montantPrevu?: number;
  montantRealise?: number;
  tauxRealisation?: number;
}

const RESPONSABLE_EXTERNE_VALUE = '__externe__';

interface PTBAActiviteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  annee: number;
  initialData?: PtbaActiviteDto | null;
  onSubmit: (payload: PTBAActiviteFormPayload) => void;
  isSaving?: boolean;
  error?: string | null;
}

interface FormState {
  code: string;
  libelle: string;
  description: string;
  statut: string;
  annee: string;
  trimestres: number[];
  wbsId: string;
  logframeIndicatorId: string;
  responsableMode: 'user' | 'externe';
  responsableId: string;
  responsableExterne: string;
  dateDebutPrevue: string;
  dateFinPrevue: string;
  montantPrevu: string;
  montantRealise: string;
  tauxRealisation: string;
}

function emptyForm(annee: number): FormState {
  return {
    code: '', libelle: '', description: '', statut: 'NON_DEMARRE',
    annee: String(annee), trimestres: [1], wbsId: '', logframeIndicatorId: '',
    responsableMode: 'user', responsableId: '', responsableExterne: '',
    dateDebutPrevue: '', dateFinPrevue: '',
    montantPrevu: '', montantRealise: '', tauxRealisation: '',
  };
}

function toFormState(annee: number, initialData?: PtbaActiviteDto | null): FormState {
  const base = emptyForm(annee);
  if (!initialData) return base;
  return {
    code: initialData.code,
    libelle: initialData.libelle,
    description: initialData.description ?? '',
    statut: initialData.statut,
    annee: String(initialData.annee),
    trimestres: initialData.trimestres,
    wbsId: initialData.wbsId ?? '',
    logframeIndicatorId: initialData.logframeIndicatorId ?? '',
    responsableMode: initialData.responsableExterne ? 'externe' : 'user',
    responsableId: initialData.responsableId ?? '',
    responsableExterne: initialData.responsableExterne ?? '',
    dateDebutPrevue: initialData.dateDebutPrevue ?? '',
    dateFinPrevue: initialData.dateFinPrevue ?? '',
    montantPrevu: initialData.montantPrevu != null ? String(initialData.montantPrevu) : '',
    montantRealise: initialData.montantRealise != null ? String(initialData.montantRealise) : '',
    tauxRealisation: initialData.tauxRealisation != null ? String(initialData.tauxRealisation) : '',
  };
}

export function PTBAActiviteForm({
  open,
  onOpenChange,
  projectId,
  annee,
  initialData,
  onSubmit,
  isSaving,
  error,
}: PTBAActiviteFormProps) {
  const [formData, setFormData] = useState<FormState>(() => emptyForm(annee));
  const isEditing = !!initialData?.id;

  const { data: wbsData } = useWBS(projectId);
  const wbsNodes = wbsData?.data ?? [];

  // logframe_ref_id d'une activité PTBA pointe vers logframe_indicators.id
  // (l'IOV), pas vers logframe_objectives.id (contrairement à wbs_nodes.
  // objective_id) — cf. audit Cadre Logique. Seuls les éléments ayant un
  // indicateur réellement défini (indicator_id renseigné) sont proposés ici.
  const { data: logframeData } = useLogframe(projectId);
  const indicatorOptions = (logframeData?.data ?? []).filter(i => !!i.indicator_id);

  const { data: orgMembers = [], isLoading: isLoadingMembers } = useOrganisationMembersForPicker(projectId);

  useEffect(() => {
    if (open) setFormData(toFormState(annee, initialData));
  }, [open, annee, initialData]);

  const toggleTrimestre = (t: number) => {
    setFormData(d => ({
      ...d,
      trimestres: d.trimestres.includes(t)
        ? d.trimestres.filter(x => x !== t)
        : [...d.trimestres, t].sort((a, b) => a - b),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.trimestres.length === 0) return;
    onSubmit({
      code: isEditing ? undefined : formData.code.trim(),
      libelle: formData.libelle.trim(),
      description: formData.description.trim() || undefined,
      statut: formData.statut,
      annee: Number(formData.annee),
      trimestres: formData.trimestres,
      wbsId: formData.wbsId || undefined,
      logframeIndicatorId: formData.logframeIndicatorId || undefined,
      // Toujours les deux, explicitement — passer d'un mode à l'autre doit
      // vider l'ancien choix, pas juste omettre le nouveau.
      responsableId: formData.responsableMode === 'user' ? (formData.responsableId || null) : null,
      responsableExterne: formData.responsableMode === 'externe' ? (formData.responsableExterne.trim() || null) : null,
      dateDebutPrevue: formData.dateDebutPrevue || undefined,
      dateFinPrevue: formData.dateFinPrevue || undefined,
      montantPrevu: formData.montantPrevu.trim() === '' ? undefined : Number(formData.montantPrevu),
      montantRealise: formData.montantRealise.trim() === '' ? undefined : Number(formData.montantRealise),
      tauxRealisation: formData.tauxRealisation.trim() === '' ? undefined : Number(formData.tauxRealisation),
    });
  };

  const field = (label: string, children: React.ReactNode, span?: boolean) => (
    <div className={`flex flex-col gap-1.5 ${span ? 'md:col-span-2' : ''}`}>
      <label className="text-sm font-semibold text-foreground">{label}</label>
      {children}
    </div>
  );

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <ModalHeader className="px-6 py-4 border-b border-border shrink-0 space-y-1">
          <ModalTitle>{isEditing ? "Modifier l'activité PTBA" : 'Nouvelle activité PTBA'}</ModalTitle>
        </ModalHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <form id="ptba-activite-form" onSubmit={handleSubmit} className="flex flex-col gap-6">

            <section className="flex flex-col gap-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Informations générales
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {field(
                  'Code *',
                  <Input
                    required
                    disabled={isEditing}
                    value={formData.code}
                    onChange={e => setFormData(d => ({ ...d, code: e.target.value }))}
                    placeholder="Ex: ACT-01"
                  />
                )}
                {field(
                  'Libellé *',
                  <Input
                    required
                    autoFocus
                    value={formData.libelle}
                    onChange={e => setFormData(d => ({ ...d, libelle: e.target.value }))}
                    placeholder="Intitulé de l'activité"
                  />
                )}
                {field(
                  'Description',
                  <Textarea
                    rows={2}
                    value={formData.description}
                    onChange={e => setFormData(d => ({ ...d, description: e.target.value }))}
                    placeholder="Détails, cibles physiques..."
                  />,
                  true
                )}
                {field(
                  'Année',
                  <>
                    <Input type="number" value={formData.annee} disabled />
                    <p className="text-[11px] text-muted-foreground">
                      Toujours celle actuellement affichée dans le PTBA — non modifiable ici pour éviter
                      qu'une activité ne devienne invisible dans une autre année (cf. Matrice Financière/Calendrier/Gantt).
                    </p>
                  </>
                )}
                {field(
                  'Trimestre(s) *',
                  <>
                    <div className="flex items-center gap-4 h-9">
                      {[1, 2, 3, 4].map(t => (
                        <label key={t} className="flex items-center gap-1.5 cursor-pointer select-none">
                          <Checkbox
                            checked={formData.trimestres.includes(t)}
                            onCheckedChange={() => toggleTrimestre(t)}
                          />
                          <span className="text-sm text-foreground">Q{t}</span>
                        </label>
                      ))}
                    </div>
                    {formData.trimestres.length === 0 && (
                      <span className="flex items-center gap-1.5 text-xs text-destructive mt-0.5">
                        <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
                        Sélectionnez au moins un trimestre.
                      </span>
                    )}
                    {formData.trimestres.length > 1 && (
                      <span className="text-[11px] text-muted-foreground mt-0.5">
                        Le montant prévu sera réparti également sur les {formData.trimestres.length} trimestres cochés.
                      </span>
                    )}
                  </>
                )}
                {field(
                  'Statut',
                  <Select
                    value={formData.statut}
                    onChange={e => setFormData(d => ({ ...d, statut: e.target.value }))}
                  >
                    <option value="NON_DEMARRE">Non démarré</option>
                    <option value="EN_COURS">En cours</option>
                    <option value="TERMINE">Terminé</option>
                    <option value="EN_RETARD">En retard</option>
                    <option value="ANNULE">Annulé</option>
                  </Select>
                )}
                {field(
                  'Responsable',
                  <>
                    <Select
                      value={formData.responsableMode === 'externe' ? RESPONSABLE_EXTERNE_VALUE : formData.responsableId}
                      onChange={e => {
                        const value = e.target.value;
                        if (value === RESPONSABLE_EXTERNE_VALUE) {
                          setFormData(d => ({ ...d, responsableMode: 'externe' }));
                        } else {
                          setFormData(d => ({ ...d, responsableMode: 'user', responsableId: value }));
                        }
                      }}
                      disabled={isLoadingMembers}
                    >
                      <option value="">{isLoadingMembers ? 'Chargement…' : 'Sélectionner une personne'}</option>
                      {orgMembers.map(m => (
                        <option key={m.id} value={m.id}>{m.displayName}</option>
                      ))}
                      <option value={RESPONSABLE_EXTERNE_VALUE}>Externe / texte libre…</option>
                    </Select>
                    {formData.responsableMode === 'externe' && (
                      <Input
                        className="mt-2"
                        value={formData.responsableExterne}
                        onChange={e => setFormData(d => ({ ...d, responsableExterne: e.target.value }))}
                        placeholder="Ex: Entreprise de construction XYZ, Fournisseur Équipement..."
                      />
                    )}
                  </>
                )}
              </div>
            </section>

            <section className="flex flex-col gap-4 pt-5 border-t border-border">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Rattachements
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {field(
                  'Nœud WBS',
                  <Select
                    value={formData.wbsId}
                    onChange={e => setFormData(d => ({ ...d, wbsId: e.target.value }))}
                  >
                    <option value="">— Aucune liaison —</option>
                    {wbsNodes.map(n => (
                      <option key={n.id} value={n.id}>{n.code_wbs} — {n.titre}</option>
                    ))}
                  </Select>
                )}
                {field(
                  'Indicateur (Cadre Logique)',
                  <Select
                    value={formData.logframeIndicatorId}
                    onChange={e => setFormData(d => ({ ...d, logframeIndicatorId: e.target.value }))}
                  >
                    <option value="">— Aucune liaison —</option>
                    {indicatorOptions.map(i => (
                      <option key={i.indicator_id!} value={i.indicator_id!}>
                        [{i.niveau_intervention}] {i.description} — {i.indicateur}
                      </option>
                    ))}
                  </Select>
                )}
              </div>
            </section>

            <section className="flex flex-col gap-4 pt-5 border-t border-border">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Planification & Réalisation
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {field(
                  'Date de début prévue',
                  <Input
                    type="date"
                    value={formData.dateDebutPrevue}
                    onChange={e => setFormData(d => ({ ...d, dateDebutPrevue: e.target.value }))}
                  />
                )}
                {field(
                  'Date de fin prévue',
                  <Input
                    type="date"
                    value={formData.dateFinPrevue}
                    onChange={e => setFormData(d => ({ ...d, dateFinPrevue: e.target.value }))}
                  />
                )}
                {field(
                  'Montant prévu',
                  <Input
                    type="number"
                    min={0}
                    value={formData.montantPrevu}
                    onChange={e => setFormData(d => ({ ...d, montantPrevu: e.target.value }))}
                    placeholder="0"
                  />
                )}
                {field(
                  'Montant réalisé',
                  <Input
                    type="number"
                    min={0}
                    value={formData.montantRealise}
                    onChange={e => setFormData(d => ({ ...d, montantRealise: e.target.value }))}
                    placeholder="0"
                  />
                )}
                {field(
                  'Taux de réalisation (%)',
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={formData.tauxRealisation}
                    onChange={e => setFormData(d => ({ ...d, tauxRealisation: e.target.value }))}
                    placeholder="0"
                  />
                )}
              </div>
            </section>
          </form>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive" role="alert">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <ModalFooter className="px-6 py-4 border-t border-border bg-muted/20 shrink-0">
          <ModalClose asChild>
            <Button variant="outline" type="button">Annuler</Button>
          </ModalClose>
          <Button variant="default" type="submit" form="ptba-activite-form" disabled={isSaving || formData.trimestres.length === 0}>
            {isSaving ? 'Enregistrement...' : isEditing ? 'Enregistrer les modifications' : "Créer l'activité"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
