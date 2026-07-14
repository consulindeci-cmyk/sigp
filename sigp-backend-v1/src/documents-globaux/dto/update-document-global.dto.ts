import { ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateDocumentGlobalDto {
  @ApiPropertyOptional({ description: 'Titre du document global', maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  titre?: string;

  @ApiPropertyOptional({ description: 'Description du document global' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Catégorie de classement', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  categorie?: string;

  @ApiPropertyOptional({ enum: DocumentStatus, description: 'Statut du document' })
  @IsOptional()
  @IsEnum(DocumentStatus)
  statut?: DocumentStatus;
}
