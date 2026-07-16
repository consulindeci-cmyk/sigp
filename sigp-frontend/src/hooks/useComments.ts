import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { invokeEdgeFunction } from '@/lib/supabaseFunctions'
import type { CommentaireProjet, ModuleCommentaire, StatutCommentaire, PrioriteCommentaire } from '@/types'

interface CommentRow {
  id: string; project_id: string; module: string; element_id: string; element_nom: string
  auteur_id: string | null; message: string; statut: string; priorite: string
  parent_id: string | null; piece_jointe: string | null; mention: string | null
  lu: boolean; created_at: string; updated_at: string
  auteur: { nom: string; prenom: string; role: string } | { nom: string; prenom: string; role: string }[] | null
}

const COMMENT_SELECT = `
  id, project_id, module, element_id, element_nom, auteur_id, message, statut,
  priorite, parent_id, piece_jointe, mention, lu, created_at, updated_at,
  auteur:users!auteur_id(nom, prenom, role)
`

function adaptComment(row: CommentRow): CommentaireProjet {
  const auteur = Array.isArray(row.auteur) ? row.auteur[0] : row.auteur
  return {
    id: row.id,
    projet_id: row.project_id,
    module: row.module as ModuleCommentaire,
    element_id: row.element_id,
    element_nom: row.element_nom,
    auteur: auteur ? `${auteur.prenom} ${auteur.nom}` : 'Utilisateur supprimé',
    role: auteur?.role ?? '',
    message: row.message,
    date_creation: row.created_at.slice(0, 10),
    date_modification: row.updated_at.slice(0, 10),
    statut: row.statut as StatutCommentaire,
    priorite: row.priorite as PrioriteCommentaire,
    parent_id: row.parent_id,
    piece_jointe: row.piece_jointe,
    mention: row.mention,
    lu: row.lu,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function useComments(projectId: string) {
  return useQuery({
    queryKey: ['project-comments', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_comments')
        .select(COMMENT_SELECT)
        .eq('project_id', projectId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(500)
      if (error) throw error
      return (data as unknown as CommentRow[]).map(adaptComment)
    },
    enabled: !!projectId,
  })
}

export interface CreateCommentDto {
  module: ModuleCommentaire; elementId: string; elementNom?: string; message: string
  statut?: StatutCommentaire; priorite?: PrioriteCommentaire; parentId?: string | null
  pieceJointe?: string | null; mention?: string | null
}

export function useCreateComment(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (dto: CreateCommentDto) => {
      const { data } = await invokeEdgeFunction<{ data: CommentRow }>('comments-create', {
        projectId,
        module: dto.module,
        elementId: dto.elementId,
        elementNom: dto.elementNom,
        message: dto.message,
        statut: dto.statut,
        priorite: dto.priorite,
        parentId: dto.parentId ?? undefined,
        pieceJointe: dto.pieceJointe ?? undefined,
        mention: dto.mention ?? undefined,
      })
      return adaptComment(data)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project-comments', projectId] }),
  })
}

export interface UpdateCommentDto {
  id: string; message?: string; statut?: StatutCommentaire; priorite?: PrioriteCommentaire
  pieceJointe?: string | null; mention?: string | null; lu?: boolean
}

export function useUpdateComment(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (dto: UpdateCommentDto) => {
      const { data } = await invokeEdgeFunction<{ data: CommentRow }>('comments-update', {
        id: dto.id,
        message: dto.message,
        statut: dto.statut,
        priorite: dto.priorite,
        pieceJointe: dto.pieceJointe ?? undefined,
        mention: dto.mention ?? undefined,
        lu: dto.lu,
      })
      return adaptComment(data)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project-comments', projectId] }),
  })
}

export function useDeleteComment(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await invokeEdgeFunction<{ message: string }>('comments-delete', { id })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project-comments', projectId] }),
  })
}
