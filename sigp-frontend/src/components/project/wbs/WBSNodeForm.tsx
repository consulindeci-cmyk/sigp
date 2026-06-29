import { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import type { WBS, StatutWBS } from '@/types';
import { useLogframe } from '@/hooks/useLogframe';
import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/forms/Input';
import { Select } from '@/components/ui/forms/Select';
import {
  SlideOver,
  SlideOverContent,
  SlideOverHeader,
  SlideOverTitle,
  SlideOverBody,
  SlideOverFooter,
  SlideOverClose,
} from '@/components/ui/overlays/SlideOver';

interface WBSNodeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Partial<WBS>;
  parentId?: string | null;
  onSubmit: (data: Partial<WBS>) => void;
}

export function WBSNodeForm({
  open,
  onOpenChange,
  initialData,
  parentId,
  onSubmit,
}: WBSNodeFormProps) {
  const { data: logframeData } = useLogframe('proj-1');
  const logframeItems = logframeData?.data || [];

  const isParent = !parentId && !initialData?.parent_id;
  const isEditing = !!initialData?.id;

  const getTitle = () => {
    if (isEditing) return "Modifier l'élément WBS";
    if (parentId) return 'Nouvelle sous-activité';
    return 'Nouvelle composante principale';
  };

  const [formData, setFormData] = useState<Partial<WBS>>({
    titre: '',
    statut: 'NON_COMMENCE',
    budget_alloue: 0,
    progression_physique: 0,
    responsable: '',
    logframe_ref_id: '',
    date_debut_prevue: '',
    date_fin_prevue: '',
  });

  useEffect(() => {
    if (open) {
      setFormData({
        titre: '',
        statut: 'NON_COMMENCE',
        budget_alloue: 0,
        progression_physique: 0,
        responsable: '',
        logframe_ref_id: '',
        date_debut_prevue: '',
        date_fin_prevue: '',
        ...initialData,
      });
    }
  }, [open, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, parent_id: parentId ?? undefined });
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
          <SlideOverTitle>{getTitle()}</SlideOverTitle>
          <SlideOverClose asChild>
            <Button variant="ghost" size="sm" aria-label="Fermer">
              <X className="h-4 w-4" />
            </Button>
          </SlideOverClose>
        </SlideOverHeader>

        <SlideOverBody>
          <form id="wbs-node-form" onSubmit={handleSubmit} className="flex flex-col gap-6">

            {/* Informations générales */}
            <section className="flex flex-col gap-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Informations générales
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {field(
                  'Titre de l\'élément *',
                  <Input
                    required
                    type="text"
                    value={formData.titre || ''}
                    onChange={e => setFormData(d => ({ ...d, titre: e.target.value }))}
                    placeholder="Ex: Construction du bâtiment principal"
                    autoFocus
                  />,
                  true
                )}
                {field(
                  'Responsable',
                  <Input
                    type="text"
                    value={formData.responsable || ''}
                    onChange={e => setFormData(d => ({ ...d, responsable: e.target.value }))}
                    placeholder="Nom ou département"
                  />
                )}
                {field(
                  'Statut',
                  <Select
                    value={formData.statut}
                    onChange={e => setFormData(d => ({ ...d, statut: e.target.value as StatutWBS }))}
                  >
                    <option value="NON_COMMENCE">Non commencé</option>
                    <option value="EN_COURS">En cours</option>
                    <option value="TERMINE">Terminé</option>
                    <option value="EN_RETARD">En retard</option>
                    <option value="ANNULE">Annulé</option>
                  </Select>
                )}
                {field(
                  'Date de début prévue',
                  <Input
                    type="date"
                    value={formData.date_debut_prevue || ''}
                    onChange={e => setFormData(d => ({ ...d, date_debut_prevue: e.target.value }))}
                  />
                )}
                {field(
                  'Date de fin prévue',
                  <Input
                    type="date"
                    value={formData.date_fin_prevue || ''}
                    onChange={e => setFormData(d => ({ ...d, date_fin_prevue: e.target.value }))}
                  />
                )}
              </div>
            </section>

            {/* Budget & Progression (sous-éléments uniquement) */}
            {!isParent && (
              <section className="flex flex-col gap-4 pt-5 border-t border-border">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Budget & Progression
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {field(
                    'Budget alloué (XOF)',
                    <Input
                      type="number"
                      min={0}
                      value={formData.budget_alloue || ''}
                      onChange={e => setFormData(d => ({ ...d, budget_alloue: Number(e.target.value) }))}
                      placeholder="0"
                    />
                  )}
                  {field(
                    'Progression physique (%)',
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={formData.progression_physique ?? 0}
                      onChange={e =>
                        setFormData(d => ({ ...d, progression_physique: Number(e.target.value) }))
                      }
                    />
                  )}
                  {field(
                    'Liaison Cadre Logique (Activité / Produit)',
                    <Select
                      value={formData.logframe_ref_id || ''}
                      onChange={e => setFormData(d => ({ ...d, logframe_ref_id: e.target.value }))}
                    >
                      <option value="">— Aucune liaison —</option>
                      {logframeItems
                        .filter(
                          item =>
                            item.niveau_intervention === 'ACTIVITE' ||
                            item.niveau_intervention === 'PRODUIT'
                        )
                        .map(item => (
                          <option key={item.id} value={item.id}>
                            [{item.niveau_intervention}] {item.indicateur}
                          </option>
                        ))}
                    </Select>,
                    true
                  )}
                </div>
              </section>
            )}

            {/* Note composante principale */}
            {isParent && (
              <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-sm font-bold text-foreground">Calcul automatique</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Le budget et la progression de cette composante seront calculés
                    automatiquement depuis ses sous-activités.
                  </p>
                </div>
              </div>
            )}

          </form>
        </SlideOverBody>

        <SlideOverFooter>
          <SlideOverClose asChild>
            <Button variant="outline" type="button">
              Annuler
            </Button>
          </SlideOverClose>
          <Button variant="default" type="submit" form="wbs-node-form">
            {isEditing ? 'Enregistrer les modifications' : 'Créer l\'élément'}
          </Button>
        </SlideOverFooter>
      </SlideOverContent>
    </SlideOver>
  );
}
