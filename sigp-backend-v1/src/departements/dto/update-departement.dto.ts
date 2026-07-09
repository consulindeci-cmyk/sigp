import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Champs modifiables uniquement : nom, description, actif.
 * `code` et `directionId` sont volontairement immuables (identité + rattachement stables).
 */
export class UpdateDepartementDto {
  @ApiPropertyOptional({ example: 'Département SI et Télécoms', maxLength: 200 })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Le nom ne peut pas être vide' })
  @MaxLength(200)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  nom?: string;

  @ApiPropertyOptional({ example: 'Département en charge de l’infrastructure' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;

  @ApiPropertyOptional({ description: 'Statut actif/inactif du département' })
  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}
