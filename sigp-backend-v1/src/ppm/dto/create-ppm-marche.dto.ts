import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { PpmMarcheStatus, PpmTypeMarche } from '@prisma/client';

export class CreatePpmMarcheDto {
  @ApiProperty({ description: 'Identifiant du projet' })
  @IsUUID()
  projectId: string;

  @ApiProperty({ description: 'Code unique du marché dans le projet', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({ description: 'Intitulé du marché', maxLength: 500 })
  @IsString()
  @MaxLength(500)
  intitule: string;

  @ApiProperty({ enum: PpmTypeMarche, description: 'Type de marché' })
  @IsEnum(PpmTypeMarche)
  type: PpmTypeMarche;

  @ApiPropertyOptional({ enum: PpmMarcheStatus, default: PpmMarcheStatus.EN_PREPARATION })
  @IsOptional()
  @IsEnum(PpmMarcheStatus)
  statut?: PpmMarcheStatus;

  @ApiPropertyOptional({ description: 'Montant estimé' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  montantEstime?: number;

  @ApiPropertyOptional({ description: 'Montant signé' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  montantSigne?: number;

  @ApiPropertyOptional({ description: 'Date de lancement prévue (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dateLancementPrevu?: string;

  @ApiPropertyOptional({ description: 'Date de soumission prévue (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dateSoumissionPrevu?: string;

  @ApiPropertyOptional({ description: "Date d'attribution (ISO 8601)" })
  @IsOptional()
  @IsDateString()
  dateAttribution?: string;

  @ApiPropertyOptional({ description: 'Date de signature (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dateSignature?: string;

  @ApiPropertyOptional({ description: 'Date de fin prévue (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dateFinPrevue?: string;

  @ApiPropertyOptional({ description: 'Date de fin effective (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dateFinEffective?: string;

  @ApiPropertyOptional({ description: 'Titulaire du marché', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  titulaire?: string;

  @ApiPropertyOptional({ description: 'Notes libres' })
  @IsOptional()
  @IsString()
  notes?: string;
}
