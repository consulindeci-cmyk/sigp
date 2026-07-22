import { useState, useEffect } from 'react';
import { Info, AlertCircle } from 'lucide-react';
import type { CadreLogique } from '@/types';
import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/forms/Input';
import { Select } from '@/components/ui/forms/Select';
import { Textarea } from '@/components/ui/forms/Textarea';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalFooter,
  ModalClose,
} from '@/components/ui/overlays/Modal';

interface LogframeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Partial<CadreLogique>;
  parentId?: string | null;
  parentLevel?: string;
  onSubmit: (data: Partial<CadreLogique>) => void;
  isSaving?: boolean;
  error?: string | null;
}

export const NIVEAUX_HIERARCHIE = ['IMPACT', 'OBJECTIF', 'RESULTAT', 'PRODUIT', 'ACTIVITE'] as const;
export type NiveauIntervention = (typeof NIVEAUX_HIERARCHIE)[number];

export const NIVEAUX_LABELS: Record<NiveauIntervention, string> = {
  IMPACT:   'Impact',
  OBJECTIF: 'Objectif',
  RESULTAT: 'Résultat',
  PRODUIT:  'Produit',
  ACTIVITE: 'Activité',
};

export function getNiveauPropose(parentLevel?: string): NiveauIntervention {
  if (parentLevel) {
    const idx = NIVEAUX_HIERARCHIE.indexOf(parentLevel as NiveauIntervention);
    if (idx >= 0 && idx < NIVEAUX_HIERARCHIE.length - 1) return NIVEAUX_HIERARCHIE[idx + 1];
  }
  return 'IMPACT';
}

// Baseline/Cible sont des champs numériques contrôlés (modèle IOV standard :
// valeur + unité) — état local en string pour laisser l'utilisateur taper
// librement, converti en number|null uniquement à la soumission.
interface FormState {
  niveau_intervention: NiveauIntervention;
  description: string;
  indicateur: string;
  valeur_reference: string;
  cible: string;
  unite: string;
  source_verification: string;
  hypotheses: string;
}

function emptyForm(parentLevel?: string): FormState {
  return {
    niveau_intervention: getNiveauPropose(parentLevel),
    description: '',
    indicateur: '',
    valeur_reference: '',
    cible: '',
    unite: '',
    source_verification: '',
    hypotheses: '',
  };
}

function toFormState(parentLevel: string | undefined, initialData?: Partial<CadreLogique>): FormState {
  const base = emptyForm(parentLevel);
  if (!initialData) return base;
  return {
    niveau_intervention: (initialData.niveau_intervention as NiveauIntervention) ?? base.niveau_intervention,
    description:         initialData.description ?? base.description,
    indicateur:          initialData.indicateur ?? base.indicateur,
    valeur_reference:    initialData.valeur_reference != null ? String(initialData.valeur_reference) : '',
    cible:               initialData.cible != null ? String(initialData.cible) : '',
    unite:               initialData.unite ?? '',
    source_verification: initialData.source_verification ?? '',
    hypotheses:          initialData.hypotheses ?? '',
  };
}

export function LogframeForm({
  open,
  onOpenChange,
  initialData,
  parentId,
  parentLevel,
  onSubmit,
  isSaving,
  error,
}: LogframeFormProps) {
  const [formData, setFormData] = useState<FormState>(() => emptyForm(parentLevel));

  const isEditing = !!initialData?.id;

  useEffect(() => {
    if (open) setFormData(toFormState(parentLevel, initialData));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialData]);

  const isActivite = formData.niveau_intervention === 'ACTIVITE';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      niveau_intervention: formData.niveau_intervention,
      description:         formData.description,
      indicateur:          formData.indicateur,
      valeur_reference:    formData.valeur_reference.trim() === '' ? null : Number(formData.valeur_reference),
      cible:               formData.cible.trim() === '' ? null : Number(formData.cible),
      unite:               formData.unite.trim() || null,
      source_verification: formData.source_verification,
      hypotheses:           formData.hypotheses,
      parent_id:            parentId,
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
          <ModalTitle>
            {isEditing ? "Modifier l'élément" : 'Nouvel élément du Cadre Logique'}
          </ModalTitle>
        </ModalHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <form id="logframe-form" onSubmit={handleSubmit} className="flex flex-col gap-6">

            {/* Niveau & Description */}
            <section className="flex flex-col gap-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Niveau et description
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {field(
                  "Niveau d'intervention *",
                  <>
                    <Select
                      required
                      disabled={!!parentId || isEditing}
                      value={formData.niveau_intervention}
                      onChange={e =>
                        setFormData(d => ({
                          ...d,
                          niveau_intervention: e.target.value as NiveauIntervention,
                        }))
                      }
                    >
                      {NIVEAUX_HIERARCHIE.map(n => (
                        <option key={n} value={n}>{NIVEAUX_LABELS[n]}</option>
                      ))}
                    </Select>
                    {(parentId || isEditing) && (
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                        <Info className="h-3 w-3 shrink-0" aria-hidden="true" />
                        {isEditing
                          ? 'Non modifiable après création (la hiérarchie des éléments existants en dépend).'
                          : 'Niveau défini automatiquement par rapport au parent.'}
                      </span>
                    )}
                  </>,
                  true
                )}
                {field(
                  'Description *',
                  <Textarea
                    required
                    rows={3}
                    value={formData.description}
                    onChange={e => setFormData(d => ({ ...d, description: e.target.value }))}
                    placeholder={
                      isActivite
                        ? "Description de l'activité..."
                        : "Logique d'intervention / intitulé de l'élément..."
                    }
                    autoFocus
                  />,
                  true
                )}
              </div>
            </section>

            {/* Mesure & Vérification (non activité uniquement) */}
            {!isActivite && (
              <section className="flex flex-col gap-4 pt-5 border-t border-border">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Mesure & Vérification
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {field(
                    'Indicateur (IOV)',
                    <Textarea
                      rows={2}
                      value={formData.indicateur}
                      onChange={e => setFormData(d => ({ ...d, indicateur: e.target.value }))}
                      placeholder="Indicateur Objectivement Vérifiable..."
                    />,
                    true
                  )}
                  {field(
                    'Baseline (Référence)',
                    <Input
                      type="number"
                      step="any"
                      value={formData.valeur_reference}
                      onChange={e => setFormData(d => ({ ...d, valeur_reference: e.target.value }))}
                      placeholder="Ex: 0"
                    />
                  )}
                  {field(
                    'Cible',
                    <Input
                      type="number"
                      step="any"
                      value={formData.cible}
                      onChange={e => setFormData(d => ({ ...d, cible: e.target.value }))}
                      placeholder="Ex: 80"
                    />
                  )}
                  {field(
                    'Unité',
                    <Input
                      type="text"
                      value={formData.unite}
                      onChange={e => setFormData(d => ({ ...d, unite: e.target.value }))}
                      placeholder="%, bénéficiaires, km…"
                    />
                  )}
                  {field(
                    'Source de vérification',
                    <Input
                      type="text"
                      value={formData.source_verification}
                      onChange={e =>
                        setFormData(d => ({ ...d, source_verification: e.target.value }))
                      }
                      placeholder="Rapport, enquête, registre…"
                    />
                  )}
                </div>
              </section>
            )}

            {/* Hypothèses */}
            <section className={`flex flex-col gap-4 ${!isActivite ? 'pt-5 border-t border-border' : ''}`}>
              {field(
                'Hypothèses / Risques',
                <Textarea
                  rows={2}
                  value={formData.hypotheses}
                  onChange={e => setFormData(d => ({ ...d, hypotheses: e.target.value }))}
                  placeholder="Conditions supposées, risques potentiels…"
                />
              )}
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
          <Button variant="default" type="submit" form="logframe-form" disabled={isSaving}>
            {isSaving ? 'Enregistrement...' : isEditing ? 'Enregistrer les modifications' : "Créer l'élément"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
