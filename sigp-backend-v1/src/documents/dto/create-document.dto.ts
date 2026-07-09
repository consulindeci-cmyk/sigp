import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateDocumentDto {
  @ApiProperty({ description: 'Identifiant du projet' })
  @IsUUID()
  projectId: string;

  @ApiPropertyOptional({ description: 'Livrable associé (UUID)' })
  @IsOptional()
  @IsUUID()
  livrableId?: string;

  @ApiProperty({ description: 'Titre du document', maxLength: 300 })
  @IsString()
  @MaxLength(300)
  titre: string;

  @ApiPropertyOptional({ description: 'Description détaillée' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: DocumentStatus, description: 'Statut initial (défaut : BROUILLON)' })
  @IsOptional()
  @IsEnum(DocumentStatus)
  statut?: DocumentStatus;
}
