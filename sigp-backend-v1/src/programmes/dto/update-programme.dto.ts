import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ProgrammeStatus } from '@prisma/client';

/**
 * Champs modifiables uniquement : nom, description, statut, actif.
 * `code` et `uniteId` sont volontairement immuables (identité + rattachement stables).
 */
export class UpdateProgrammeDto {
  @ApiPropertyOptional({ example: 'Programme Santé Rurale Étendu', maxLength: 200 })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Le nom ne peut pas être vide' })
  @MaxLength(200)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  nom?: string;

  @ApiPropertyOptional({ example: 'Programme d’amélioration de la santé en milieu rural' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;

  @ApiPropertyOptional({ enum: ProgrammeStatus })
  @IsOptional()
  @IsEnum(ProgrammeStatus, { message: 'Le statut du programme est invalide' })
  statut?: ProgrammeStatus;

  @ApiPropertyOptional({ description: 'Statut actif/inactif du programme' })
  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}
