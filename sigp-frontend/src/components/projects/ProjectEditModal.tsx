import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/forms/Input';
import { Select } from '@/components/ui/forms/Select';
import { Textarea } from '@/components/ui/forms/Textarea';
import {
  Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription,
} from '@/components/ui/overlays/Modal';
import { statusToStatut, type Project, type ProjectSector } from '@/lib/projectAdapter';
import { useProjectsReferenceOptions } from '@/hooks/useProjects';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProjectEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  onSave: (data: Partial<Project>) => void;
  saveError?: string | null;
  isSaving?: boolean;
}

interface FormValues {
  status: string;
  name: string;
  description: string;
  donor: string;
  sector: string;
  country: string;
  managerId: string;
  startDate: string;
  endDate: string;
  dateFinEffective: string;
  dateClotureEffective: string;
  budgetTotal: string;
  devise: string;
}

type FormErrors = Partial<Record<keyof FormValues, string>>;

const EMPTY_FORM: FormValues = {
  status: 'EN_PREPARATION', name: '', description: '',
  donor: '', sector: '', country: '', managerId: '',
  startDate: '', endDate: '', dateFinEffective: '', dateClotureEffective: '',
  budgetTotal: '', devise: 'XOF',
};

function projectToForm(p: Project): FormValues {
  return {
    status: p.statut || statusToStatut(p.status) || 'EN_PREPARATION',
    name: p.name,
    description: p.description,
    donor: p.donor,
    sector: p.sector,
    country: p.country,
    managerId: p.managerId || '',
    startDate: p.startDate,
    endDate: p.endDate,
    dateFinEffective: p.dateFinEffective || '',
    dateClotureEffective: p.dateClotureEffective || '',
    budgetTotal: p.budgetTotal ? String(p.budgetTotal) : '',
    devise: p.devise || 'XOF',
  };
}

// ── FieldRow helper ───────────────────────────────────────────────────────────

function FieldRow({
  id, label, error, required = false, full = false, children,
}: {
  id?: string;
  label: string;
  error?: string;
  required?: boolean;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', full && 'sm:col-span-2')}>
      <label className="text-sm font-medium text-foreground" htmlFor={id}>
        {label}
        {required && <span className="text-destructive ml-0.5" aria-hidden="true"> *</span>}
      </label>
      {children}
      {error && <p className="text-xs text-destructive" role="alert">{error}</p>}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function ProjectEditModal({
  open,
  onOpenChange,
  project,
  onSave,
  saveError,
  isSaving = false,
}: ProjectEditModalProps) {
  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});

  const { data: refOptions, isLoading: isRefLoading } = useProjectsReferenceOptions();
  const { data: usersList, isLoading: isUsersLoading } = useQuery({
    queryKey: ['users', 'list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, nom, prenom, role')
        .is('deleted_at', null)
        .limit(100);
      if (error) throw error;
      return data as Array<{ id: string; nom: string; prenom: string; role?: string }>;
    },
    staleTime: 60_000,
    enabled: open,
  });

  // Sync form when the modal opens or the project changes
  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (project) setValues(projectToForm(project));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, project?.id]);

  function handleChange(k: keyof FormValues, v: string) {
    setValues(prev => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: undefined }));
  }

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!values.name.trim()) errs.name = 'Nom requis';

    // Les champs suivants sont obligatoires uniquement hors phase de préparation.
    const isPreparation = values.status === 'EN_PREPARATION';
    if (!isPreparation) {
      if (!values.startDate) errs.startDate = 'Date de début requise';
      if (!values.endDate) errs.endDate = 'Date de fin requise';
      if (!values.budgetTotal || Number(values.budgetTotal) <= 0) {
        errs.budgetTotal = 'Montant requis (> 0)';
      }
    }
    if (!values.managerId) errs.managerId = 'Chef de projet requis';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;

    const budgetTotal = values.budgetTotal ? Number(values.budgetTotal) : undefined;

    onSave({
      name: values.name.trim(),
      description: values.description.trim(),
      donor: values.donor || undefined,
      sector: (values.sector || undefined) as ProjectSector | undefined,
      country: values.country || undefined,
      managerId: values.managerId || undefined,
      startDate: values.startDate || undefined,
      endDate: values.endDate || undefined,
      dateFinEffective: values.dateFinEffective || undefined,
      dateClotureEffective: values.dateClotureEffective || undefined,
      budgetTotal,
      devise: values.devise,
      statut: values.status,
    });
    // Parent closes the modal after successful save
  }

  const isCloture = values.status === 'CLOTURE';
  const isLocked = isSaving;

  return (
    <Modal open={open} onOpenChange={(v) => { if (isLocked) return; onOpenChange(v); }}>
      <ModalContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <ModalHeader className="px-6 py-4 border-b border-border shrink-0">
          <ModalTitle>Modifier le projet</ModalTitle>
          <ModalDescription>{project?.name ?? 'Formulaire de modification du projet'}</ModalDescription>
        </ModalHeader>

        <div className="relative flex-1 overflow-y-auto px-6 py-5">
          {isLocked && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium text-foreground">Enregistrement en cours…</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldRow id="pe-code" label="Code projet">
              <Input id="pe-code" value={project?.code ?? ''} disabled className="opacity-60 cursor-not-allowed" />
              <p className="text-[11px] text-muted-foreground">Le code est immuable après création.</p>
            </FieldRow>

            <FieldRow id="pe-statut" label="Statut">
              <Select id="pe-statut" value={values.status} onChange={e => handleChange('status', e.target.value)}>
                <option value="EN_PREPARATION">En préparation</option>
                <option value="EN_COURS">En bonne voie</option>
                <option value="SUSPENDU">À risque</option>
                <option value="CLOTURE">Clôturé</option>
                <option value="ANNULE">Annulé</option>
              </Select>
            </FieldRow>

            <FieldRow id="pe-nom" label="Nom du projet" error={errors.name} required full>
              <Input id="pe-nom" value={values.name} onChange={e => handleChange('name', e.target.value)} placeholder="Intitulé complet du projet" />
            </FieldRow>

            <FieldRow id="pe-desc" label="Description" full>
              <Textarea id="pe-desc" value={values.description} onChange={e => handleChange('description', e.target.value)} rows={3} placeholder="Description du projet et objectifs principaux" />
            </FieldRow>

            <FieldRow id="pe-bailleur" label="Bailleur" error={errors.donor}>
              <Select id="pe-bailleur" value={values.donor} onChange={e => handleChange('donor', e.target.value)} disabled={isRefLoading}>
                <option value="">{isRefLoading ? 'Chargement…' : 'Sélectionner un bailleur'}</option>
                {(refOptions?.donors ?? []).map(d => <option key={d} value={d}>{d}</option>)}
              </Select>
            </FieldRow>

            <FieldRow id="pe-secteur" label="Secteur" error={errors.sector}>
              <Select id="pe-secteur" value={values.sector} onChange={e => handleChange('sector', e.target.value)} disabled={isRefLoading}>
                <option value="">{isRefLoading ? 'Chargement…' : 'Sélectionner un secteur'}</option>
                {(refOptions?.sectors ?? []).map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </FieldRow>

            <FieldRow id="pe-pays" label="Pays" error={errors.country}>
              <Select id="pe-pays" value={values.country} onChange={e => handleChange('country', e.target.value)} disabled={isRefLoading}>
                <option value="">{isRefLoading ? 'Chargement…' : 'Sélectionner un pays'}</option>
                {(refOptions?.countries ?? []).map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            </FieldRow>

            <FieldRow id="pe-manager" label="Chef de projet" error={errors.managerId} required>
              <Select id="pe-manager" value={values.managerId} onChange={e => handleChange('managerId', e.target.value)} disabled={isUsersLoading}>
                <option value="">{isUsersLoading ? 'Chargement…' : 'Sélectionner un chef de projet'}</option>
                {(usersList ?? []).map(u => (
                  <option key={u.id} value={u.id}>{u.prenom} {u.nom} ({u.role ?? 'Utilisateur'})</option>
                ))}
              </Select>
            </FieldRow>

            <FieldRow id="pe-debut" label="Date début" error={errors.startDate}>
              <Input id="pe-debut" type="date" value={values.startDate} onChange={e => handleChange('startDate', e.target.value)} />
            </FieldRow>

            <FieldRow id="pe-fin" label="Date fin prévue" error={errors.endDate}>
              <Input id="pe-fin" type="date" value={values.endDate} onChange={e => handleChange('endDate', e.target.value)} />
            </FieldRow>

            {isCloture && (
              <>
                <FieldRow id="pe-fin-eff" label="Date fin effective">
                  <Input id="pe-fin-eff" type="date" value={values.dateFinEffective} onChange={e => handleChange('dateFinEffective', e.target.value)} />
                </FieldRow>
                <FieldRow id="pe-cloture-eff" label="Date de clôture">
                  <Input id="pe-cloture-eff" type="date" value={values.dateClotureEffective} onChange={e => handleChange('dateClotureEffective', e.target.value)} />
                </FieldRow>
              </>
            )}

            <FieldRow id="pe-budget" label="Budget total" error={errors.budgetTotal}>
              <Input id="pe-budget" type="number" min={0} step={1000} value={values.budgetTotal} onChange={e => handleChange('budgetTotal', e.target.value)} placeholder="ex. 5000000" />
            </FieldRow>

            <FieldRow id="pe-devise" label="Devise">
              <Select id="pe-devise" value={values.devise} onChange={e => handleChange('devise', e.target.value)}>
                <option value="XOF">XOF — Franc CFA</option>
                <option value="EUR">EUR — Euro</option>
                <option value="USD">USD — Dollar américain</option>
              </Select>
            </FieldRow>
          </div>

          {saveError && (
            <p className="mt-4 text-xs text-destructive" role="alert">{saveError}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/20 shrink-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLocked}>
            Annuler
          </Button>
          <Button type="button" variant="default" onClick={handleSubmit} disabled={isLocked}>
            {isLocked ? 'Enregistrement…' : 'Enregistrer les modifications'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
