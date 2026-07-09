import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LivrableStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateLivrableDto {
  @ApiProperty({ description: 'Identifiant du projet' })
  @IsUUID()
  projectId: string;

  @ApiPropertyOptional({ description: 'Nœud WBS associé' })
  @IsOptional()
  @IsUUID()
  wbsId?: string;

  @ApiPropertyOptional({ description: 'Code unique du livrable', maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  code?: string;

  @ApiProperty({ description: 'Nom du livrable', maxLength: 300 })
  @IsString()
  @MaxLength(300)
  nom: string;

  @ApiPropertyOptional({ description: 'Description détaillée' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    enum: LivrableStatus,
    description: 'Statut initial (défaut : NON_COMMENCE)',
  })
  @IsOptional()
  @IsEnum(LivrableStatus)
  statut?: LivrableStatus;

  @ApiPropertyOptional({ description: 'Date prévue (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  datePrevue?: string;

  @ApiPropertyOptional({ description: 'Date de soumission (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dateSoumission?: string;

  @ApiPropertyOptional({ description: 'Date de validation (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dateValidation?: string;

  @ApiPropertyOptional({ description: 'Responsable du livrable (UUID)' })
  @IsOptional()
  @IsUUID()
  responsableId?: string;

  @ApiPropertyOptional({ description: 'Validateur du livrable (UUID)' })
  @IsOptional()
  @IsUUID()
  validateurId?: string;

  @ApiPropertyOptional({ description: 'Notes libres' })
  @IsOptional()
  @IsString()
  notes?: string;
}
