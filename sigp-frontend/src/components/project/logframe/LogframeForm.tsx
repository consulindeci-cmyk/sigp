import { useState, useEffect } from 'react';
import { X, Info } from 'lucide-react';
import type { CadreLogique } from '@/types';
import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/forms/Input';
import { Select } from '@/components/ui/forms/Select';
import { Textarea } from '@/components/ui/forms/Textarea';
import {
  SlideOver,
  SlideOverContent,
  SlideOverHeader,
  SlideOverTitle,
  SlideOverBody,
  SlideOverFooter,
  SlideOverClose,
} from '@/components/ui/overlays/SlideOver';

interface LogframeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Partial<CadreLogique>;
  parentId?: string | null;
  parentLevel?: string;
  onSubmit: (data: Partial<CadreLogique>) => void;
}

const NIVEAUX_HIERARCHIE = ['IMPACT', 'OBJECTIF', 'RESULTAT', 'PRODUIT', 'ACTIVITE'] as const;
type NiveauIntervention = (typeof NIVEAUX_HIERARCHIE)[number];

const NIVEAUX_LABELS: Record<NiveauIntervention, string> = {
  IMPACT:   'Impact',
  OBJECTIF: 'Objectif',
  RESULTAT: 'Résultat',
  PRODUIT:  'Produit',
  ACTIVITE: 'Activité',
};

function getNiveauPropose(parentLevel?: string): NiveauIntervention {
  if (parentLevel) {
    const idx = NIVEAUX_HIERARCHIE.indexOf(parentLevel as NiveauIntervention);
    if (idx >= 0 && idx < NIVEAUX_HIERARCHIE.length - 1) return NIVEAUX_HIERARCHIE[idx + 1];
  }
  return 'IMPACT';
}

export function LogframeForm({
  open,
  onOpenChange,
  initialData,
  parentId,
  parentLevel,
  onSubmit,
}: LogframeFormProps) {
  const [formData, setFormData] = useState<Partial<CadreLogique>>({
    niveau_intervention: getNiveauPropose(parentLevel),
    indicateur: '',
    valeur_reference: '',
    cible: '',
    source_verification: '',
    hypotheses: '',
  });

  useEffect(() => {
    if (open) {
      setFormData({
        niveau_intervention: getNiveauPropose(parentLevel),
        indicateur: '',
        valeur_reference: '',
        cible: '',
        source_verification: '',
        hypotheses: '',
        ...initialData,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const isActivite = formData.niveau_intervention === 'ACTIVITE';
  const isEditing  = !!initialData?.id;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, parent_id: parentId });
    onOpenChange(false);
  };

  const field = (label: string, children: React.ReactNode, span?: boolean) => (
    <div className={`flex flex-col gap-1.5 ${span ? 'md:col-span-2' : ''}`}>
      <label className="text-sm font-semibold text-foreground">{label}</label>
      {children}
    </div>
  );

  return (
    <SlideOver open={open} onOpenChange={onOpenChange}>
      <SlideOverContent>
        <SlideOverHeader>
          <SlideOverTitle>
            {isEditing ? "Modifier l'élément" : 'Nouvel élément du Cadre Logique'}
          </SlideOverTitle>
          <SlideOverClose asChild>
            <Button variant="ghost" size="sm" aria-label="Fermer">
              <X className="h-4 w-4" />
            </Button>
          </SlideOverClose>
        </SlideOverHeader>

        <SlideOverBody>
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
                      disabled={!!parentId}
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
                    {parentId && (
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                        <Info className="h-3 w-3 shrink-0" aria-hidden="true" />
                        Niveau défini automatiquement par rapport au parent.
                      </span>
                    )}
                  </>,
                  true
                )}
                {field(
                  'Description / Indicateur (IOV) *',
                  <Textarea
                    required
                    rows={3}
                    value={formData.indicateur || ''}
                    onChange={e => setFormData(d => ({ ...d, indicateur: e.target.value }))}
                    placeholder={
                      isActivite
                        ? "Description de l'activité..."
                        : 'Objectif objectivement vérifiable...'
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
                    'Baseline (Référence)',
                    <Input
                      type="text"
                      value={formData.valeur_reference || ''}
                      onChange={e => setFormData(d => ({ ...d, valeur_reference: e.target.value }))}
                      placeholder="Ex: 0%, 10 unités…"
                    />
                  )}
                  {field(
                    'Cible',
                    <Input
                      type="text"
                      value={formData.cible || ''}
                      onChange={e => setFormData(d => ({ ...d, cible: e.target.value }))}
                      placeholder="Ex: 80%, 500 bénéficiaires…"
                    />
                  )}
                  {field(
                    'Source de vérification',
                    <Input
                      type="text"
                      value={formData.source_verification || ''}
                      onChange={e =>
                        setFormData(d => ({ ...d, source_verification: e.target.value }))
                      }
                      placeholder="Rapport, enquête, registre…"
                    />,
                    true
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
                  value={formData.hypotheses || ''}
                  onChange={e => setFormData(d => ({ ...d, hypotheses: e.target.value }))}
                  placeholder="Conditions supposées, risques potentiels…"
                />
              )}
            </section>

          </form>
        </SlideOverBody>

        <SlideOverFooter>
          <SlideOverClose asChild>
            <Button variant="outline" type="button">Annuler</Button>
          </SlideOverClose>
          <Button variant="default" type="submit" form="logframe-form">
            {isEditing ? 'Enregistrer les modifications' : "Créer l'élément"}
          </Button>
        </SlideOverFooter>
      </SlideOverContent>
    </SlideOver>
  );
}
