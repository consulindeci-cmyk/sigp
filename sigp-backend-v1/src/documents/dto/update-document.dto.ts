import { ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateDocumentDto {
  // projectId absent intentionnellement — non modifiable après création

  @ApiPropertyOptional({ description: 'Livrable associé (UUID)' })
  @IsOptional()
  @IsUUID()
  livrableId?: string;

  @ApiPropertyOptional({ description: 'Titre du document', maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  titre?: string;

  @ApiPropertyOptional({ description: 'Description détaillée' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: DocumentStatus, description: 'Statut du document' })
  @IsOptional()
  @IsEnum(DocumentStatus)
  statut?: DocumentStatus;
}
