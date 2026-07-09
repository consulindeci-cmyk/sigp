import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PtbaStatut } from '@prisma/client';

export class CreatePtbaActiviteDto {
  @ApiProperty({
    example: 'a1b2c3d4-0000-0000-0000-ef1234567890',
    description: 'Identifiant du projet (obligatoire)',
  })
  @IsUUID('4', { message: "L'identifiant du projet est invalide" })
  projectId: string;

  @ApiProperty({
    example: 'ACT-2026-01',
    maxLength: 50,
    description: 'Code (normalisé en majuscules)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Le code est obligatoire' })
  @MaxLength(50)
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  code: string;

  @ApiProperty({ example: 'Formation des agents de santé', maxLength: 500 })
  @IsString()
  @IsNotEmpty({ message: 'Le libellé est obligatoire' })
  @MaxLength(500)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  libelle: string;

  @ApiPropertyOptional({ example: 'Sessions de formation trimestrielles' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;

  @ApiPropertyOptional({ enum: PtbaStatut, default: PtbaStatut.NON_DEMARRE })
  @IsOptional()
  @IsEnum(PtbaStatut, { message: 'Le statut est invalide' })
  statut?: PtbaStatut;

  @ApiProperty({ example: 2026, description: 'Année du PTBA' })
  @IsInt({ message: "L'année doit être un entier" })
  @Min(2000)
  @Max(2100)
  annee: number;

  @ApiProperty({ example: 1, description: 'Trimestre (1 à 4)' })
  @IsInt({ message: 'Le trimestre doit être un entier' })
  @Min(1)
  @Max(4)
  trimestre: number;

  @ApiPropertyOptional({
    example: 'b2c3d4e5-0000-0000-0000-ef1234567890',
    description: 'Nœud WBS rattaché',
  })
  @IsOptional()
  @IsUUID('4', { message: "L'identifiant du nœud WBS est invalide" })
  wbsId?: string;

  @ApiPropertyOptional({
    example: 'c3d4e5f6-0000-0000-0000-ef1234567890',
    description: 'Indicateur du cadre logique rattaché',
  })
  @IsOptional()
  @IsUUID('4', { message: "L'identifiant de l'indicateur est invalide" })
  logframeIndicatorId?: string;

  @ApiPropertyOptional({
    example: 'd4e5f6a7-0000-0000-0000-ef1234567890',
    description: 'Responsable (User)',
  })
  @IsOptional()
  @IsUUID('4', { message: "L'identifiant du responsable est invalide" })
  responsableId?: string;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsDateString({}, { message: 'La date de début prévue est invalide' })
  dateDebutPrevue?: string;

  @ApiPropertyOptional({ example: '2026-03-31' })
  @IsOptional()
  @IsDateString({}, { message: 'La date de fin prévue est invalide' })
  dateFinPrevue?: string;

  @ApiPropertyOptional({ example: '2026-01-05' })
  @IsOptional()
  @IsDateString({}, { message: 'La date de début réelle est invalide' })
  dateDebutReelle?: string;

  @ApiPropertyOptional({ example: '2026-03-20' })
  @IsOptional()
  @IsDateString({}, { message: 'La date de fin réelle est invalide' })
  dateFinReelle?: string;

  @ApiPropertyOptional({ example: 5000000, description: 'Montant prévu' })
  @IsOptional()
  @IsNumber({}, { message: 'Le montant prévu est invalide' })
  @Min(0)
  montantPrevu?: number;

  @ApiPropertyOptional({ example: 3200000, description: 'Montant réalisé' })
  @IsOptional()
  @IsNumber({}, { message: 'Le montant réalisé est invalide' })
  @Min(0)
  montantRealise?: number;

  @ApiPropertyOptional({ example: 64, description: 'Taux de réalisation (%)' })
  @IsOptional()
  @IsNumber({}, { message: 'Le taux de réalisation est invalide' })
  @Min(0)
  @Max(100)
  tauxRealisation?: number;
}
