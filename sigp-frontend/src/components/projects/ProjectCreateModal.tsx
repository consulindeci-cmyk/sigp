import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, Loader2, Plus, Trash2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/forms/Input';
import { Select } from '@/components/ui/forms/Select';
import { Textarea } from '@/components/ui/forms/Textarea';
import {
  Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription,
} from '@/components/ui/overlays/Modal';
import { useOrganisation } from '@/hooks/useOrganisation';
import { useCreateProjectWizard, ProjectWizardStepError } from '@/hooks/useProjects';

// ─────────────────────────────────────────────────────────────────────────────
// Types locaux
// ─────────────────────────────────────────────────────────────────────────────

export interface ProjectCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProgrammeId?: string;
}

interface InfosState {
  code: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  managerId: string;
}

interface SourceRow { tempId: string; nom: string; montant: string }

const EMPTY_INFOS: InfosState = {
  code: '', name: '', description: '', startDate: '', endDate: '', managerId: '',
};

function uid(): string {
  return `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers UI
// ─────────────────────────────────────────────────────────────────────────────

function FieldRow({
  id, label, error, required = false, full = false, children,
}: {
  id?: string; label: string; error?: string; required?: boolean; full?: boolean; children: React.ReactNode;
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

function StepDot({ index, label, active, done }: { index: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1.5 flex-1">
      <div
        className={cn(
          'h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2 shrink-0 transition-colors',
          done ? 'bg-primary border-primary text-primary-foreground'
            : active ? 'border-primary text-primary bg-primary/10'
              : 'border-border text-muted-foreground',
        )}
      >
        {done ? <Check className="h-4 w-4" /> : index}
      </div>
      <span className={cn('text-[11px] font-medium text-center', active || done ? 'text-foreground' : 'text-muted-foreground')}>
        {label}
      </span>
    </div>
  );
}

function RecapSection({
  title, onEdit, children,
}: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <Button type="button" variant="ghost" size="sm" onClick={onEdit}>Modifier</Button>
      </div>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant
// ─────────────────────────────────────────────────────────────────────────────

export function ProjectCreateModal({ open, onOpenChange, defaultProgrammeId }: ProjectCreateModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [infos, setInfos] = useState<InfosState>(EMPTY_INFOS);
  const [devise, setDevise] = useState('XOF');
  const [objectifGlobal, setObjectifGlobal] = useState('');
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof InfosState, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: organisation } = useOrganisation();
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

  const wizard = useCreateProjectWizard();

  // Réinitialisation à chaque ouverture — devise par défaut = devise_defaut
  // de l'organisation (disponible une fois useOrganisation() chargé).
  useEffect(() => {
    if (open) {
      setStep(1);
      setInfos(EMPTY_INFOS);
      setObjectifGlobal('');
      setSources([]);
      setErrors({});
      setSubmitError(null);
      setDevise(organisation?.deviseDefaut || 'XOF');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (open && organisation?.deviseDefaut) setDevise(organisation.deviseDefaut);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organisation?.deviseDefaut]);

  function setInfo<K extends keyof InfosState>(k: K, v: string) {
    setInfos(prev => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: undefined }));
  }

  // ── Étape 2 : sources de financement ─────────────────────────────────────
  function addSource() {
    setSources(prev => [...prev, { tempId: uid(), nom: '', montant: '' }]);
  }
  function updateSource(tempId: string, patch: Partial<SourceRow>) {
    setSources(prev => prev.map(s => s.tempId === tempId ? { ...s, ...patch } : s));
  }
  function removeSource(tempId: string) {
    setSources(prev => prev.filter(s => s.tempId !== tempId));
  }
  const totalSources = useMemo(
    () => sources.reduce((s, r) => s + (Number(r.montant) || 0), 0),
    [sources],
  );

  const selectedManagerLabel = useMemo(() => {
    if (!infos.managerId) return '';
    const u = (usersList ?? []).find(u => u.id === infos.managerId);
    return u ? `${u.prenom} ${u.nom}` : '';
  }, [infos.managerId, usersList]);

  // ── Validation par étape ─────────────────────────────────────────────────
  // Seules les informations essentielles (Étape 1) sont obligatoires — le
  // Responsable (managerId), comme tout le reste, reste facultatif à la
  // création (déjà optionnel côté projects-create ; assignable plus tard).
  function validateStep1(): boolean {
    const errs: Partial<Record<keyof InfosState, string>> = {};
    if (!infos.code.trim()) errs.code = 'Code requis';
    if (!infos.name.trim()) errs.name = 'Nom requis';
    if (infos.startDate && infos.endDate && infos.endDate < infos.startDate) {
      errs.endDate = 'Date de fin antérieure à la date de début';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  const sourcesValid = sources.every(s => s.nom.trim() && Number(s.montant) > 0);
  // Sans programme, projects-create rejette systématiquement la création
  // (programmeId obligatoire) — mieux vaut bloquer clairement ici avec un
  // message explicite que laisser échouer l'appel serveur sans contexte.
  const hasProgramme = !!defaultProgrammeId;
  const canFinish = sourcesValid && hasProgramme && !wizard.isPending;

  function goNext() {
    if (step === 1) {
      if (!validateStep1()) return;
      setStep(2);
    } else if (step === 2) {
      if (!sourcesValid) return;
      setStep(3);
    }
  }
  function goBack() {
    if (step > 1) setStep((s) => (s - 1) as 1 | 2);
  }

  // "Passer cette étape" — Étape 2 est 100% optionnelle : on efface toute
  // saisie partielle (objectif, sources) plutôt que de la conserver
  // silencieusement, pour éviter qu'une ligne incomplète (ex : source avec
  // un nom mais sans montant) ne soit envoyée ambiguë à la création — cf.
  // règle d'or : aucune donnée de cadrage/financement ne doit être créée si
  // l'utilisateur n'a pas explicitement validé cette étape.
  function skipStep2() {
    setObjectifGlobal('');
    setSources([]);
    setStep(3);
  }

  async function handleFinish() {
    if (!canFinish) return;
    setSubmitError(null);
    try {
      await wizard.mutateAsync({
        programmeId: defaultProgrammeId ?? '',
        code: infos.code.trim(),
        nom: infos.name.trim(),
        description: infos.description.trim() || undefined,
        dateDebut: infos.startDate || undefined,
        dateFinPrevue: infos.endDate || undefined,
        managerId: infos.managerId || undefined,
        objectifGlobalLibelle: objectifGlobal.trim() || undefined,
        devise,
        fundingSources: sources.map(s => ({ nom: s.nom.trim(), montant: Number(s.montant) })),
      });
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ProjectWizardStepError) {
        const STEP_LABELS: Record<string, string> = {
          objectif: "l'objectif global (Cadre Logique)",
          financement: 'les sources de financement',
        };
        setSubmitError(
          `Le projet a bien été créé, mais l'enregistrement de ${STEP_LABELS[err.step]} a échoué : ${err.message}. ` +
          `Vous pouvez compléter cette partie depuis les onglets du projet.`,
        );
      } else {
        setSubmitError(err instanceof Error ? err.message : 'Erreur lors de la création du projet.');
      }
    }
  }

  const isLocked = wizard.isPending;

  return (
    <Modal open={open} onOpenChange={(v) => { if (isLocked) return; onOpenChange(v); }}>
      <ModalContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <ModalHeader className="px-6 py-4 border-b border-border shrink-0 space-y-3">
          <div>
            <ModalTitle>Nouveau projet</ModalTitle>
            <ModalDescription>
              Création guidée en 3 étapes — informations essentielles, cadre &amp; financement (optionnel), récapitulatif.
            </ModalDescription>
          </div>
          <div className="flex items-start gap-2">
            <StepDot index={1} label="Informations" active={step === 1} done={step > 1} />
            <div className={cn('h-0.5 flex-1 mt-4 rounded', step > 1 ? 'bg-primary' : 'bg-border')} />
            <StepDot index={2} label="Cadre & Financement" active={step === 2} done={step > 2} />
            <div className={cn('h-0.5 flex-1 mt-4 rounded', step > 2 ? 'bg-primary' : 'bg-border')} />
            <StepDot index={3} label="Récapitulatif" active={step === 3} done={false} />
          </div>
        </ModalHeader>

        <div className="relative flex-1 overflow-y-auto px-6 py-5">

          {isLocked && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium text-foreground">Création du projet en cours…</p>
              <p className="text-xs text-muted-foreground">Merci de patienter, ne fermez pas cette fenêtre.</p>
            </div>
          )}

          {!hasProgramme && (
            <div className="mb-4 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive" role="alert">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Aucun programme n'est configuré pour votre organisation — la création de projet est
                bloquée tant que ce n'est pas résolu. Contactez un administrateur de la plateforme.
              </span>
            </div>
          )}

          {/* ── Étape 1 : Informations Essentielles ──────────────────────── */}
          {step === 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldRow id="pc-code" label="Code projet" error={errors.code} required>
                <Input id="pc-code" value={infos.code} onChange={e => setInfo('code', e.target.value)} placeholder="PROJ-XXX" />
              </FieldRow>
              <FieldRow id="pc-manager" label="Responsable">
                <Select id="pc-manager" value={infos.managerId} onChange={e => setInfo('managerId', e.target.value)} disabled={isUsersLoading}>
                  <option value="">{isUsersLoading ? 'Chargement…' : 'Non assigné — à définir plus tard'}</option>
                  {(usersList ?? []).map(u => (
                    <option key={u.id} value={u.id}>{u.prenom} {u.nom} ({u.role ?? 'Utilisateur'})</option>
                  ))}
                </Select>
              </FieldRow>
              <FieldRow id="pc-nom" label="Nom du projet" error={errors.name} required full>
                <Input id="pc-nom" value={infos.name} onChange={e => setInfo('name', e.target.value)} placeholder="Intitulé complet du projet" />
              </FieldRow>
              <FieldRow id="pc-desc" label="Description" full>
                <Textarea id="pc-desc" value={infos.description} onChange={e => setInfo('description', e.target.value)} rows={3} placeholder="Description et objectifs principaux" />
              </FieldRow>
              <FieldRow id="pc-debut" label="Date début">
                <Input id="pc-debut" type="date" value={infos.startDate} onChange={e => setInfo('startDate', e.target.value)} />
              </FieldRow>
              <FieldRow id="pc-fin" label="Date fin prévue" error={errors.endDate}>
                <Input id="pc-fin" type="date" value={infos.endDate} onChange={e => setInfo('endDate', e.target.value)} />
              </FieldRow>
            </div>
          )}

          {/* ── Étape 2 : Cadre & Financement (optionnelle) ──────────────── */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 rounded-md px-3 py-2">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                Cette étape est entièrement facultative — vous pouvez la passer et tout renseigner plus tard depuis les onglets Cadre Logique et Financement.
              </div>

              {/* Cadre logique */}
              <div className="flex flex-col gap-3">
                <FieldRow id="pc-objectif" label="Objectif global (Cadre Logique)" full>
                  <Textarea
                    id="pc-objectif"
                    value={objectifGlobal}
                    onChange={e => setObjectifGlobal(e.target.value)}
                    rows={2}
                    placeholder="Ex : Contribuer à l'amélioration de l'accès à l'eau potable dans la région..."
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Deviendra l'objectif racine du Cadre Logique du projet — modifiable ensuite depuis cet onglet.
                    Le découpage en composantes se fait désormais exclusivement via le WBS (1.0, 2.0…), une fois le projet créé.
                  </p>
                </FieldRow>
              </div>

              {/* Financement */}
              <div className="flex flex-col gap-3 border-t border-border pt-4">
                <FieldRow id="pc-devise" label="Devise du projet">
                  <Select id="pc-devise" value={devise} onChange={e => setDevise(e.target.value)} className="max-w-[200px]">
                    <option value="XOF">XOF — Franc CFA</option>
                    <option value="EUR">EUR — Euro</option>
                    <option value="USD">USD — Dollar américain</option>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    Initialisée avec la devise par défaut de l'organisation ({organisation?.deviseDefaut ?? 'XOF'}).
                  </p>
                </FieldRow>

                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">Sources de financement</p>
                  <Button type="button" variant="outline" size="sm" onClick={addSource} leftIcon={<Plus className="h-3.5 w-3.5" />}>
                    Ajouter une source
                  </Button>
                </div>

                {sources.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">
                    Aucune source déclarée pour l'instant — vous pourrez en ajouter plus tard depuis l'onglet Financement.
                  </p>
                )}

                {sources.map(s => (
                  <div key={s.tempId} className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="text-xs font-medium text-muted-foreground">Bailleur / Source</label>
                      <Input value={s.nom} onChange={e => updateSource(s.tempId, { nom: e.target.value })} placeholder="Ex : Banque Mondiale" />
                    </div>
                    <div className="w-44">
                      <label className="text-xs font-medium text-muted-foreground">Enveloppe globale ({devise})</label>
                      <Input type="number" min={0} value={s.montant} onChange={e => updateSource(s.tempId, { montant: e.target.value })} placeholder="0" />
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeSource(s.tempId)} aria-label="Retirer cette source">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}

                {sources.length > 0 && (
                  <div className="flex justify-between text-sm font-semibold border-t border-border pt-3">
                    <span className="text-muted-foreground">Total des enveloppes</span>
                    <span className="font-mono text-foreground">{totalSources.toLocaleString('fr-FR')} {devise}</span>
                  </div>
                )}

                {sources.length > 0 && !sourcesValid && (
                  <div className="flex items-center gap-1.5 text-xs text-destructive" role="alert">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    Chaque source doit avoir un nom et une enveloppe supérieure à 0 pour continuer — ou retirez-la, ou passez l'étape.
                  </div>
                )}

                <p className="text-[11px] text-muted-foreground border-t border-border pt-3">
                  Le découpage du budget par composante se fait depuis le WBS (1.0, 2.0…) et l'onglet
                  Budget, une fois le projet créé — chaque source ci-dessus ne définit que le bailleur
                  et son enveloppe globale pour l'ensemble du projet. Aucune ligne budgétaire n'est créée ici.
                </p>
              </div>
            </div>
          )}

          {/* ── Étape 3 : Récapitulatif & Confirmation ───────────────────── */}
          {step === 3 && (
            <div className="flex flex-col gap-4">
              <RecapSection title="Informations essentielles" onEdit={() => setStep(1)}>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <dt className="text-[11px] text-muted-foreground">Nom du projet</dt>
                    <dd className="text-foreground font-medium">{infos.name.trim() || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-muted-foreground">Code</dt>
                    <dd className="text-foreground font-mono">{infos.code.trim() || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-muted-foreground">Date début</dt>
                    <dd className="text-foreground">{infos.startDate || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-muted-foreground">Date fin prévue</dt>
                    <dd className="text-foreground">{infos.endDate || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-muted-foreground">Responsable</dt>
                    <dd className="text-foreground">{selectedManagerLabel || 'Non assigné'}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-[11px] text-muted-foreground">Description</dt>
                    <dd className="text-foreground">{infos.description.trim() || '—'}</dd>
                  </div>
                </dl>
              </RecapSection>

              <RecapSection title="Cadre logique" onEdit={() => setStep(2)}>
                {objectifGlobal.trim() ? (
                  <p className="text-sm text-foreground">{objectifGlobal.trim()}</p>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    Aucun objectif global défini — configurable plus tard depuis l'onglet Cadre Logique.
                  </p>
                )}
              </RecapSection>

              <RecapSection title="Financement" onEdit={() => setStep(2)}>
                {sources.length > 0 ? (
                  <>
                    <ul className="flex flex-col gap-1 text-sm">
                      {sources.map(s => (
                        <li key={s.tempId} className="flex justify-between gap-2">
                          <span className="text-foreground truncate">{s.nom.trim() || '—'}</span>
                          <span className="font-mono text-muted-foreground shrink-0">{(Number(s.montant) || 0).toLocaleString('fr-FR')} {devise}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex justify-between text-sm font-semibold border-t border-border mt-2 pt-2">
                      <span className="text-muted-foreground">Total</span>
                      <span className="font-mono text-foreground">{totalSources.toLocaleString('fr-FR')} {devise}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-start gap-1.5 text-xs text-muted-foreground italic">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    Aucun financement déclaré — Le projet sera créé avec le statut « En préparation ».
                  </div>
                )}
              </RecapSection>
            </div>
          )}

          {submitError && (
            <div className="mt-4 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive" role="alert">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border bg-muted/20 shrink-0">
          <Button type="button" variant="outline" onClick={goBack} disabled={step === 1 || isLocked}>
            Précédent
          </Button>
          <div className="flex items-center gap-2">
            {step === 2 && (
              <Button type="button" variant="outline" onClick={skipStep2} disabled={isLocked}>
                Passer cette étape
              </Button>
            )}
            {step < 3 ? (
              <Button type="button" variant="default" onClick={goNext} disabled={isLocked || (step === 2 && !sourcesValid)}>
                Suivant
              </Button>
            ) : (
              <Button type="button" variant="default" onClick={handleFinish} disabled={!canFinish}>
                {isLocked ? 'Création…' : 'Créer le projet'}
              </Button>
            )}
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
