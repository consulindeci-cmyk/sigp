import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { UserRole } from '@prisma/client';

/**
 * Champs modifiables uniquement : nom, prénom, téléphone, rôle, statut (actif).
 * id, email, password et createdAt ne sont volontairement PAS exposés à la modification.
 */
export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Doe', maxLength: 100 })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Le nom ne peut pas être vide' })
  @MaxLength(100)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  nom?: string;

  @ApiPropertyOptional({ example: 'John', maxLength: 100 })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Le prénom ne peut pas être vide' })
  @MaxLength(100)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  prenom?: string;

  @ApiPropertyOptional({ example: '+2250102030405', maxLength: 30 })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  telephone?: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Le rôle est invalide' })
  role?: UserRole;

  @ApiPropertyOptional({ description: 'Statut du compte : true = actif, false = désactivé' })
  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}
