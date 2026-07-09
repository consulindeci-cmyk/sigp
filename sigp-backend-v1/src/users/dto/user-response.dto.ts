import { ApiProperty } from '@nestjs/swagger';
import { User, UserRole } from '@prisma/client';

/**
 * Vue publique d'un utilisateur.
 * N'expose JAMAIS : mot_de_passe, refresh_tokens, hash, deleted_at ni aucune donnée interne.
 */
export class UserResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-0000-0000-0000-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'Doe' })
  nom: string;

  @ApiProperty({ example: 'John' })
  prenom: string;

  @ApiProperty({ example: 'john.doe@sigp.local' })
  email: string;

  @ApiProperty({ enum: UserRole, example: UserRole.VIEWER })
  role: UserRole;

  @ApiProperty({ example: true })
  actif: boolean;

  @ApiProperty({ example: '+2250102030405', nullable: true })
  telephone: string | null;

  @ApiProperty({ example: 'fr' })
  languePreference: string;

  @ApiProperty({ example: null, nullable: true })
  avatarUrl: string | null;

  @ApiProperty({ example: null, nullable: true })
  derniereConnexion: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  /** Mappe une entité Prisma vers la vue publique en excluant tout champ sensible. */
  static fromEntity(user: User): UserResponseDto {
    return {
      id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      role: user.role,
      actif: user.actif,
      telephone: user.telephone,
      languePreference: user.langue_preference,
      avatarUrl: user.avatar_url,
      derniereConnexion: user.derniere_connexion,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  }
}
