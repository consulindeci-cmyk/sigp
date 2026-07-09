import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentProjet, DocumentStatus } from '@prisma/client';

export class DocumentResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() projectId: string;
  @ApiPropertyOptional() livrableId: string | null;
  @ApiProperty() titre: string;
  @ApiPropertyOptional() description: string | null;
  @ApiProperty({ enum: DocumentStatus }) statut: DocumentStatus;
  @ApiPropertyOptional() createdBy: string | null;
  @ApiPropertyOptional() updatedBy: string | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;

  static fromEntity(entity: DocumentProjet): DocumentResponseDto {
    return {
      id: entity.id,
      projectId: entity.project_id,
      livrableId: entity.livrable_id ?? null,
      titre: entity.titre,
      description: entity.description ?? null,
      statut: entity.statut,
      createdBy: entity.created_by ?? null,
      updatedBy: entity.updated_by ?? null,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at,
    };
  }
}
