import { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import type { WBS, StatutWBS } from '@/types';
import { useLogframe } from '@/hooks/useLogframe';
import { useOrganisationMembersForPicker } from '@/hooks/useGovernance';
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

const RESPONSABLE_EXTERNE_VALUE = '__externe__';

interface WBSNodeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Partial<WBS>;
  parentId?: string | null;
  projectId: string;
  /** Tous les nœuds WBS du projet — sert à suggérer le code (1, 1.1, 1.2...)
   * et à peupler le sélecteur "Élément Parent" (racines uniquement, cf.
   * alignement WBS/Matrice PTBA : structure à 2 niveaux). */
  existingNodes: WBS[];
  onSubmit: (data: Partial<WBS>) => void;
  isSaving?: boolean;
  error?: string | null;
}

// Suggestion de code — l'utilisateur peut toujours la corriger, le champ
// reste une saisie libre obligatoire (cf. demande d'alignement WBS/PTBA).
function computeSuggestedCode(parentId: string | null | undefined, nodes: WBS[]): string {
  if (!parentId) {
    const rootCount = nodes.filter(n => !n.parent_id).length;
    return String(rootCount + 1);
  }
  const parent = nodes.find(n => n.id === parentId);
  if (!parent) return '';
  const siblingCount = nodes.filter(n => n.parent_id === parentId).length;
  return `${parent.code_wbs}.${siblingCount + 1}`;
}

interface FormState extends Partial<WBS> {
  responsableMode: 'user' | 'externe';
}

export function WBSNodeForm({
  open,
  onOpenChange,
  initialData,
  parentId,
  projectId,
  existingNodes,
  onSubmit,
  isSaving,
  error,
}: WBSNodeFormProps) {
  const { data: logframeData } = useLogframe(projectId);
  const logframeItems = logframeData?.data || [];

  // responsable stocke un UUID réel (users.id) quand responsableMode==='user' ;
  // responsable_externe porte le texte libre sinon — mutuellement exclusifs.
  const { data: orgMembers = [], isLoading: isLoadingMembers } = useOrganisationMembersForPicker(projectId);

  const isEditing = !!initialData?.id;
  // Racines uniquement — un sous-élément (niveau 2) ne peut pas devenir parent
  // (cf. wbs-create/wbs-update, structure à 2 niveaux). On exclut aussi le
  // nœud en cours d'édition de sa propre liste de parents possibles.
  const rootOptions = existingNodes.filter(n => !n.parent_id && n.id !== initialData?.id);

  const getTitle = () => {
    if (isEditing) return "Modifier l'élément WBS";
    if (parentId) return 'Nouvelle sous-activité';
    return 'Nouvelle composante principale';
  };

  const [formData, setFormData] = useState<FormState>({
    titre: '',
    statut: 'NON_COMMENCE',
    budget_alloue: 0,
    progression_physique: 0,
    responsable: '',
    responsable_externe: '',
    responsableMode: 'user',
    logframe_ref_id: '',
    date_debut_prevue: '',
    date_fin_prevue: '',
    code_wbs: '',
    parent_id: null,
  });

  useEffect(() => {
    if (open) {
      const effectiveParentId = initialData?.parent_id ?? parentId ?? null;
      setFormData({
        titre: '',
        statut: 'NON_COMMENCE',
        budget_alloue: 0,
        progression_physique: 0,
        responsable: '',
        responsable_externe: '',
        responsableMode: initialData?.responsable_externe ? 'externe' : 'user',
        logframe_ref_id: '',
        date_debut_prevue: '',
        date_fin_prevue: '',
        code_wbs: initialData?.code_wbs ?? computeSuggestedCode(effectiveParentId, existingNodes),
        parent_id: effectiveParentId,
        ...initialData,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialData, parentId]);

  const isParent = !formData.parent_id;

  const handleParentChange = (newParentId: string) => {
    setFormData(d => ({
      ...d,
      parent_id: newParentId || null,
      code_wbs: computeSuggestedCode(newParentId || null, existingNodes),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      responsable: formData.responsableMode === 'user' ? (formData.responsable || undefined) : undefined,
      responsable_externe: formData.responsableMode === 'externe' ? (formData.responsable_externe?.trim() || undefined) : null,
      parent_id: formData.parent_id ?? undefined,
    });
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

            {/* Structure WBS */}
            <section className="flex flex-col gap-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Structure WBS
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {field(
                  'Code WBS *',
                  <>
                    <Input
                      required
                      disabled={isEditing}
                      value={formData.code_wbs || ''}
                      onChange={e => setFormData(d => ({ ...d, code_wbs: e.target.value }))}
                      placeholder="Ex: 1, 1.1, 1.2..."
                    />
                    {isEditing && (
                      <span className="text-[11px] text-muted-foreground">
                        Non modifiable après création (les sous-éléments existants en dépendent).
                      </span>
                    )}
                  </>
                )}
                {field(
                  'Élément Parent',
                  <>
                    <Select
                      disabled={isEditing}
                      value={formData.parent_id || ''}
                      onChange={e => handleParentChange(e.target.value)}
                    >
                      <option value="">— Aucun (composante racine) —</option>
                      {rootOptions.map(n => (
                        <option key={n.id} value={n.id}>{n.code_wbs} — {n.titre}</option>
                      ))}
                    </Select>
                    <span className="text-[11px] text-muted-foreground">
                      {isEditing
                        ? 'Non modifiable après création.'
                        : "Choisissez une composante racine pour créer un sous-élément (ex: Parent \"1\" → Code \"1.1\"), ou laissez vide pour créer une nouvelle composante racine."}
                    </span>
                  </>,
                  true
                )}
              </div>
            </section>

            {/* Informations générales */}
            <section className="flex flex-col gap-4 pt-5 border-t border-border">
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
                  <>
                    <Select
                      value={formData.responsableMode === 'externe' ? RESPONSABLE_EXTERNE_VALUE : (formData.responsable || '')}
                      onChange={e => {
                        const value = e.target.value;
                        if (value === RESPONSABLE_EXTERNE_VALUE) {
                          setFormData(d => ({ ...d, responsableMode: 'externe' }));
                        } else {
                          setFormData(d => ({ ...d, responsableMode: 'user', responsable: value }));
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
                        value={formData.responsable_externe || ''}
                        onChange={e => setFormData(d => ({ ...d, responsable_externe: e.target.value }))}
                        placeholder="Ex: Entreprise de construction XYZ, Fournisseur Équipement..."
                      />
                    )}
                  </>
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

            {/* Rattachement Cadre Logique (sous-éléments uniquement) */}
            {!isParent && (
              <section className="flex flex-col gap-4 pt-5 border-t border-border">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Rattachement Cadre Logique
                </h3>
                <div className="grid grid-cols-1 gap-4">
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
                            [{item.niveau_intervention}] {item.description}
                          </option>
                        ))}
                    </Select>
                  )}
                </div>
                {/* Ni budget_alloue ni progression_physique ne sont des champs
                    de saisie réels : ce sont des valeurs calculées (rollup)
                    depuis les activités PTBA rattachées via wbs_id — jamais
                    transmises par buildCreatePayload/buildUpdatePayload
                    (cf. useWBS.ts). Un champ de saisie ici aurait été
                    silencieusement ignoré, source de confusion. */}
                <div className="flex items-start gap-3 p-3 bg-muted/30 border border-border rounded-lg">
                  <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="text-xs text-muted-foreground">
                    Le budget alloué et la progression physique de ce sous-élément sont calculés
                    automatiquement à partir des activités PTBA qui lui sont rattachées — non saisissables ici.
                  </p>
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

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive" role="alert">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}
        </SlideOverBody>

        <SlideOverFooter>
          <SlideOverClose asChild>
            <Button variant="outline" type="button">
              Annuler
            </Button>
          </SlideOverClose>
          <Button variant="default" type="submit" form="wbs-node-form" disabled={isSaving}>
            {isSaving ? 'Enregistrement...' : isEditing ? 'Enregistrer les modifications' : 'Créer l\'élément'}
          </Button>
        </SlideOverFooter>
      </SlideOverContent>
    </SlideOver>
  );
}
