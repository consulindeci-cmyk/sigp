import { ApiProperty } from '@nestjs/swagger';
import { Organisation, OrganisationType } from '@prisma/client';

/**
 * Vue publique d'une organisation.
 * N'expose JAMAIS : deleted_at, created_by, updated_by ni aucune donnée interne.
 */
export class OrganisationResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-0000-0000-0000-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'MIN-SANTE' })
  code: string;

  @ApiProperty({ example: 'Ministère de la Santé' })
  nom: string;

  @ApiProperty({ enum: OrganisationType, example: OrganisationType.MINISTERE })
  type: OrganisationType;

  @ApiProperty({ example: 'Institution publique de santé', nullable: true })
  description: string | null;

  @ApiProperty({ example: 'contact@sante.gouv', nullable: true })
  email: string | null;

  @ApiProperty({ example: '+2250102030405', nullable: true })
  telephone: string | null;

  @ApiProperty({ example: 'https://sante.gouv', nullable: true })
  siteWeb: string | null;

  @ApiProperty({ example: true })
  actif: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  /** Mappe une entité Prisma vers la vue publique en excluant tout champ interne. */
  static fromEntity(org: Organisation): OrganisationResponseDto {
    return {
      id: org.id,
      code: org.code,
      nom: org.nom,
      type: org.type,
      description: org.description,
      email: org.email,
      telephone: org.telephone,
      siteWeb: org.site_web,
      actif: org.actif,
      createdAt: org.created_at,
      updatedAt: org.updated_at,
    };
  }
}
