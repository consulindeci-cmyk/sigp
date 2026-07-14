import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateDocumentGlobalDto {
  @ApiProperty({ description: 'Titre du document global', maxLength: 300 })
  @IsString()
  @MaxLength(300)
  titre: string;

  @ApiPropertyOptional({ description: 'Description du document global' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Catégorie de classement', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  categorie?: string;

  @ApiPropertyOptional({ enum: DocumentStatus, description: 'Statut du document (BROUILLON, EN_VALIDATION, VALIDE, ARCHIVE)' })
  @IsOptional()
  @IsEnum(DocumentStatus)
  statut?: DocumentStatus;
}
