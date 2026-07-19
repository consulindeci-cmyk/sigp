import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import {
  useTeamMembers, useCreateTeamMember, useUpdateTeamMember, useDeleteTeamMember,
  useCommitteeMembers, useCreateCommitteeMember, useUpdateCommitteeMember, useDeleteCommitteeMember,
  useStakeholders, useCreateStakeholder, useUpdateStakeholder, useDeleteStakeholder,
  useContacts, useCreateContact, useUpdateContact, useDeleteContact,
  useOrganisationMembersForPicker,
} from '@/hooks/useGovernance';
import { Plus, Edit, Trash2, User, Mail, Phone, X, Crown, Star, Eye, Building2, AlertCircle } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table/DataTable';
import { Badge } from '@/components/ui/data-display/Badge';
import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/forms/Input';
import { Select } from '@/components/ui/forms/Select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/Card';
import {
  SlideOver,
  SlideOverContent,
  SlideOverHeader,
  SlideOverTitle,
  SlideOverBody,
  SlideOverFooter,
  SlideOverClose,
} from '@/components/ui/overlays/SlideOver';
import {
  Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription,
  ModalFooter, ModalClose,
} from '@/components/ui/overlays/Modal';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/navigation/Tabs';
import {
  type TeamMember,
  type CommitteeMember,
  type Stakeholder,
  type Contact,
  type ActorStatus,
} from '@/mocks/governanceMocks';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function statusVariant(status: ActorStatus): 'success' | 'warning' | 'secondary' {
  if (status === 'Actif') return 'success';
  if (status === 'En congé') return 'warning';
  return 'secondary';
}

function engagementVariant(niveau: string): 'success' | 'warning' | 'secondary' {
  if (niveau === 'Élevé') return 'success';
  if (niveau === 'Moyen') return 'warning';
  return 'secondary';
}

function categorieVariant(cat: string): 'destructive' | 'info' | 'default' | 'warning' {
  if (cat === 'Urgence') return 'destructive';
  if (cat === 'Bailleur') return 'info';
  if (cat === 'Technique') return 'default';
  return 'warning';
}

// nom/prenom sont un instantané résolu côté serveur depuis le profil
// sélectionné — un membre PENDING (jamais connecté) n'a pas encore renseigné
// son identité, d'où ce libellé de repli plutôt qu'un nom vide.
function identityLabel(nom: string, prenom: string, isPending: boolean): string {
  if (isPending) return 'Invité — profil en attente';
  return `${prenom} ${nom}`.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared Avatar
// ─────────────────────────────────────────────────────────────────────────────

function Avatar({ initiales, variant = 'primary' }: { initiales: string; variant?: 'primary' | 'muted' }) {
  const cls = variant === 'primary'
    ? 'bg-primary/10 text-primary'
    : 'bg-muted text-muted-foreground';
  return (
    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${cls}`} aria-hidden="true">
      {initiales}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Key Actor Card
// ─────────────────────────────────────────────────────────────────────────────

function KeyActorCard({ member, label, icon: Icon }: { member: TeamMember | undefined; label: string; icon: React.ElementType }) {
  if (!member) return null;
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
            {member.initiales}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
            </div>
            <p className="text-[14px] font-semibold text-foreground truncate">{identityLabel(member.nom, member.prenom, member.isPending)}</p>
            <p className="text-[11px] text-muted-foreground truncate">{member.structure}</p>
            <div className="flex flex-col gap-0.5 mt-2">
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Mail className="h-3 w-3 shrink-0" aria-hidden="true" />
                {member.email}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Phone className="h-3 w-3 shrink-0" aria-hidden="true" />
                {member.telephone}
              </span>
            </div>
          </div>
          <Badge variant={statusVariant(member.status)} className="text-[10px] shrink-0">{member.status}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Controlled form state for TeamMemberSlideOver
// ─────────────────────────────────────────────────────────────────────────────

interface TeamFormValues {
  userId:    string;
  role:      string;
  structure: string;
  telephone: string;
  dateDebut: string;
  status:    string;
}

type TeamFormErrors = Partial<Record<keyof TeamFormValues, string>>;

const EMPTY_TEAM: TeamFormValues = {
  userId: '', role: '', structure: '',
  telephone: '', dateDebut: '', status: 'Actif',
};

function memberToForm(m: TeamMember): TeamFormValues {
  return {
    userId:    m.userId,
    role:      m.role,
    structure: m.structure,
    telephone: m.telephone,
    dateDebut: m.dateDebut,
    status:    m.status,
  };
}

function FRow({ id, label, error, full = false, children }: {
  id?: string; label: string; error?: string; full?: boolean; children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1.5${full ? ' sm:col-span-2' : ''}`}>
      <label className="text-sm font-medium text-foreground" htmlFor={id}>{label}</label>
      {children}
      {error && <p className="text-xs text-destructive" role="alert">{error}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SlideOver — Voir / Ajouter / Modifier membre d'équipe
// ─────────────────────────────────────────────────────────────────────────────

type SlideOverMode = 'view' | 'edit' | 'new';

function TeamMemberSlideOver({
  open,
  onOpenChange,
  member,
  mode,
  onSave,
  projectId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: TeamMember | null;
  mode: SlideOverMode;
  onSave?: (data: Partial<TeamMember>) => void;
  projectId: string;
}) {
  const [values, setValues] = useState<TeamFormValues>(EMPTY_TEAM);
  const [errors, setErrors] = useState<TeamFormErrors>({});
  const readOnly = mode === 'view';
  const { data: orgMembers = [], isLoading: isLoadingMembers } = useOrganisationMembersForPicker(projectId);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (mode === 'new') setValues(EMPTY_TEAM);
    else if (member) setValues(memberToForm(member));
  }, [open, mode, member?.id]);

  function set(k: keyof TeamFormValues, v: string) {
    setValues(prev => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: undefined }));
  }

  function validate(): boolean {
    const errs: TeamFormErrors = {};
    // Obligatoire uniquement à la création — interdiction stricte de saisie
    // libre pour un nouveau membre. En édition, un membre déjà existant sans
    // compte lié (créé avant cette refonte) reste modifiable sur ses autres
    // champs sans être forcé de le rattacher immédiatement.
    if (mode === 'new' && !values.userId.trim()) errs.userId = 'Requis';
    if (!values.role.trim()) errs.role = 'Requis';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    onSave?.({
      ...(values.userId ? { userId: values.userId } : {}),
      role:      values.role as TeamMember['role'],
      structure: values.structure.trim(),
      telephone: values.telephone.trim(),
      dateDebut: values.dateDebut,
      status:    values.status as ActorStatus,
    });
  }

  const selectedOrgMember = orgMembers.find(u => u.id === values.userId);

  const titles: Record<SlideOverMode, string> = {
    view: 'Détails du membre',
    edit: 'Modifier le membre',
    new:  'Ajouter un membre',
  };

  return (
    <SlideOver open={open} onOpenChange={onOpenChange}>
      <SlideOverContent>
        <SlideOverHeader>
          <SlideOverTitle>{titles[mode]}</SlideOverTitle>
          <SlideOverClose asChild>
            <Button variant="ghost" size="sm" aria-label="Fermer">
              <X className="h-4 w-4" />
            </Button>
          </SlideOverClose>
        </SlideOverHeader>

        <SlideOverBody>
          {readOnly && member ? (
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-bold shrink-0">
                  {member.initiales}
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">{identityLabel(member.nom, member.prenom, member.isPending)}</p>
                  <p className="text-sm text-muted-foreground">{member.structure}</p>
                  <Badge variant={statusVariant(member.status)} className="mt-1 text-[11px]">{member.status}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border pt-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Rôle</p>
                  <Badge variant="outline" className="text-[12px]">{member.role}</Badge>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Date de début</p>
                  <p className="text-[13px] font-mono text-foreground">{formatDate(member.dateDebut)}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Email</p>
                  <p className="text-[13px] text-foreground">{member.email}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Téléphone</p>
                  <p className="text-[13px] text-foreground">{member.telephone}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FRow id="gov-membre" label="Membre de l'organisation" error={errors.userId} full>
                <Select
                  id="gov-membre"
                  value={values.userId}
                  onChange={e => set('userId', e.target.value)}
                  disabled={isLoadingMembers}
                >
                  <option value="">
                    {isLoadingMembers ? 'Chargement…' : 'Sélectionner une personne'}
                  </option>
                  {orgMembers.map(u => (
                    <option key={u.id} value={u.id}>{u.displayName}</option>
                  ))}
                </Select>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Seules les personnes déjà rattachées à l'organisation peuvent être ajoutées ici.
                </p>
                {selectedOrgMember && (
                  <p className="text-[12px] text-foreground mt-1">{selectedOrgMember.email}</p>
                )}
                {mode === 'edit' && !values.userId && (
                  <p className="text-[11px] text-warning mt-1">
                    Ce membre n'est pas encore rattaché à un compte — sélectionnez une personne pour le lier.
                  </p>
                )}
              </FRow>

              <FRow id="gov-role" label="Rôle" error={errors.role} full>
                <Select id="gov-role" value={values.role} onChange={e => set('role', e.target.value)}>
                  <option value="">Sélectionner un rôle</option>
                  <option value="Responsable Projet">Responsable Projet</option>
                  <option value="Sponsor">Sponsor</option>
                  <option value="Chef de Composante">Chef de Composante</option>
                  <option value="Expert Technique">Expert Technique</option>
                  <option value="Expert Financier">Expert Financier</option>
                  <option value="Coordinateur">Coordinateur</option>
                  <option value="Chargé de Passation">Chargé de Passation</option>
                  <option value="Assistant Administratif">Assistant Administratif</option>
                </Select>
                {errors.role && <p className="text-xs text-destructive" role="alert">{errors.role}</p>}
              </FRow>

              <FRow id="gov-structure" label="Structure" full>
                <Input
                  id="gov-structure"
                  value={values.structure}
                  onChange={e => set('structure', e.target.value)}
                  placeholder="Organisation / Structure"
                />
              </FRow>

              <FRow id="gov-tel" label="Téléphone">
                <Input
                  id="gov-tel"
                  value={values.telephone}
                  onChange={e => set('telephone', e.target.value)}
                  placeholder="+227 XX XX XX XX"
                />
              </FRow>

              <FRow id="gov-date" label="Date de début">
                <Input
                  id="gov-date"
                  type="date"
                  value={values.dateDebut}
                  onChange={e => set('dateDebut', e.target.value)}
                />
              </FRow>

              <FRow id="gov-status" label="Statut">
                <Select id="gov-status" value={values.status} onChange={e => set('status', e.target.value)}>
                  <option value="Actif">Actif</option>
                  <option value="Inactif">Inactif</option>
                  <option value="En congé">En congé</option>
                </Select>
              </FRow>
            </div>
          )}
        </SlideOverBody>

        <SlideOverFooter>
          <SlideOverClose asChild>
            <Button variant="outline">{readOnly ? 'Fermer' : 'Annuler'}</Button>
          </SlideOverClose>
          {!readOnly && (
            <Button variant="default" onClick={handleSave}>
              {mode === 'edit' ? 'Enregistrer' : 'Ajouter'}
            </Button>
          )}
        </SlideOverFooter>
      </SlideOverContent>
    </SlideOver>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SlideOver — Comité de Pilotage
// ─────────────────────────────────────────────────────────────────────────────

interface CommitteeFormValues {
  nom: string; prenom: string; fonction: string; organisation: string;
  email: string; telephone: string;
  type: string; presidentRole: boolean; status: string;
}

type CommitteeFormErrors = Partial<Record<keyof CommitteeFormValues, string>>;

const EMPTY_COMMITTEE: CommitteeFormValues = {
  nom: '', prenom: '', fonction: '', organisation: '',
  email: '', telephone: '',
  type: '', presidentRole: false, status: 'Actif',
};

function committeeToForm(m: CommitteeMember): CommitteeFormValues {
  return {
    nom: m.nom, prenom: m.prenom, fonction: m.fonction, organisation: m.organisation,
    email: m.email, telephone: m.telephone,
    type: m.type, presidentRole: m.presidentRole, status: m.status,
  };
}

function CommitteeMemberSlideOver({
  open, onOpenChange, member, mode, onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: CommitteeMember | null;
  mode: SlideOverMode;
  onSave?: (data: Partial<CommitteeMember>) => void;
}) {
  const [values, setValues] = useState<CommitteeFormValues>(EMPTY_COMMITTEE);
  const [errors, setErrors] = useState<CommitteeFormErrors>({});
  const readOnly = mode === 'view';

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (mode === 'new') setValues(EMPTY_COMMITTEE);
    else if (member) setValues(committeeToForm(member));
  }, [open, mode, member?.id]);

  function set<K extends keyof CommitteeFormValues>(k: K, v: CommitteeFormValues[K]) {
    setValues(prev => ({ ...prev, [k]: v }));
    if (errors[k as keyof CommitteeFormErrors]) setErrors(prev => ({ ...prev, [k]: undefined }));
  }

  function validate(): boolean {
    const errs: CommitteeFormErrors = {};
    if (!values.nom.trim())    errs.nom    = 'Requis';
    if (!values.prenom.trim()) errs.prenom = 'Requis';
    if (!values.type.trim())   errs.type   = 'Requis';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    onSave?.({
      nom: values.nom.trim(),
      prenom: values.prenom.trim(),
      fonction: values.fonction.trim(),
      organisation: values.organisation.trim(),
      email: values.email.trim(),
      telephone: values.telephone.trim(),
      type: values.type as CommitteeMember['type'],
      presidentRole: values.presidentRole,
      status: values.status as ActorStatus,
    });
  }

  const titles: Record<SlideOverMode, string> = {
    view: 'Détails du membre', edit: 'Modifier le membre', new: 'Ajouter un membre au comité',
  };

  return (
    <SlideOver open={open} onOpenChange={onOpenChange}>
      <SlideOverContent>
        <SlideOverHeader>
          <SlideOverTitle>{titles[mode]}</SlideOverTitle>
          <SlideOverClose asChild>
            <Button variant="ghost" size="sm" aria-label="Fermer"><X className="h-4 w-4" /></Button>
          </SlideOverClose>
        </SlideOverHeader>
        <SlideOverBody>
          {readOnly && member ? (
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-bold shrink-0">
                  {`${member.prenom[0]}${member.nom[0]}`.toUpperCase()}
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">{member.prenom} {member.nom}</p>
                  <p className="text-sm text-muted-foreground">{member.organisation}</p>
                  <Badge variant={statusVariant(member.status)} className="mt-1 text-[11px]">{member.status}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border pt-4">
                <div className="sm:col-span-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Fonction</p>
                  <p className="text-[13px] text-foreground">{member.fonction}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Comité</p>
                  <Badge variant="outline" className="text-[12px]">{member.type}</Badge>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Rôle</p>
                  <Badge variant={member.presidentRole ? 'warning' : 'secondary'} className="text-[12px]">
                    {member.presidentRole ? 'Président' : 'Membre'}
                  </Badge>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Email</p>
                  <p className="text-[13px] text-foreground">{member.email || '—'}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Téléphone</p>
                  <p className="text-[13px] text-foreground">{member.telephone || '—'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FRow id="com-prenom" label="Prénom" error={errors.prenom}>
                <Input id="com-prenom" value={values.prenom} onChange={e => set('prenom', e.target.value)} placeholder="Prénom" />
              </FRow>
              <FRow id="com-nom" label="Nom" error={errors.nom}>
                <Input id="com-nom" value={values.nom} onChange={e => set('nom', e.target.value)} placeholder="Nom" />
              </FRow>
              <FRow id="com-fonction" label="Fonction" full>
                <Input id="com-fonction" value={values.fonction} onChange={e => set('fonction', e.target.value)} placeholder="Fonction" />
              </FRow>
              <FRow id="com-organisation" label="Organisation" full>
                <Input id="com-organisation" value={values.organisation} onChange={e => set('organisation', e.target.value)} placeholder="Organisation" />
              </FRow>
              <FRow id="com-email" label="Email">
                <Input id="com-email" type="email" value={values.email} onChange={e => set('email', e.target.value)} placeholder="email@exemple.com" />
              </FRow>
              <FRow id="com-tel" label="Téléphone">
                <Input id="com-tel" value={values.telephone} onChange={e => set('telephone', e.target.value)} placeholder="+227 XX XX XX XX" />
              </FRow>
              <FRow id="com-type" label="Comité" error={errors.type} full>
                <Select id="com-type" value={values.type} onChange={e => set('type', e.target.value)}>
                  <option value="">Sélectionner un comité</option>
                  <option value="Comité de Pilotage">Comité de Pilotage</option>
                  <option value="Comité Technique">Comité Technique</option>
                  <option value="Comité de Coordination">Comité de Coordination</option>
                </Select>
              </FRow>
              <FRow id="com-president" label="Rôle" full>
                <Select id="com-president" value={values.presidentRole ? 'true' : 'false'} onChange={e => set('presidentRole', e.target.value === 'true')}>
                  <option value="false">Membre</option>
                  <option value="true">Président</option>
                </Select>
              </FRow>
              <FRow id="com-status" label="Statut">
                <Select id="com-status" value={values.status} onChange={e => set('status', e.target.value)}>
                  <option value="Actif">Actif</option>
                  <option value="Inactif">Inactif</option>
                  <option value="En congé">En congé</option>
                </Select>
              </FRow>
            </div>
          )}
        </SlideOverBody>
        <SlideOverFooter>
          <SlideOverClose asChild>
            <Button variant="outline">{readOnly ? 'Fermer' : 'Annuler'}</Button>
          </SlideOverClose>
          {!readOnly && (
            <Button variant="default" onClick={handleSave}>{mode === 'edit' ? 'Enregistrer' : 'Ajouter'}</Button>
          )}
        </SlideOverFooter>
      </SlideOverContent>
    </SlideOver>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SlideOver — Partie prenante / Bailleur (même table, mêmes champs)
// ─────────────────────────────────────────────────────────────────────────────

interface StakeholderFormValues {
  organisation: string; type: string; representant: string;
  email: string; telephone: string; niveauEngagement: string; status: string;
}

type StakeholderFormErrors = Partial<Record<keyof StakeholderFormValues, string>>;

const EMPTY_STAKEHOLDER: StakeholderFormValues = {
  organisation: '', type: '', representant: '', email: '', telephone: '',
  niveauEngagement: 'Moyen', status: 'Actif',
};

function stakeholderToForm(s: Stakeholder): StakeholderFormValues {
  return {
    organisation: s.organisation, type: s.type, representant: s.representant,
    email: s.email, telephone: s.telephone, niveauEngagement: s.niveauEngagement, status: s.status,
  };
}

function StakeholderSlideOver({
  open, onOpenChange, stakeholder, mode, onSave, defaultType,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stakeholder: Stakeholder | null;
  mode: SlideOverMode;
  onSave?: (data: Partial<Stakeholder>) => void;
  defaultType?: string;
}) {
  const [values, setValues] = useState<StakeholderFormValues>(EMPTY_STAKEHOLDER);
  const [errors, setErrors] = useState<StakeholderFormErrors>({});
  const readOnly = mode === 'view';

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (mode === 'new') setValues({ ...EMPTY_STAKEHOLDER, type: defaultType ?? '' });
    else if (stakeholder) setValues(stakeholderToForm(stakeholder));
  }, [open, mode, stakeholder?.id, defaultType]);

  function set<K extends keyof StakeholderFormValues>(k: K, v: StakeholderFormValues[K]) {
    setValues(prev => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: undefined }));
  }

  function validate(): boolean {
    const errs: StakeholderFormErrors = {};
    if (!values.organisation.trim()) errs.organisation = 'Requis';
    if (!values.type.trim())         errs.type         = 'Requis';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    onSave?.({
      organisation: values.organisation.trim(),
      type: values.type as Stakeholder['type'],
      representant: values.representant.trim(),
      email: values.email.trim(),
      telephone: values.telephone.trim(),
      niveauEngagement: values.niveauEngagement as Stakeholder['niveauEngagement'],
      status: values.status as ActorStatus,
    });
  }

  const titles: Record<SlideOverMode, string> = {
    view: 'Détails', edit: 'Modifier', new: 'Ajouter',
  };

  return (
    <SlideOver open={open} onOpenChange={onOpenChange}>
      <SlideOverContent>
        <SlideOverHeader>
          <SlideOverTitle>{titles[mode]}</SlideOverTitle>
          <SlideOverClose asChild>
            <Button variant="ghost" size="sm" aria-label="Fermer"><X className="h-4 w-4" /></Button>
          </SlideOverClose>
        </SlideOverHeader>
        <SlideOverBody>
          {readOnly && stakeholder ? (
            <div className="flex flex-col gap-5">
              <div>
                <p className="text-lg font-semibold text-foreground">{stakeholder.organisation}</p>
                <Badge variant="outline" className="mt-1 text-[11px]">{stakeholder.type}</Badge>
                <Badge variant={statusVariant(stakeholder.status)} className="mt-1 ml-1.5 text-[11px]">{stakeholder.status}</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border pt-4">
                <div className="sm:col-span-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Représentant</p>
                  <p className="text-[13px] text-foreground">{stakeholder.representant || '—'}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Email</p>
                  <p className="text-[13px] text-foreground">{stakeholder.email || '—'}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Téléphone</p>
                  <p className="text-[13px] text-foreground">{stakeholder.telephone || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Engagement</p>
                  <Badge variant={engagementVariant(stakeholder.niveauEngagement)} className="text-[12px]">{stakeholder.niveauEngagement}</Badge>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FRow id="sh-organisation" label="Organisation" error={errors.organisation} full>
                <Input id="sh-organisation" value={values.organisation} onChange={e => set('organisation', e.target.value)} placeholder="Nom de l'organisation" />
              </FRow>
              <FRow id="sh-type" label="Type" error={errors.type} full>
                <Select id="sh-type" value={values.type} onChange={e => set('type', e.target.value)}>
                  <option value="">Sélectionner un type</option>
                  <option value="Bailleur">Bailleur</option>
                  <option value="Gouvernement">Gouvernement</option>
                  <option value="ONG Partenaire">ONG Partenaire</option>
                  <option value="Secteur Privé">Secteur Privé</option>
                  <option value="Société Civile">Société Civile</option>
                  <option value="Bénéficiaire">Bénéficiaire</option>
                </Select>
              </FRow>
              <FRow id="sh-representant" label="Représentant" full>
                <Input id="sh-representant" value={values.representant} onChange={e => set('representant', e.target.value)} placeholder="Nom du représentant" />
              </FRow>
              <FRow id="sh-email" label="Email">
                <Input id="sh-email" type="email" value={values.email} onChange={e => set('email', e.target.value)} placeholder="email@exemple.com" />
              </FRow>
              <FRow id="sh-tel" label="Téléphone">
                <Input id="sh-tel" value={values.telephone} onChange={e => set('telephone', e.target.value)} placeholder="+227 XX XX XX XX" />
              </FRow>
              <FRow id="sh-engagement" label="Niveau d'engagement">
                <Select id="sh-engagement" value={values.niveauEngagement} onChange={e => set('niveauEngagement', e.target.value)}>
                  <option value="Élevé">Élevé</option>
                  <option value="Moyen">Moyen</option>
                  <option value="Faible">Faible</option>
                </Select>
              </FRow>
              <FRow id="sh-status" label="Statut">
                <Select id="sh-status" value={values.status} onChange={e => set('status', e.target.value)}>
                  <option value="Actif">Actif</option>
                  <option value="Inactif">Inactif</option>
                  <option value="En congé">En congé</option>
                </Select>
              </FRow>
            </div>
          )}
        </SlideOverBody>
        <SlideOverFooter>
          <SlideOverClose asChild>
            <Button variant="outline">{readOnly ? 'Fermer' : 'Annuler'}</Button>
          </SlideOverClose>
          {!readOnly && (
            <Button variant="default" onClick={handleSave}>{mode === 'edit' ? 'Enregistrer' : 'Ajouter'}</Button>
          )}
        </SlideOverFooter>
      </SlideOverContent>
    </SlideOver>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SlideOver — Contact
// ─────────────────────────────────────────────────────────────────────────────

interface ContactFormValues {
  nom: string; prenom: string; organisation: string; email: string;
  telephone: string; fonction: string; categorie: string;
}

type ContactFormErrors = Partial<Record<keyof ContactFormValues, string>>;

const EMPTY_CONTACT: ContactFormValues = {
  nom: '', prenom: '', organisation: '', email: '', telephone: '', fonction: '', categorie: '',
};

function contactToForm(c: Contact): ContactFormValues {
  return {
    nom: c.nom, prenom: c.prenom, organisation: c.organisation, email: c.email,
    telephone: c.telephone, fonction: c.fonction, categorie: c.categorie,
  };
}

function ContactSlideOver({
  open, onOpenChange, contact, mode, onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact | null;
  mode: SlideOverMode;
  onSave?: (data: Partial<Contact>) => void;
}) {
  const [values, setValues] = useState<ContactFormValues>(EMPTY_CONTACT);
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const readOnly = mode === 'view';

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (mode === 'new') setValues(EMPTY_CONTACT);
    else if (contact) setValues(contactToForm(contact));
  }, [open, mode, contact?.id]);

  function set(k: keyof ContactFormValues, v: string) {
    setValues(prev => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: undefined }));
  }

  function validate(): boolean {
    const errs: ContactFormErrors = {};
    if (!values.nom.trim())       errs.nom       = 'Requis';
    if (!values.prenom.trim())    errs.prenom    = 'Requis';
    if (!values.categorie.trim()) errs.categorie = 'Requis';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    onSave?.({
      nom: values.nom.trim(),
      prenom: values.prenom.trim(),
      organisation: values.organisation.trim(),
      email: values.email.trim(),
      telephone: values.telephone.trim(),
      fonction: values.fonction.trim(),
      categorie: values.categorie as Contact['categorie'],
    });
  }

  const titles: Record<SlideOverMode, string> = {
    view: 'Détails du contact', edit: 'Modifier le contact', new: 'Ajouter un contact',
  };

  return (
    <SlideOver open={open} onOpenChange={onOpenChange}>
      <SlideOverContent>
        <SlideOverHeader>
          <SlideOverTitle>{titles[mode]}</SlideOverTitle>
          <SlideOverClose asChild>
            <Button variant="ghost" size="sm" aria-label="Fermer"><X className="h-4 w-4" /></Button>
          </SlideOverClose>
        </SlideOverHeader>
        <SlideOverBody>
          {readOnly && contact ? (
            <div className="flex flex-col gap-5">
              <div>
                <p className="text-lg font-semibold text-foreground">{contact.prenom} {contact.nom}</p>
                <p className="text-sm text-muted-foreground">{contact.organisation}</p>
                <Badge variant={categorieVariant(contact.categorie)} className="mt-1 text-[11px]">{contact.categorie}</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border pt-4">
                <div className="sm:col-span-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Fonction</p>
                  <p className="text-[13px] text-foreground">{contact.fonction || '—'}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Email</p>
                  <p className="text-[13px] text-foreground">{contact.email || '—'}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Téléphone</p>
                  <p className="text-[13px] text-foreground">{contact.telephone || '—'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FRow id="ct-prenom" label="Prénom" error={errors.prenom}>
                <Input id="ct-prenom" value={values.prenom} onChange={e => set('prenom', e.target.value)} placeholder="Prénom" />
              </FRow>
              <FRow id="ct-nom" label="Nom" error={errors.nom}>
                <Input id="ct-nom" value={values.nom} onChange={e => set('nom', e.target.value)} placeholder="Nom" />
              </FRow>
              <FRow id="ct-organisation" label="Organisation" full>
                <Input id="ct-organisation" value={values.organisation} onChange={e => set('organisation', e.target.value)} placeholder="Organisation" />
              </FRow>
              <FRow id="ct-fonction" label="Fonction" full>
                <Input id="ct-fonction" value={values.fonction} onChange={e => set('fonction', e.target.value)} placeholder="Fonction / rôle" />
              </FRow>
              <FRow id="ct-email" label="Email">
                <Input id="ct-email" type="email" value={values.email} onChange={e => set('email', e.target.value)} placeholder="email@exemple.com" />
              </FRow>
              <FRow id="ct-tel" label="Téléphone">
                <Input id="ct-tel" value={values.telephone} onChange={e => set('telephone', e.target.value)} placeholder="+227 XX XX XX XX" />
              </FRow>
              <FRow id="ct-categorie" label="Catégorie" error={errors.categorie} full>
                <Select id="ct-categorie" value={values.categorie} onChange={e => set('categorie', e.target.value)}>
                  <option value="">Sélectionner une catégorie</option>
                  <option value="Urgence">Urgence</option>
                  <option value="Technique">Technique</option>
                  <option value="Administratif">Administratif</option>
                  <option value="Bailleur">Bailleur</option>
                </Select>
              </FRow>
            </div>
          )}
        </SlideOverBody>
        <SlideOverFooter>
          <SlideOverClose asChild>
            <Button variant="outline">{readOnly ? 'Fermer' : 'Annuler'}</Button>
          </SlideOverClose>
          {!readOnly && (
            <Button variant="default" onClick={handleSave}>{mode === 'edit' ? 'Enregistrer' : 'Ajouter'}</Button>
          )}
        </SlideOverFooter>
      </SlideOverContent>
    </SlideOver>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Column builders
// ─────────────────────────────────────────────────────────────────────────────

function buildTeamColumns(
  onView: (m: TeamMember) => void,
  onEdit: (m: TeamMember) => void,
  onDelete: (id: string) => void,
  canEdit: boolean,
  canDelete: boolean,
): ColumnDef<TeamMember, any>[] {
  return [
    {
      id: 'identite',
      accessorKey: 'nom',
      header: 'Membre',
      meta: { isSticky: true } as any,
      cell: ({ row }) => {
        const { initiales, nom, prenom, isPending, structure } = row.original;
        return (
          <div className="flex items-center gap-2.5 min-w-[180px]">
            <Avatar initiales={initiales} />
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-[13px] font-semibold text-foreground truncate">{identityLabel(nom, prenom, isPending)}</span>
              <span className="text-[11px] text-muted-foreground truncate">{structure}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'role',
      header: 'Rôle',
      cell: ({ getValue }) => (
        <Badge variant="outline" className="text-[11px] font-medium w-max">{getValue() as string}</Badge>
      ),
    },
    {
      id: 'contact',
      accessorKey: 'email',
      header: 'Contact',
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
            <Mail className="h-3 w-3 shrink-0" aria-hidden="true" />
            {row.original.email}
          </span>
          <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
            <Phone className="h-3 w-3 shrink-0" aria-hidden="true" />
            {row.original.telephone}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'dateDebut',
      header: 'Date début',
      cell: ({ getValue }) => (
        <span className="font-mono text-[12px] text-muted-foreground">{formatDate(getValue() as string)}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Statut',
      cell: ({ getValue }) => {
        const s = getValue() as ActorStatus;
        return <Badge variant={statusVariant(s)} className="text-[11px] w-max">{s}</Badge>;
      },
    },
    {
      id: 'actions',
      enableHiding: false,
      meta: { align: 'right' } as any,
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end">
          <Button variant="ghost" size="sm" aria-label="Voir les détails" onClick={() => onView(row.original)}>
            <Eye className="h-3.5 w-3.5" />
          </Button>
          {canEdit && (
            <Button variant="ghost" size="sm" aria-label="Modifier" onClick={() => onEdit(row.original)}>
              <Edit className="h-3.5 w-3.5" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost" size="sm" aria-label="Supprimer"
              className="text-destructive hover:text-destructive"
              onClick={() => onDelete(row.original.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];
}

function buildCommitteeColumns(
  onView: (m: CommitteeMember) => void,
  onEdit: (m: CommitteeMember) => void,
  onDelete: (id: string) => void,
  canEdit: boolean,
  canDelete: boolean,
): ColumnDef<CommitteeMember, any>[] {
  return [
    {
      id: 'identite',
      accessorKey: 'nom',
      header: 'Membre',
      meta: { isSticky: true } as any,
      cell: ({ row }) => {
        const { prenom, nom, organisation, presidentRole } = row.original;
        const initiales = `${prenom[0]}${nom[0]}`.toUpperCase();
        return (
          <div className="flex items-center gap-2.5 min-w-[200px]">
            <Avatar initiales={initiales} />
            <div className="flex flex-col gap-0.5 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-semibold text-foreground truncate">{prenom} {nom}</span>
                {presidentRole && <Crown className="h-3 w-3 text-warning shrink-0" aria-label="Président" />}
              </div>
              <span className="text-[11px] text-muted-foreground truncate">{organisation}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'fonction',
      header: 'Fonction',
      cell: ({ getValue }) => <span className="text-[13px] text-foreground">{getValue() as string}</span>,
    },
    {
      accessorKey: 'type',
      header: 'Comité',
      cell: ({ getValue }) => (
        <Badge variant="outline" className="text-[11px] w-max">{getValue() as string}</Badge>
      ),
    },
    {
      accessorKey: 'presidentRole',
      header: 'Rôle',
      cell: ({ getValue }) => {
        const isPres = getValue() as boolean;
        return isPres
          ? <Badge variant="warning" className="text-[11px] w-max">Président</Badge>
          : <Badge variant="secondary" className="text-[11px] w-max">Membre</Badge>;
      },
    },
    {
      accessorKey: 'status',
      header: 'Statut',
      cell: ({ getValue }) => {
        const s = getValue() as ActorStatus;
        return <Badge variant={statusVariant(s)} className="text-[11px] w-max">{s}</Badge>;
      },
    },
    {
      id: 'actions',
      enableHiding: false,
      meta: { align: 'right' } as any,
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end">
          <Button variant="ghost" size="sm" aria-label="Voir les détails" onClick={() => onView(row.original)}>
            <Eye className="h-3.5 w-3.5" />
          </Button>
          {canEdit && (
            <Button variant="ghost" size="sm" aria-label="Modifier" onClick={() => onEdit(row.original)}>
              <Edit className="h-3.5 w-3.5" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost" size="sm" aria-label="Supprimer"
              className="text-destructive hover:text-destructive"
              onClick={() => onDelete(row.original.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];
}

function buildStakeholderColumns(
  onView: (s: Stakeholder) => void,
  onEdit: (s: Stakeholder) => void,
  onDelete: (id: string) => void,
  canEdit: boolean,
  canDelete: boolean,
): ColumnDef<Stakeholder, any>[] {
  return [
    {
      id: 'organisation',
      accessorKey: 'organisation',
      header: 'Organisation',
      meta: { isSticky: true } as any,
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5 min-w-[200px]">
          <span className="text-[13px] font-semibold text-foreground">{row.original.organisation}</span>
          <Badge variant="outline" className="text-[10px] w-max">{row.original.type}</Badge>
        </div>
      ),
    },
    {
      accessorKey: 'representant',
      header: 'Représentant',
      cell: ({ getValue }) => <span className="text-[13px] text-foreground">{getValue() as string}</span>,
    },
    {
      id: 'contact',
      accessorKey: 'email',
      header: 'Contact',
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
            <Mail className="h-3 w-3 shrink-0" aria-hidden="true" />
            {row.original.email}
          </span>
          <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
            <Phone className="h-3 w-3 shrink-0" aria-hidden="true" />
            {row.original.telephone}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'niveauEngagement',
      header: 'Engagement',
      cell: ({ getValue }) => {
        const n = getValue() as string;
        return <Badge variant={engagementVariant(n)} className="text-[11px] w-max">{n}</Badge>;
      },
    },
    {
      accessorKey: 'status',
      header: 'Statut',
      cell: ({ getValue }) => {
        const s = getValue() as ActorStatus;
        return <Badge variant={statusVariant(s)} className="text-[11px] w-max">{s}</Badge>;
      },
    },
    {
      id: 'actions',
      enableHiding: false,
      meta: { align: 'right' } as any,
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end">
          <Button variant="ghost" size="sm" aria-label="Voir les détails" onClick={() => onView(row.original)}>
            <Eye className="h-3.5 w-3.5" />
          </Button>
          {canEdit && (
            <Button variant="ghost" size="sm" aria-label="Modifier" onClick={() => onEdit(row.original)}>
              <Edit className="h-3.5 w-3.5" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost" size="sm" aria-label="Supprimer"
              className="text-destructive hover:text-destructive"
              onClick={() => onDelete(row.original.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];
}

function buildContactColumns(
  onView: (c: Contact) => void,
  onEdit: (c: Contact) => void,
  onDelete: (id: string) => void,
  canEdit: boolean,
  canDelete: boolean,
): ColumnDef<Contact, any>[] {
  return [
    {
      id: 'identite',
      accessorKey: 'nom',
      header: 'Contact',
      meta: { isSticky: true } as any,
      cell: ({ row }) => {
        const { prenom, nom, organisation } = row.original;
        const initiales = `${prenom[0]}${nom[0]}`.toUpperCase();
        return (
          <div className="flex items-center gap-2.5 min-w-[180px]">
            <Avatar initiales={initiales} variant="muted" />
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-[13px] font-semibold text-foreground truncate">{prenom} {nom}</span>
              <span className="text-[11px] text-muted-foreground truncate">{organisation}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'fonction',
      header: 'Fonction',
      cell: ({ getValue }) => (
        <span className="text-[12px] text-muted-foreground leading-snug">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ getValue }) => (
        <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
          <Mail className="h-3 w-3 shrink-0" aria-hidden="true" />
          {getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: 'telephone',
      header: 'Téléphone',
      cell: ({ getValue }) => (
        <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
          <Phone className="h-3 w-3 shrink-0" aria-hidden="true" />
          {getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: 'categorie',
      header: 'Catégorie',
      cell: ({ getValue }) => {
        const cat = getValue() as Contact['categorie'];
        return <Badge variant={categorieVariant(cat)} className="text-[11px] w-max">{cat}</Badge>;
      },
    },
    {
      id: 'actions',
      enableHiding: false,
      meta: { align: 'right' } as any,
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end">
          <Button variant="ghost" size="sm" aria-label="Voir les détails" onClick={() => onView(row.original)}>
            <Eye className="h-3.5 w-3.5" />
          </Button>
          {canEdit && (
            <Button variant="ghost" size="sm" aria-label="Modifier" onClick={() => onEdit(row.original)}>
              <Edit className="h-3.5 w-3.5" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost" size="sm" aria-label="Supprimer"
              className="text-destructive hover:text-destructive"
              onClick={() => onDelete(row.original.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];
}

function buildBailleurColumns(
  onView: (s: Stakeholder) => void,
  onEdit: (s: Stakeholder) => void,
  onDelete: (id: string) => void,
  canEdit: boolean,
  canDelete: boolean,
): ColumnDef<Stakeholder, any>[] {
  return [
    {
      id: 'organisation',
      accessorKey: 'organisation',
      header: 'Bailleur',
      meta: { isSticky: true } as any,
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5 min-w-[200px]">
          <div className="h-8 w-8 rounded-md bg-info/10 text-info flex items-center justify-center shrink-0">
            <Building2 className="h-4 w-4" aria-hidden="true" />
          </div>
          <span className="text-[13px] font-semibold text-foreground">{row.original.organisation}</span>
        </div>
      ),
    },
    {
      accessorKey: 'representant',
      header: 'Représentant',
      cell: ({ getValue }) => <span className="text-[13px] text-foreground">{getValue() as string}</span>,
    },
    {
      id: 'contact',
      accessorKey: 'email',
      header: 'Contact',
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
            <Mail className="h-3 w-3 shrink-0" aria-hidden="true" />
            {row.original.email}
          </span>
          <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
            <Phone className="h-3 w-3 shrink-0" aria-hidden="true" />
            {row.original.telephone}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'niveauEngagement',
      header: 'Engagement',
      cell: ({ getValue }) => {
        const n = getValue() as string;
        return <Badge variant={engagementVariant(n)} className="text-[11px] w-max">{n}</Badge>;
      },
    },
    {
      accessorKey: 'status',
      header: 'Statut',
      cell: ({ getValue }) => {
        const s = getValue() as ActorStatus;
        return <Badge variant={statusVariant(s)} className="text-[11px] w-max">{s}</Badge>;
      },
    },
    {
      id: 'actions',
      enableHiding: false,
      meta: { align: 'right' } as any,
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end">
          <Button variant="ghost" size="sm" aria-label="Voir les détails" onClick={() => onView(row.original)}>
            <Eye className="h-3.5 w-3.5" />
          </Button>
          {canEdit && (
            <Button variant="ghost" size="sm" aria-label="Modifier" onClick={() => onEdit(row.original)}>
              <Edit className="h-3.5 w-3.5" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost" size="sm" aria-label="Supprimer"
              className="text-destructive hover:text-destructive"
              onClick={() => onDelete(row.original.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

export default function ProjectGovernanceTab() {
  const { id: urlProjectId } = useParams<{ id: string }>();
  const activeProjectId = useUIStore(s => s.activeProjectId);
  const projectId = urlProjectId || activeProjectId || '';

  // Miroir des rôles serveur (requireRole) sur les Edge Functions
  // governance-*-create/update/delete — create/update réservés à
  // COORDINATEUR/CHARGE_PROGRAMME/ADMIN/SUPER_ADMIN, delete à ADMIN/SUPER_ADMIN.
  const currentRole = useAuthStore(s => s.user?.role);
  const canManage = !!currentRole && ['COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN', 'SUPER_ADMIN'].includes(currentRole);
  const canDelete = currentRole === 'ADMIN' || currentRole === 'SUPER_ADMIN';

  const { data: teamData = [] }        = useTeamMembers(projectId);
  const { data: committeeData = [] }   = useCommitteeMembers(projectId);
  const { data: stakeholderData = [] } = useStakeholders(projectId);
  const { data: contactData = [] }     = useContacts(projectId);

  const createMutation = useCreateTeamMember(projectId);
  const updateMutation = useUpdateTeamMember(projectId);
  const deleteMutation = useDeleteTeamMember(projectId);

  const createCommitteeMutation = useCreateCommitteeMember(projectId);
  const updateCommitteeMutation = useUpdateCommitteeMember(projectId);
  const deleteCommitteeMutation = useDeleteCommitteeMember(projectId);

  const createStakeholderMutation = useCreateStakeholder(projectId);
  const updateStakeholderMutation = useUpdateStakeholder(projectId);
  const deleteStakeholderMutation = useDeleteStakeholder(projectId);

  const createContactMutation = useCreateContact(projectId);
  const updateContactMutation = useUpdateContact(projectId);
  const deleteContactMutation = useDeleteContact(projectId);

  const [slideOverOpen,  setSlideOverOpen]  = useState(false);
  const [slideOverMode,  setSlideOverMode]  = useState<SlideOverMode>('new');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  const [committeeSlideOverOpen, setCommitteeSlideOverOpen] = useState(false);
  const [committeeSlideOverMode, setCommitteeSlideOverMode] = useState<SlideOverMode>('new');
  const [selectedCommittee, setSelectedCommittee] = useState<CommitteeMember | null>(null);

  const [stakeholderSlideOverOpen, setStakeholderSlideOverOpen] = useState(false);
  const [stakeholderSlideOverMode, setStakeholderSlideOverMode] = useState<SlideOverMode>('new');
  const [selectedStakeholder, setSelectedStakeholder] = useState<Stakeholder | null>(null);
  const [stakeholderDefaultType, setStakeholderDefaultType] = useState<string | undefined>(undefined);

  const [contactSlideOverOpen, setContactSlideOverOpen] = useState(false);
  const [contactSlideOverMode, setContactSlideOverMode] = useState<SlideOverMode>('new');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // Confirmation de suppression — unifiée pour les 4 entités
  type DeleteTarget = { kind: 'team' | 'committee' | 'stakeholder' | 'contact'; id: string };
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  // Bannière d'erreur unique pour les 4 entités (création/modification/
  // suppression) — sans ça, un échec serveur (permission refusée, validation...)
  // passait inaperçu : le panneau se fermait quand même comme si tout s'était
  // bien passé.
  const [actionError, setActionError] = useState<string | null>(null);
  function handleMutationError(err: unknown) {
    setActionError(err instanceof Error ? err.message : 'Une erreur est survenue. Veuillez réessayer.');
  }

  const bailleurs = stakeholderData.filter(s => s.type === 'Bailleur');
  const responsableProjet = teamData.find(m => m.role === 'Responsable Projet');
  const sponsor = teamData.find(m => m.role === 'Sponsor');

  function openView(m: TeamMember)   { setSelectedMember(m); setSlideOverMode('view'); setSlideOverOpen(true); }
  function openEdit(m: TeamMember)   { setSelectedMember(m); setSlideOverMode('edit'); setSlideOverOpen(true); }
  function openDelete(id: string)    { setDeleteTarget({ kind: 'team', id }); }

  function openCommitteeView(m: CommitteeMember) { setSelectedCommittee(m); setCommitteeSlideOverMode('view'); setCommitteeSlideOverOpen(true); }
  function openCommitteeEdit(m: CommitteeMember) { setSelectedCommittee(m); setCommitteeSlideOverMode('edit'); setCommitteeSlideOverOpen(true); }
  function openCommitteeDelete(id: string)       { setDeleteTarget({ kind: 'committee', id }); }
  function openCommitteeNew() { setSelectedCommittee(null); setCommitteeSlideOverMode('new'); setCommitteeSlideOverOpen(true); }

  function openStakeholderView(s: Stakeholder) { setSelectedStakeholder(s); setStakeholderSlideOverMode('view'); setStakeholderSlideOverOpen(true); }
  function openStakeholderEdit(s: Stakeholder) { setSelectedStakeholder(s); setStakeholderSlideOverMode('edit'); setStakeholderSlideOverOpen(true); }
  function openStakeholderDelete(id: string)   { setDeleteTarget({ kind: 'stakeholder', id }); }
  function openStakeholderNew(defaultType?: string) {
    setSelectedStakeholder(null); setStakeholderDefaultType(defaultType);
    setStakeholderSlideOverMode('new'); setStakeholderSlideOverOpen(true);
  }

  function openContactView(c: Contact) { setSelectedContact(c); setContactSlideOverMode('view'); setContactSlideOverOpen(true); }
  function openContactEdit(c: Contact) { setSelectedContact(c); setContactSlideOverMode('edit'); setContactSlideOverOpen(true); }
  function openContactDelete(id: string) { setDeleteTarget({ kind: 'contact', id }); }
  function openContactNew() { setSelectedContact(null); setContactSlideOverMode('new'); setContactSlideOverOpen(true); }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setActionError(null);
    const onSettled = { onSuccess: () => setDeleteTarget(null), onError: handleMutationError };
    if (deleteTarget.kind === 'team') deleteMutation.mutate(deleteTarget.id, onSettled);
    else if (deleteTarget.kind === 'committee') deleteCommitteeMutation.mutate(deleteTarget.id, onSettled);
    else if (deleteTarget.kind === 'stakeholder') deleteStakeholderMutation.mutate(deleteTarget.id, onSettled);
    else if (deleteTarget.kind === 'contact') deleteContactMutation.mutate(deleteTarget.id, onSettled);
  }

  function handleSave(data: Partial<TeamMember>) {
    setActionError(null);
    const onSettled = { onSuccess: () => setSlideOverOpen(false), onError: handleMutationError };
    if (slideOverMode === 'new') {
      createMutation.mutate(data, onSettled);
    } else if (selectedMember) {
      updateMutation.mutate({ id: selectedMember.id, ...data }, onSettled);
    }
  }

  function handleCommitteeSave(data: Partial<CommitteeMember>) {
    setActionError(null);
    const onSettled = { onSuccess: () => setCommitteeSlideOverOpen(false), onError: handleMutationError };
    if (committeeSlideOverMode === 'new') {
      createCommitteeMutation.mutate(data, onSettled);
    } else if (selectedCommittee) {
      updateCommitteeMutation.mutate({ id: selectedCommittee.id, ...data }, onSettled);
    }
  }

  function handleStakeholderSave(data: Partial<Stakeholder>) {
    setActionError(null);
    const onSettled = { onSuccess: () => setStakeholderSlideOverOpen(false), onError: handleMutationError };
    if (stakeholderSlideOverMode === 'new') {
      createStakeholderMutation.mutate(data, onSettled);
    } else if (selectedStakeholder) {
      updateStakeholderMutation.mutate({ id: selectedStakeholder.id, ...data }, onSettled);
    }
  }

  function handleContactSave(data: Partial<Contact>) {
    setActionError(null);
    const onSettled = { onSuccess: () => setContactSlideOverOpen(false), onError: handleMutationError };
    if (contactSlideOverMode === 'new') {
      createContactMutation.mutate(data, onSettled);
    } else if (selectedContact) {
      updateContactMutation.mutate({ id: selectedContact.id, ...data }, onSettled);
    }
  }

  const teamColumns = buildTeamColumns(openView, openEdit, openDelete, canManage, canDelete);
  const committeeColumns = buildCommitteeColumns(openCommitteeView, openCommitteeEdit, openCommitteeDelete, canManage, canDelete);
  const stakeholderColumns = buildStakeholderColumns(openStakeholderView, openStakeholderEdit, openStakeholderDelete, canManage, canDelete);
  const bailleurColumns = buildBailleurColumns(openStakeholderView, openStakeholderEdit, openStakeholderDelete, canManage, canDelete);
  const contactColumns = buildContactColumns(openContactView, openContactEdit, openContactDelete, canManage, canDelete);

  return (
    <section aria-label="Membres & Acteurs" className="flex flex-col gap-6">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
        <div>
          <h1 className="text-base font-bold text-foreground">Membres &amp; Acteurs</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Équipe projet, comités, bailleurs et parties prenantes</p>
        </div>
        {canManage && (
          <Button
            variant="default" size="sm" className="h-8 text-xs"
            onClick={() => { setSelectedMember(null); setSlideOverMode('new'); setSlideOverOpen(true); }}
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
            Ajouter un membre
          </Button>
        )}
      </div>

      {actionError && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive flex items-center justify-between gap-3"
        >
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            {actionError}
          </span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-xs underline opacity-70 hover:opacity-100 shrink-0"
            aria-label="Fermer le message d'erreur"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Acteurs clés */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KeyActorCard member={responsableProjet} label="Responsable Projet" icon={User} />
        <KeyActorCard member={sponsor} label="Sponsor" icon={Star} />
      </div>

      {/* Onglets */}
      <Tabs defaultValue="equipe">
        <TabsList className="h-auto flex-wrap gap-1">
          <TabsTrigger value="equipe">
            Équipe Projet
            <span className="ml-1.5 text-[10px] font-mono bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
              {teamData.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="comite">
            Comité de Pilotage
            <span className="ml-1.5 text-[10px] font-mono bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
              {committeeData.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="bailleurs">
            Bailleurs
            <span className="ml-1.5 text-[10px] font-mono bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
              {bailleurs.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="prenantes">
            Parties Prenantes
            <span className="ml-1.5 text-[10px] font-mono bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
              {stakeholderData.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="contacts">
            Contacts
            <span className="ml-1.5 text-[10px] font-mono bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
              {contactData.length}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* ── Équipe Projet ─────────────────────────────────────────────── */}
        <TabsContent value="equipe" className="mt-4">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Membres de l'équipe projet</CardTitle>
              {canManage && (
                <Button
                  variant="default" size="sm" aria-label="Ajouter un membre"
                  onClick={() => { setSelectedMember(null); setSlideOverMode('new'); setSlideOverOpen(true); }}
                >
                  <Plus className="h-4 w-4 mr-1.5" aria-hidden="true" />
                  Ajouter
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <DataTable
                columns={teamColumns}
                data={teamData}
                searchKey="nom"
                searchPlaceholder="Rechercher un membre..."
                filters={[{
                  id: 'status',
                  title: 'Tous les statuts',
                  options: [
                    { label: 'Actif',     value: 'Actif'    },
                    { label: 'Inactif',   value: 'Inactif'  },
                    { label: 'En congé',  value: 'En congé' },
                  ],
                }]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Comité de Pilotage ─────────────────────────────────────────── */}
        <TabsContent value="comite" className="mt-4">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Membres des comités</CardTitle>
              {canManage && (
                <Button variant="outline" size="sm" aria-label="Ajouter un membre au comité" onClick={openCommitteeNew}>
                  <Plus className="h-4 w-4 mr-1.5" aria-hidden="true" />
                  Ajouter
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <DataTable
                columns={committeeColumns}
                data={committeeData}
                searchKey="nom"
                searchPlaceholder="Rechercher..."
                filters={[{
                  id: 'type',
                  title: 'Type de comité',
                  options: [
                    { label: 'Comité de Pilotage',      value: 'Comité de Pilotage'      },
                    { label: 'Comité Technique',         value: 'Comité Technique'         },
                    { label: 'Comité de Coordination',   value: 'Comité de Coordination'  },
                  ],
                }]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Bailleurs ─────────────────────────────────────────────────── */}
        <TabsContent value="bailleurs" className="mt-4">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Bailleurs de fonds</CardTitle>
              {canManage && (
                <Button variant="outline" size="sm" aria-label="Ajouter un bailleur" onClick={() => openStakeholderNew('Bailleur')}>
                  <Plus className="h-4 w-4 mr-1.5" aria-hidden="true" />
                  Ajouter
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <DataTable
                columns={bailleurColumns}
                data={bailleurs}
                searchKey="organisation"
                searchPlaceholder="Rechercher un bailleur..."
                filters={[{
                  id: 'niveauEngagement',
                  title: 'Engagement',
                  options: [
                    { label: 'Élevé', value: 'Élevé' },
                    { label: 'Moyen', value: 'Moyen' },
                    { label: 'Faible', value: 'Faible' },
                  ],
                }]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Parties Prenantes ─────────────────────────────────────────── */}
        <TabsContent value="prenantes" className="mt-4">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Parties prenantes</CardTitle>
              {canManage && (
                <Button variant="outline" size="sm" aria-label="Ajouter une partie prenante" onClick={() => openStakeholderNew()}>
                  <Plus className="h-4 w-4 mr-1.5" aria-hidden="true" />
                  Ajouter
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <DataTable
                columns={stakeholderColumns}
                data={stakeholderData}
                searchKey="organisation"
                searchPlaceholder="Rechercher une organisation..."
                filters={[
                  {
                    id: 'type',
                    title: 'Type',
                    options: [
                      { label: 'Bailleur',       value: 'Bailleur'       },
                      { label: 'Gouvernement',   value: 'Gouvernement'   },
                      { label: 'ONG Partenaire', value: 'ONG Partenaire' },
                      { label: 'Secteur Privé',  value: 'Secteur Privé'  },
                      { label: 'Société Civile', value: 'Société Civile' },
                      { label: 'Bénéficiaire',   value: 'Bénéficiaire'   },
                    ],
                  },
                  {
                    id: 'niveauEngagement',
                    title: 'Engagement',
                    options: [
                      { label: 'Élevé', value: 'Élevé' },
                      { label: 'Moyen', value: 'Moyen' },
                      { label: 'Faible', value: 'Faible' },
                    ],
                  },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Contacts ──────────────────────────────────────────────────── */}
        <TabsContent value="contacts" className="mt-4">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Annuaire des contacts</CardTitle>
              {canManage && (
                <Button variant="outline" size="sm" aria-label="Ajouter un contact" onClick={openContactNew}>
                  <Plus className="h-4 w-4 mr-1.5" aria-hidden="true" />
                  Ajouter
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <DataTable
                columns={contactColumns}
                data={contactData}
                searchKey="nom"
                searchPlaceholder="Rechercher un contact..."
                filters={[{
                  id: 'categorie',
                  title: 'Catégorie',
                  options: [
                    { label: 'Urgence',       value: 'Urgence'       },
                    { label: 'Technique',     value: 'Technique'     },
                    { label: 'Administratif', value: 'Administratif' },
                    { label: 'Bailleur',      value: 'Bailleur'      },
                  ],
                }]}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── SlideOvers ───────────────────────────────────────────────────── */}
      <TeamMemberSlideOver
        open={slideOverOpen}
        onOpenChange={setSlideOverOpen}
        member={selectedMember}
        mode={slideOverMode}
        onSave={handleSave}
        projectId={projectId}
      />

      <CommitteeMemberSlideOver
        open={committeeSlideOverOpen}
        onOpenChange={setCommitteeSlideOverOpen}
        member={selectedCommittee}
        mode={committeeSlideOverMode}
        onSave={handleCommitteeSave}
      />

      <StakeholderSlideOver
        open={stakeholderSlideOverOpen}
        onOpenChange={setStakeholderSlideOverOpen}
        stakeholder={selectedStakeholder}
        mode={stakeholderSlideOverMode}
        onSave={handleStakeholderSave}
        defaultType={stakeholderDefaultType}
      />

      <ContactSlideOver
        open={contactSlideOverOpen}
        onOpenChange={setContactSlideOverOpen}
        contact={selectedContact}
        mode={contactSlideOverMode}
        onSave={handleContactSave}
      />

      {/* ── Delete Confirmation Modal ──────────────────────────────────── */}
      <Modal open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Confirmer la suppression</ModalTitle>
            <ModalDescription>
              Voulez-vous supprimer cet élément ? Cette action est irréversible.
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <ModalClose asChild>
              <Button variant="outline">Annuler</Button>
            </ModalClose>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              <Trash2 className="h-4 w-4 mr-1.5" aria-hidden="true" />
              Supprimer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </section>
  );
}
