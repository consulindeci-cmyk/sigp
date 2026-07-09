import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { IndicatorType } from '@prisma/client';

/**
 * Champs modifiables : libelle, type, unite, valeurs, sourceVerification, periodicite, actif.
 * `objectiveId` et `code` sont immuables (rattachement + identité stables).
 */
export class UpdateLogframeIndicatorDto {
  @ApiPropertyOptional({ example: 'Taux de couverture vaccinale', maxLength: 2000 })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Le libellé ne peut pas être vide' })
  @MaxLength(2000)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  libelle?: string;

  @ApiPropertyOptional({ enum: IndicatorType })
  @IsOptional()
  @IsEnum(IndicatorType, { message: "Le type d'indicateur est invalide" })
  type?: IndicatorType;

  @ApiPropertyOptional({ example: '%', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  unite?: string;

  @ApiPropertyOptional({ example: 45.5 })
  @IsOptional()
  @IsNumber({}, { message: 'La valeur baseline est invalide' })
  valeurBaseline?: number;

  @ApiPropertyOptional({ example: 90 })
  @IsOptional()
  @IsNumber({}, { message: 'La valeur cible est invalide' })
  valeurCible?: number;

  @ApiPropertyOptional({ example: 62.3 })
  @IsOptional()
  @IsNumber({}, { message: 'La valeur actuelle est invalide' })
  valeurActuelle?: number;

  @ApiPropertyOptional({ example: 'Rapports du ministère de la santé' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  sourceVerification?: string;

  @ApiPropertyOptional({ example: 'Trimestrielle', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  periodicite?: string;

  @ApiPropertyOptional({ description: 'Statut actif/inactif de l’indicateur' })
  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}
