import { ApiProperty } from '@nestjs/swagger';
import { Comment, User } from '@prisma/client';

type CommentWithUser = Comment & { user: Pick<User, 'nom' | 'prenom' | 'role' | 'avatar_url'> };

/**
 * Vue publique d'un commentaire.
 * Mappe le modèle Prisma vers la forme attendue par le frontend (CommentaireProjet).
 * N'expose JAMAIS : deleted_at, mot_de_passe ni données internes.
 */
export class CommentResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-0000-0000-0000-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'a1b2c3d4-0000-0000-0000-ef1234567890' })
  projet_id: string;

  @ApiProperty({ example: 'Projet', nullable: true })
  module: string | null;

  @ApiProperty({ example: 'PRJ-001', nullable: true })
  element_id: string | null;

  @ApiProperty({ example: 'Informations générales', nullable: true })
  element_nom: string | null;

  @ApiProperty({ example: 'Amadou Diallo' })
  auteur: string;

  @ApiProperty({ example: 'ADMIN' })
  role: string;

  @ApiProperty({ example: 'Commentaire sur le projet' })
  message: string;

  @ApiProperty({ example: '2026-07-09' })
  date_creation: string;

  @ApiProperty({ example: '2026-07-09' })
  date_modification: string;

  @ApiProperty({ example: 'OUVERT' })
  statut: string;

  @ApiProperty({ example: 'NORMALE' })
  priorite: string;

  @ApiProperty({ example: 'b2c3d4e5-0000-0000-0000-ef1234567890', nullable: true })
  parent_id: string | null;

  @ApiProperty({ example: 'document.pdf', nullable: true })
  piece_jointe: string | null;

  @ApiProperty({ example: '@Fatoumata Koné', nullable: true })
  mention: string | null;

  @ApiProperty({ example: false })
  lu: boolean;

  @ApiProperty({ example: '2026-07-09T08:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-07-09T08:00:00.000Z' })
  updatedAt: string;

  static fromEntity(comment: CommentWithUser): CommentResponseDto {
    const { user } = comment;
    return {
      id: comment.id,
      projet_id: comment.project_id,
      module: comment.module,
      element_id: comment.element_id,
      element_nom: comment.element_nom,
      auteur: `${user.prenom} ${user.nom}`.trim(),
      role: user.role as string,
      message: comment.message,
      date_creation: comment.created_at.toISOString().slice(0, 10),
      date_modification: comment.updated_at.toISOString().slice(0, 10),
      statut: comment.statut,
      priorite: comment.priorite,
      parent_id: comment.parent_id,
      piece_jointe: comment.piece_jointe,
      mention: comment.mention,
      lu: comment.lu,
      createdAt: comment.created_at.toISOString(),
      updatedAt: comment.updated_at.toISOString(),
    };
  }
}
