import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { IndicatorType } from '@prisma/client';

export class CreateLogframeIndicatorDto {
  @ApiProperty({
    example: 'a1b2c3d4-0000-0000-0000-ef1234567890',
    description: "Identifiant de l'objectif du cadre logique (obligatoire)",
  })
  @IsUUID('4', { message: "L'identifiant de l'objectif est invalide" })
  objectiveId: string;

  @ApiProperty({ example: 'IND-1', maxLength: 30, description: 'Code (normalisé en majuscules)' })
  @IsString()
  @IsNotEmpty({ message: 'Le code est obligatoire' })
  @MaxLength(30)
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  code: string;

  @ApiProperty({ example: 'Taux de couverture vaccinale', maxLength: 2000 })
  @IsString()
  @IsNotEmpty({ message: 'Le libellé est obligatoire' })
  @MaxLength(2000)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  libelle: string;

  @ApiPropertyOptional({ enum: IndicatorType, default: IndicatorType.OUTPUT })
  @IsOptional()
  @IsEnum(IndicatorType, { message: "Le type d'indicateur est invalide" })
  type?: IndicatorType;

  @ApiPropertyOptional({ example: '%', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  unite?: string;

  @ApiPropertyOptional({ example: 45.5, description: 'Valeur de référence (baseline)' })
  @IsOptional()
  @IsNumber({}, { message: 'La valeur baseline est invalide' })
  valeurBaseline?: number;

  @ApiPropertyOptional({ example: 90, description: 'Valeur cible' })
  @IsOptional()
  @IsNumber({}, { message: 'La valeur cible est invalide' })
  valeurCible?: number;

  @ApiPropertyOptional({ example: 62.3, description: 'Valeur actuelle' })
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
}
