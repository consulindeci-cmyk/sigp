import { ApiProperty } from '@nestjs/swagger';
import { BudgetLigne } from '@prisma/client';

export class BudgetLineResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-0000-4000-8000-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'a1b2c3d4-0000-4000-8000-ef1234567890' })
  versionId: string;

  @ApiProperty({ example: 'b2c3d4e5-0000-4000-8000-ef1234567890', nullable: true })
  parentId: string | null;

  @ApiProperty({ example: 'PERS-001' })
  codeLigne: string;

  @ApiProperty({ example: 'Personnel permanent' })
  libelle: string;

  @ApiProperty({ example: 'Ressources humaines', nullable: true })
  categorie: string | null;

  @ApiProperty({ example: 50000000 })
  montantPrevu: number;

  @ApiProperty({ example: 10000000 })
  montantEngage: number;

  @ApiProperty({ example: 5000000 })
  montantPaye: number;

  @ApiProperty({ example: 1 })
  ordre: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromEntity(entity: BudgetLigne): BudgetLineResponseDto {
    return {
      id: entity.id,
      versionId: entity.version_id,
      parentId: entity.parent_id ?? null,
      codeLigne: entity.code_ligne,
      libelle: entity.libelle,
      categorie: entity.categorie ?? null,
      montantPrevu: Number(entity.montant_prevu),
      montantEngage: Number(entity.montant_engage),
      montantPaye: Number(entity.montant_paye),
      ordre: entity.ordre,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at,
    };
  }
}
