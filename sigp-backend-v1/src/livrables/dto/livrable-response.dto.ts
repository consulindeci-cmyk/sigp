import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Livrable, LivrableStatus } from '@prisma/client';

export class LivrableResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() projectId: string;
  @ApiPropertyOptional() wbsId: string | null;
  @ApiPropertyOptional() code: string | null;
  @ApiProperty() nom: string;
  @ApiPropertyOptional() description: string | null;
  @ApiProperty({ enum: LivrableStatus }) statut: LivrableStatus;
  @ApiPropertyOptional() datePrevue: Date | null;
  @ApiPropertyOptional() dateSoumission: Date | null;
  @ApiPropertyOptional() dateValidation: Date | null;
  @ApiPropertyOptional() responsableId: string | null;
  @ApiPropertyOptional() validateurId: string | null;
  @ApiPropertyOptional() notes: string | null;
  @ApiPropertyOptional() createdBy: string | null;
  @ApiPropertyOptional() updatedBy: string | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;

  static fromEntity(entity: Livrable): LivrableResponseDto {
    return {
      id: entity.id,
      projectId: entity.project_id,
      wbsId: entity.wbs_id ?? null,
      code: entity.code ?? null,
      nom: entity.nom,
      description: entity.description ?? null,
      statut: entity.statut,
      datePrevue: entity.date_prevue ?? null,
      dateSoumission: entity.date_soumission ?? null,
      dateValidation: entity.date_validation ?? null,
      responsableId: entity.responsable_id ?? null,
      validateurId: entity.validateur_id ?? null,
      notes: entity.notes ?? null,
      createdBy: entity.created_by ?? null,
      updatedBy: entity.updated_by ?? null,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at,
    };
  }
}
