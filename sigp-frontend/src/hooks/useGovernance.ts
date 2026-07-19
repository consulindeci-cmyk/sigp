import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { invokeEdgeFunction } from '@/lib/supabaseFunctions'
import type { TeamMember, CommitteeMember, Stakeholder, Contact } from '@/mocks/governanceMocks'

function initialesOf(prenom: string, nom: string): string {
  return `${prenom[0] ?? ''}${nom[0] ?? ''}`.toUpperCase()
}

// ═══════════════════════════════════════════════════════════════════════════
// Vivier de l'organisation — sélecteur partagé Équipe Projet / Comité de
// Pilotage (interdiction stricte de saisie libre à ce niveau, cf. plan
// Phase 1 : on ne pioche que dans les utilisateurs déjà rattachés à
// l'organisation du projet, actifs ou PENDING).
// ═══════════════════════════════════════════════════════════════════════════

export interface OrganisationMemberOption {
  id: string
  nom: string | null
  prenom: string | null
  email: string
  isPending: boolean
  displayName: string
}

export function useOrganisationMembersForPicker(projectId: string) {
  return useQuery({
    queryKey: ['organisation-members-picker', projectId],
    queryFn: async () => {
      const { data: orgId, error: orgError } = await supabase.rpc('project_organisation_id', {
        p_project_id: projectId,
      })
      if (orgError) throw orgError
      if (!orgId) return []

      const { data, error } = await supabase
        .from('users')
        .select('id, nom, prenom, email, derniere_connexion')
        .eq('organisation_id', orgId)
        .eq('actif', true)
        .is('deleted_at', null)
        .order('prenom', { ascending: true })
      if (error) throw error

      return (data as unknown as Array<{
        id: string; nom: string | null; prenom: string | null; email: string; derniere_connexion: string | null
      }>).map((u): OrganisationMemberOption => {
        const isPending = u.derniere_connexion === null
        const identity = u.nom || u.prenom ? `${u.prenom ?? ''} ${u.nom ?? ''}`.trim() : u.email
        return {
          id: u.id,
          nom: u.nom,
          prenom: u.prenom,
          email: u.email,
          isPending,
          displayName: isPending ? `${identity} (invité)` : identity,
        }
      })
    },
    enabled: !!projectId,
  })
}

// ═══════════════════════════════════════════════════════════════════════════
// Équipe Projet
// ═══════════════════════════════════════════════════════════════════════════

interface TeamMemberRow {
  id: string; project_id: string; user_id: string | null; nom: string | null; prenom: string | null
  role: string; structure: string; email: string; telephone: string; statut: string
  date_debut: string | null; created_at: string; updated_at: string
}

const TEAM_MEMBER_SELECT = `
  id, project_id, user_id, nom, prenom, role, structure, email, telephone, statut,
  date_debut, created_at, updated_at
`

function adaptTeamMember(row: TeamMemberRow): TeamMember {
  const isPending = row.nom === null || row.prenom === null
  return {
    id: row.id,
    userId: row.user_id ?? '',
    nom: row.nom ?? '',
    prenom: row.prenom ?? '',
    isPending,
    role: row.role as TeamMember['role'],
    structure: row.structure,
    email: row.email,
    telephone: row.telephone,
    status: row.statut as TeamMember['status'],
    dateDebut: row.date_debut ?? '',
    initiales: isPending ? '…' : initialesOf(row.prenom ?? '', row.nom ?? ''),
  }
}

export function useTeamMembers(projectId: string) {
  return useQuery({
    queryKey: ['governance-team-members', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_team_members')
        .select(TEAM_MEMBER_SELECT)
        .eq('project_id', projectId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(200)
      if (error) throw error
      return (data as unknown as TeamMemberRow[]).map(adaptTeamMember)
    },
    enabled: !!projectId,
  })
}

export function useCreateTeamMember(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (dto: Partial<TeamMember>) => {
      const { data } = await invokeEdgeFunction<{ data: TeamMemberRow }>('governance-team-members-create', {
        projectId,
        userId: dto.userId,
        role: dto.role,
        structure: dto.structure,
        telephone: dto.telephone,
        statut: dto.status,
        dateDebut: dto.dateDebut || undefined,
      })
      return adaptTeamMember(data)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['governance-team-members', projectId] }),
  })
}

export function useUpdateTeamMember(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...dto }: Partial<TeamMember> & { id: string }) => {
      const { data } = await invokeEdgeFunction<{ data: TeamMemberRow }>('governance-team-members-update', {
        id,
        userId: dto.userId,
        role: dto.role,
        structure: dto.structure,
        telephone: dto.telephone,
        statut: dto.status,
        dateDebut: dto.dateDebut || undefined,
      })
      return adaptTeamMember(data)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['governance-team-members', projectId] }),
  })
}

export function useDeleteTeamMember(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await invokeEdgeFunction<{ message: string }>('governance-team-members-delete', { id })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['governance-team-members', projectId] }),
  })
}

// ═══════════════════════════════════════════════════════════════════════════
// Comité de Pilotage
// ═══════════════════════════════════════════════════════════════════════════

interface CommitteeMemberRow {
  id: string; project_id: string; nom: string; prenom: string; fonction: string
  organisation: string; email: string; telephone: string; type: string
  president_role: boolean; statut: string; created_at: string; updated_at: string
}

const COMMITTEE_MEMBER_SELECT = `
  id, project_id, nom, prenom, fonction, organisation, email, telephone, type,
  president_role, statut, created_at, updated_at
`

function adaptCommitteeMember(row: CommitteeMemberRow): CommitteeMember {
  return {
    id: row.id,
    nom: row.nom,
    prenom: row.prenom,
    fonction: row.fonction,
    organisation: row.organisation,
    email: row.email,
    telephone: row.telephone,
    type: row.type as CommitteeMember['type'],
    presidentRole: row.president_role,
    status: row.statut as CommitteeMember['status'],
  }
}

export function useCommitteeMembers(projectId: string) {
  return useQuery({
    queryKey: ['governance-committee-members', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_committee_members')
        .select(COMMITTEE_MEMBER_SELECT)
        .eq('project_id', projectId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(200)
      if (error) throw error
      return (data as unknown as CommitteeMemberRow[]).map(adaptCommitteeMember)
    },
    enabled: !!projectId,
  })
}

export function useCreateCommitteeMember(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (dto: Partial<CommitteeMember>) => {
      const { data } = await invokeEdgeFunction<{ data: CommitteeMemberRow }>('governance-committee-members-create', {
        projectId,
        nom: dto.nom,
        prenom: dto.prenom,
        fonction: dto.fonction,
        organisation: dto.organisation,
        email: dto.email,
        telephone: dto.telephone,
        type: dto.type,
        presidentRole: dto.presidentRole,
        statut: dto.status,
      })
      return adaptCommitteeMember(data)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['governance-committee-members', projectId] }),
  })
}

export function useUpdateCommitteeMember(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...dto }: Partial<CommitteeMember> & { id: string }) => {
      const { data } = await invokeEdgeFunction<{ data: CommitteeMemberRow }>('governance-committee-members-update', {
        id,
        nom: dto.nom,
        prenom: dto.prenom,
        fonction: dto.fonction,
        organisation: dto.organisation,
        email: dto.email,
        telephone: dto.telephone,
        type: dto.type,
        presidentRole: dto.presidentRole,
        statut: dto.status,
      })
      return adaptCommitteeMember(data)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['governance-committee-members', projectId] }),
  })
}

export function useDeleteCommitteeMember(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await invokeEdgeFunction<{ message: string }>('governance-committee-members-delete', { id })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['governance-committee-members', projectId] }),
  })
}

// ═══════════════════════════════════════════════════════════════════════════
// Parties Prenantes (l'onglet "Bailleurs" est un simple filtre type==='Bailleur'
// sur ces mêmes données côté composant, pas une table séparée)
// ═══════════════════════════════════════════════════════════════════════════

interface StakeholderRow {
  id: string; project_id: string; organisation: string; type: string
  representant: string; email: string; telephone: string
  niveau_engagement: string; statut: string; created_at: string; updated_at: string
}

const STAKEHOLDER_SELECT = `
  id, project_id, organisation, type, representant, email, telephone,
  niveau_engagement, statut, created_at, updated_at
`

function adaptStakeholder(row: StakeholderRow): Stakeholder {
  return {
    id: row.id,
    organisation: row.organisation,
    type: row.type as Stakeholder['type'],
    representant: row.representant,
    email: row.email,
    telephone: row.telephone,
    niveauEngagement: row.niveau_engagement as Stakeholder['niveauEngagement'],
    status: row.statut as Stakeholder['status'],
  }
}

export function useStakeholders(projectId: string) {
  return useQuery({
    queryKey: ['governance-stakeholders', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_stakeholders')
        .select(STAKEHOLDER_SELECT)
        .eq('project_id', projectId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(200)
      if (error) throw error
      return (data as unknown as StakeholderRow[]).map(adaptStakeholder)
    },
    enabled: !!projectId,
  })
}

export function useCreateStakeholder(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (dto: Partial<Stakeholder>) => {
      const { data } = await invokeEdgeFunction<{ data: StakeholderRow }>('governance-stakeholders-create', {
        projectId,
        organisation: dto.organisation,
        type: dto.type,
        representant: dto.representant,
        email: dto.email,
        telephone: dto.telephone,
        niveauEngagement: dto.niveauEngagement,
        statut: dto.status,
      })
      return adaptStakeholder(data)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['governance-stakeholders', projectId] }),
  })
}

export function useUpdateStakeholder(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...dto }: Partial<Stakeholder> & { id: string }) => {
      const { data } = await invokeEdgeFunction<{ data: StakeholderRow }>('governance-stakeholders-update', {
        id,
        organisation: dto.organisation,
        type: dto.type,
        representant: dto.representant,
        email: dto.email,
        telephone: dto.telephone,
        niveauEngagement: dto.niveauEngagement,
        statut: dto.status,
      })
      return adaptStakeholder(data)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['governance-stakeholders', projectId] }),
  })
}

export function useDeleteStakeholder(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await invokeEdgeFunction<{ message: string }>('governance-stakeholders-delete', { id })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['governance-stakeholders', projectId] }),
  })
}

// ═══════════════════════════════════════════════════════════════════════════
// Contacts
// ═══════════════════════════════════════════════════════════════════════════

interface ContactRow {
  id: string; project_id: string; nom: string; prenom: string; organisation: string
  email: string; telephone: string; fonction: string; categorie: string
  created_at: string; updated_at: string
}

const CONTACT_SELECT = `
  id, project_id, nom, prenom, organisation, email, telephone, fonction,
  categorie, created_at, updated_at
`

function adaptContact(row: ContactRow): Contact {
  return {
    id: row.id,
    nom: row.nom,
    prenom: row.prenom,
    organisation: row.organisation,
    email: row.email,
    telephone: row.telephone,
    fonction: row.fonction,
    categorie: row.categorie as Contact['categorie'],
  }
}

export function useContacts(projectId: string) {
  return useQuery({
    queryKey: ['governance-contacts', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_contacts')
        .select(CONTACT_SELECT)
        .eq('project_id', projectId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(200)
      if (error) throw error
      return (data as unknown as ContactRow[]).map(adaptContact)
    },
    enabled: !!projectId,
  })
}

export function useCreateContact(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (dto: Partial<Contact>) => {
      const { data } = await invokeEdgeFunction<{ data: ContactRow }>('governance-contacts-create', {
        projectId,
        nom: dto.nom,
        prenom: dto.prenom,
        organisation: dto.organisation,
        email: dto.email,
        telephone: dto.telephone,
        fonction: dto.fonction,
        categorie: dto.categorie,
      })
      return adaptContact(data)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['governance-contacts', projectId] }),
  })
}

export function useUpdateContact(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...dto }: Partial<Contact> & { id: string }) => {
      const { data } = await invokeEdgeFunction<{ data: ContactRow }>('governance-contacts-update', {
        id,
        nom: dto.nom,
        prenom: dto.prenom,
        organisation: dto.organisation,
        email: dto.email,
        telephone: dto.telephone,
        fonction: dto.fonction,
        categorie: dto.categorie,
      })
      return adaptContact(data)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['governance-contacts', projectId] }),
  })
}

export function useDeleteContact(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await invokeEdgeFunction<{ message: string }>('governance-contacts-delete', { id })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['governance-contacts', projectId] }),
  })
}
