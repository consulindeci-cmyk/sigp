import { ApiProperty } from '@nestjs/swagger';
import { FundingSource, FundingSourceType } from '@prisma/client';

export class FundingSourceResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-0000-4000-8000-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'b2c3d4e5-0000-4000-8000-ef1234567890' })
  projectId: string;

  @ApiProperty({ example: 'Banque Mondiale' })
  nom: string;

  @ApiProperty({ enum: FundingSourceType, example: FundingSourceType.BAILLEUR })
  type: FundingSourceType;

  @ApiProperty({ example: 5000000000 })
  montant: number;

  @ApiProperty({ example: 75.5, nullable: true })
  pourcentage: number | null;

  @ApiProperty({ example: 'XOF' })
  devise: string;

  @ApiProperty({ example: '2026-01-15T00:00:00.000Z', nullable: true })
  dateAccord: Date | null;

  @ApiProperty({ example: '2030-12-31T00:00:00.000Z', nullable: true })
  dateExpiry: Date | null;

  @ApiProperty({ example: 'jean.dupont@worldbank.org', nullable: true })
  contact: string | null;

  @ApiProperty({ example: 'Financement composante 1 du projet', nullable: true })
  notes: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromEntity(entity: FundingSource): FundingSourceResponseDto {
    return {
      id: entity.id,
      projectId: entity.project_id,
      nom: entity.nom,
      type: entity.type,
      montant: Number(entity.montant),
      pourcentage:
        entity.pourcentage !== null && entity.pourcentage !== undefined
          ? Number(entity.pourcentage)
          : null,
      devise: entity.devise,
      dateAccord: entity.date_accord ?? null,
      dateExpiry: entity.date_expiry ?? null,
      contact: entity.contact ?? null,
      notes: entity.notes ?? null,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at,
    };
  }
}
