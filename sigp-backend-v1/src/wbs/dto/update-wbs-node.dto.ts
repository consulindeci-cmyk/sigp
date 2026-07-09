import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
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

/**
 * Champs modifiables : libelle, type, parentId, objectiveId, responsableId, ordre,
 * dates, actif. `projectId` et `code` sont immuables.
 * `niveau` est recalculé par le service selon le parent (jamais fourni par le client).
 */
export class UpdateWbsNodeDto {
  @ApiPropertyOptional({ example: 'Phase de préparation', maxLength: 500 })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Le libellé ne peut pas être vide' })
  @MaxLength(500)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  libelle?: string;

  @ApiPropertyOptional({ enum: WbsNodeType })
  @IsOptional()
  @IsEnum(WbsNodeType, { message: 'Le type de nœud est invalide' })
  type?: WbsNodeType;

  @ApiPropertyOptional({ example: 'b2c3d4e5-0000-0000-0000-ef1234567890' })
  @IsOptional()
  @IsUUID('4', { message: "L'identifiant du nœud parent est invalide" })
  parentId?: string;

  @ApiPropertyOptional({ example: 'c3d4e5f6-0000-0000-0000-ef1234567890' })
  @IsOptional()
  @IsUUID('4', { message: "L'identifiant de l'objectif est invalide" })
  objectiveId?: string;

  @ApiPropertyOptional({ example: 'd4e5f6a7-0000-0000-0000-ef1234567890' })
  @IsOptional()
  @IsUUID('4', { message: "L'identifiant du responsable est invalide" })
  responsableId?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt({ message: "L'ordre doit être un entier" })
  @Min(0)
  ordre?: number;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsDateString({}, { message: 'La date de début est invalide' })
  dateDebut?: string;

  @ApiPropertyOptional({ example: '2026-03-31' })
  @IsOptional()
  @IsDateString({}, { message: 'La date de fin est invalide' })
  dateFin?: string;

  @ApiPropertyOptional({ description: 'Statut actif/inactif du nœud' })
  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}
