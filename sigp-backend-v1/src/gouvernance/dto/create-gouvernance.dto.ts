import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateGouvernanceDto {
  @ApiProperty({
    example: 'a1b2c3d4-0000-0000-0000-ef1234567890',
    description: 'Identifiant du projet (obligatoire)',
  })
  @IsUUID('4', { message: "L'identifiant du projet est invalide" })
  projectId: string;

  @ApiProperty({ example: 'Awa Koné', maxLength: 200, description: 'Nom de la partie prenante' })
  @IsString()
  @IsNotEmpty({ message: 'Le nom est obligatoire' })
  @MaxLength(200)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  nom: string;

  @ApiProperty({ example: 'Président du comité de pilotage', maxLength: 100, description: 'Rôle' })
  @IsString()
  @IsNotEmpty({ message: 'Le rôle est obligatoire' })
  @MaxLength(100)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  role: string;

  @ApiPropertyOptional({ example: 'Ministère de la Santé', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  organisation?: string;

  @ApiPropertyOptional({ example: 'awa.kone@sante.gouv', maxLength: 255 })
  @IsOptional()
  @IsEmail({}, { message: "L'adresse email est invalide" })
  @MaxLength(255)
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email?: string;

  @ApiPropertyOptional({ example: '+2250102030405', maxLength: 30 })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  telephone?: string;

  @ApiPropertyOptional({
    example: 'b2c3d4e5-0000-0000-0000-ef1234567890',
    description: 'Utilisateur système lié (optionnel)',
  })
  @IsOptional()
  @IsUUID('4', { message: "L'identifiant de l'utilisateur est invalide" })
  userId?: string;
}
