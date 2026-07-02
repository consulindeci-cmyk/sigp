import React, { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Edit, Trash2, User, Mail, Phone, X, Crown, Star, Eye, Building2 } from 'lucide-react';
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
  mockTeamMembers,
  mockCommitteeMembers,
  mockStakeholders,
  mockContacts,
  mockResponsableProjet,
  mockSponsor,
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

function KeyActorCard({ member, label, icon: Icon }: { member: TeamMember; label: string; icon: React.ElementType }) {
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
            <p className="text-[14px] font-semibold text-foreground truncate">{member.prenom} {member.nom}</p>
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
  prenom:    string;
  nom:       string;
  role:      string;
  structure: string;
  email:     string;
  telephone: string;
  dateDebut: string;
  status:    string;
}

type TeamFormErrors = Partial<Record<keyof TeamFormValues, string>>;

const EMPTY_TEAM: TeamFormValues = {
  prenom: '', nom: '', role: '', structure: '',
  email: '', telephone: '', dateDebut: '', status: 'Actif',
};

function memberToForm(m: TeamMember): TeamFormValues {
  return {
    prenom:    m.prenom,
    nom:       m.nom,
    role:      m.role,
    structure: m.structure,
    email:     m.email,
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
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: TeamMember | null;
  mode: SlideOverMode;
  onSave?: (data: Partial<TeamMember>) => void;
}) {
  const [values, setValues] = useState<TeamFormValues>(EMPTY_TEAM);
  const [errors, setErrors] = useState<TeamFormErrors>({});
  const readOnly = mode === 'view';

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
    if (!values.prenom.trim())    errs.prenom    = 'Requis';
    if (!values.nom.trim())       errs.nom       = 'Requis';
    if (!values.role.trim())      errs.role      = 'Requis';
    if (!values.email.trim())     errs.email     = 'Requis';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    const prenom    = values.prenom.trim();
    const nom       = values.nom.trim();
    const initiales = `${prenom[0] ?? ''}${nom[0] ?? ''}`.toUpperCase();
    onSave?.({
      prenom,
      nom,
      initiales,
      role:      values.role as TeamMember['role'],
      structure: values.structure.trim(),
      email:     values.email.trim(),
      telephone: values.telephone.trim(),
      dateDebut: values.dateDebut,
      status:    values.status as ActorStatus,
    });
  }

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
                  <p className="text-lg font-semibold text-foreground">{member.prenom} {member.nom}</p>
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
              <FRow id="gov-prenom" label="Prénom" error={errors.prenom}>
                <Input
                  id="gov-prenom"
                  value={values.prenom}
                  onChange={e => set('prenom', e.target.value)}
                  placeholder="Prénom"
                />
              </FRow>

              <FRow id="gov-nom" label="Nom" error={errors.nom}>
                <Input
                  id="gov-nom"
                  value={values.nom}
                  onChange={e => set('nom', e.target.value)}
                  placeholder="Nom"
                />
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

              <FRow id="gov-email" label="Email" error={errors.email}>
                <Input
                  id="gov-email"
                  type="email"
                  value={values.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="email@exemple.com"
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
// Column builders
// ─────────────────────────────────────────────────────────────────────────────

function buildTeamColumns(
  onView: (m: TeamMember) => void,
  onEdit: (m: TeamMember) => void,
  onDelete: (id: string) => void,
): ColumnDef<TeamMember, any>[] {
  return [
    {
      id: 'identite',
      accessorKey: 'nom',
      header: 'Membre',
      meta: { isSticky: true } as any,
      cell: ({ row }) => {
        const { initiales, prenom, nom, structure } = row.original;
        return (
          <div className="flex items-center gap-2.5 min-w-[180px]">
            <Avatar initiales={initiales} />
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-[13px] font-semibold text-foreground truncate">{prenom} {nom}</span>
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
          <Button variant="ghost" size="sm" aria-label="Modifier" onClick={() => onEdit(row.original)}>
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost" size="sm" aria-label="Supprimer"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(row.original.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];
}

function buildCommitteeColumns(): ColumnDef<CommitteeMember, any>[] {
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
  ];
}

function buildStakeholderColumns(): ColumnDef<Stakeholder, any>[] {
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
  ];
}

function buildContactColumns(): ColumnDef<Contact, any>[] {
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
  ];
}

function buildBailleurColumns(): ColumnDef<Stakeholder, any>[] {
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
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

export default function ProjectGovernanceTab() {
  const [teamData,       setTeamData]       = useState<TeamMember[]>(mockTeamMembers);
  const [slideOverOpen,  setSlideOverOpen]  = useState(false);
  const [slideOverMode,  setSlideOverMode]  = useState<SlideOverMode>('new');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  // Delete confirmation
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [memberToDelete,  setMemberToDelete]  = useState<string | null>(null);

  const bailleurs = mockStakeholders.filter(s => s.type === 'Bailleur');

  function openView(m: TeamMember)   { setSelectedMember(m); setSlideOverMode('view'); setSlideOverOpen(true); }
  function openEdit(m: TeamMember)   { setSelectedMember(m); setSlideOverMode('edit'); setSlideOverOpen(true); }
  function openDelete(id: string)    { setMemberToDelete(id); setDeleteModalOpen(true); }

  function handleDeleteConfirm() {
    if (memberToDelete) setTeamData(prev => prev.filter(m => m.id !== memberToDelete));
    setDeleteModalOpen(false);
    setMemberToDelete(null);
  }

  function handleSave(data: Partial<TeamMember>) {
    if (slideOverMode === 'new') {
      const newMember: TeamMember = {
        id:         `tm-${Date.now()}`,
        prenom:     data.prenom     ?? '',
        nom:        data.nom        ?? '',
        initiales:  data.initiales  ?? '',
        role:       data.role       ?? 'Coordinateur',
        structure:  data.structure  ?? '',
        email:      data.email      ?? '',
        telephone:  data.telephone  ?? '',
        dateDebut:  data.dateDebut  ?? '',
        status:     data.status     ?? 'Actif',
      };
      setTeamData(prev => [newMember, ...prev]);
    } else if (selectedMember) {
      setTeamData(prev => prev.map(m =>
        m.id === selectedMember.id ? { ...m, ...data } : m
      ));
    }
    setSlideOverOpen(false);
  }

  const teamColumns = buildTeamColumns(openView, openEdit, openDelete);

  return (
    <section aria-label="Gouvernance & Acteurs" className="flex flex-col gap-6">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
        <div>
          <h1 className="text-base font-bold text-foreground">Gouvernance &amp; Acteurs</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Équipe projet, comités, bailleurs et parties prenantes</p>
        </div>
        <Button
          variant="default" size="sm" className="h-8 text-xs"
          onClick={() => { setSelectedMember(null); setSlideOverMode('new'); setSlideOverOpen(true); }}
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
          Ajouter un membre
        </Button>
      </div>

      {/* Acteurs clés */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KeyActorCard member={mockResponsableProjet} label="Responsable Projet" icon={User} />
        <KeyActorCard member={mockSponsor} label="Sponsor" icon={Star} />
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
              {mockCommitteeMembers.length}
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
              {mockStakeholders.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="contacts">
            Contacts
            <span className="ml-1.5 text-[10px] font-mono bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
              {mockContacts.length}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* ── Équipe Projet ─────────────────────────────────────────────── */}
        <TabsContent value="equipe" className="mt-4">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Membres de l'équipe projet</CardTitle>
              <Button
                variant="default" size="sm" aria-label="Ajouter un membre"
                onClick={() => { setSelectedMember(null); setSlideOverMode('new'); setSlideOverOpen(true); }}
              >
                <Plus className="h-4 w-4 mr-1.5" aria-hidden="true" />
                Ajouter
              </Button>
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
              <Button variant="outline" size="sm" aria-label="Ajouter un membre au comité">
                <Plus className="h-4 w-4 mr-1.5" aria-hidden="true" />
                Ajouter
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable
                columns={buildCommitteeColumns()}
                data={mockCommitteeMembers}
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
              <Button variant="outline" size="sm" aria-label="Ajouter un bailleur">
                <Plus className="h-4 w-4 mr-1.5" aria-hidden="true" />
                Ajouter
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable
                columns={buildBailleurColumns()}
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
              <Button variant="outline" size="sm" aria-label="Ajouter une partie prenante">
                <Plus className="h-4 w-4 mr-1.5" aria-hidden="true" />
                Ajouter
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable
                columns={buildStakeholderColumns()}
                data={mockStakeholders}
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
              <Button variant="outline" size="sm" aria-label="Ajouter un contact">
                <Plus className="h-4 w-4 mr-1.5" aria-hidden="true" />
                Ajouter
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable
                columns={buildContactColumns()}
                data={mockContacts}
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

      {/* ── SlideOver ────────────────────────────────────────────────────── */}
      <TeamMemberSlideOver
        open={slideOverOpen}
        onOpenChange={setSlideOverOpen}
        member={selectedMember}
        mode={slideOverMode}
        onSave={handleSave}
      />

      {/* ── Delete Confirmation Modal ──────────────────────────────────── */}
      <Modal open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Confirmer la suppression</ModalTitle>
            <ModalDescription>
              Voulez-vous supprimer ce membre de l'équipe ? Cette action est irréversible.
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
