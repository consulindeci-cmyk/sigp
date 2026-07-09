import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { OrganisationType } from '@prisma/client';

/**
 * Champs modifiables uniquement : nom, type, description, email, telephone, siteWeb, actif.
 * Le `code` est volontairement immuable (identifiant stable, comme l'email d'un User).
 */
export class UpdateOrganisationDto {
  @ApiPropertyOptional({ example: 'Ministère de la Santé Publique', maxLength: 200 })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Le nom ne peut pas être vide' })
  @MaxLength(200)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  nom?: string;

  @ApiPropertyOptional({ enum: OrganisationType })
  @IsOptional()
  @IsEnum(OrganisationType, { message: "Le type d'organisation est invalide" })
  type?: OrganisationType;

  @ApiPropertyOptional({ example: 'Institution publique de santé' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;

  @ApiPropertyOptional({ example: 'contact@sante.gouv', maxLength: 255 })
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

  @ApiPropertyOptional({ example: 'https://sante.gouv', maxLength: 255 })
  @IsOptional()
  @IsUrl({}, { message: "L'URL du site web est invalide" })
  @MaxLength(255)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  siteWeb?: string;

  @ApiPropertyOptional({ description: 'Statut actif/inactif de l’organisation' })
  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}
