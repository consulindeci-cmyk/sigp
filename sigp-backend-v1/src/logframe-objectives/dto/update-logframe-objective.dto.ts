import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { LogframeLevel } from '@prisma/client';

/**
 * Champs modifiables : niveau, libelle, description, parentId, ordre, actif.
 * `projectId` et `code` sont immuables (identité + rattachement stables).
 */
export class UpdateLogframeObjectiveDto {
  @ApiPropertyOptional({ enum: LogframeLevel })
  @IsOptional()
  @IsEnum(LogframeLevel, { message: 'Le niveau est invalide' })
  niveau?: LogframeLevel;

  @ApiPropertyOptional({ example: 'Améliorer l’accès aux soins', maxLength: 2000 })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Le libellé ne peut pas être vide' })
  @MaxLength(2000)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  libelle?: string;

  @ApiPropertyOptional({ example: 'Description détaillée' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;

  @ApiPropertyOptional({ example: 'b2c3d4e5-0000-0000-0000-ef1234567890' })
  @IsOptional()
  @IsUUID('4', { message: "L'identifiant de l'objectif parent est invalide" })
  parentId?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt({ message: "L'ordre doit être un entier" })
  @Min(0)
  ordre?: number;

  @ApiPropertyOptional({ description: 'Statut actif/inactif de l’objectif' })
  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}
