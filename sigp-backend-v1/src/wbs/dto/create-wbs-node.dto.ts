import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { WbsNodeType } from '@prisma/client';

export class CreateWbsNodeDto {
  @ApiProperty({
    example: 'a1b2c3d4-0000-0000-0000-ef1234567890',
    description: 'Identifiant du projet (obligatoire)',
  })
  @IsUUID('4', { message: "L'identifiant du projet est invalide" })
  projectId: string;

  @ApiProperty({ example: 'WBS-1.1', maxLength: 30, description: 'Code (normalisé en majuscules)' })
  @IsString()
  @IsNotEmpty({ message: 'Le code est obligatoire' })
  @MaxLength(30)
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  code: string;

  @ApiProperty({ example: 'Phase de préparation', maxLength: 500 })
  @IsString()
  @IsNotEmpty({ message: 'Le libellé est obligatoire' })
  @MaxLength(500)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  libelle: string;

  @ApiProperty({ enum: WbsNodeType, description: 'Type de nœud WBS' })
  @IsEnum(WbsNodeType, { message: 'Le type de nœud est invalide' })
  type: WbsNodeType;

  @ApiPropertyOptional({
    example: 'b2c3d4e5-0000-0000-0000-ef1234567890',
    description: 'Nœud parent (hiérarchie WBS)',
  })
  @IsOptional()
  @IsUUID('4', { message: "L'identifiant du nœud parent est invalide" })
  parentId?: string;

  @ApiPropertyOptional({
    example: 'c3d4e5f6-0000-0000-0000-ef1234567890',
    description: 'Objectif du cadre logique rattaché (optionnel)',
  })
  @IsOptional()
  @IsUUID('4', { message: "L'identifiant de l'objectif est invalide" })
  objectiveId?: string;

  @ApiPropertyOptional({
    example: 'd4e5f6a7-0000-0000-0000-ef1234567890',
    description: 'Responsable (User)',
  })
  @IsOptional()
  @IsUUID('4', { message: "L'identifiant du responsable est invalide" })
  responsableId?: string;

  @ApiPropertyOptional({ example: 0, default: 0, description: 'Ordre d’affichage' })
  @IsOptional()
  @IsInt({ message: "L'ordre doit être un entier" })
  @Min(0)
  ordre?: number;

  @ApiPropertyOptional({ example: '2026-01-01', description: 'Date de début (ISO)' })
  @IsOptional()
  @IsDateString({}, { message: 'La date de début est invalide' })
  dateDebut?: string;

  @ApiPropertyOptional({ example: '2026-03-31', description: 'Date de fin (ISO)' })
  @IsOptional()
  @IsDateString({}, { message: 'La date de fin est invalide' })
  dateFin?: string;
}
