import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Champs modifiables uniquement : nom, description, actif.
 * `code` et `departementId` sont volontairement immuables (identité + rattachement stables).
 */
export class UpdateUniteDto {
  @ApiPropertyOptional({ example: 'Unité Réseau et Sécurité', maxLength: 200 })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Le nom ne peut pas être vide' })
  @MaxLength(200)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  nom?: string;

  @ApiPropertyOptional({ example: 'Unité en charge du réseau et des télécoms' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;

  @ApiPropertyOptional({ description: 'Statut actif/inactif de l’unité' })
  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}
