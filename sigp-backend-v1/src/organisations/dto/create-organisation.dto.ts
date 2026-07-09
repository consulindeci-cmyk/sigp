import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { OrganisationType } from '@prisma/client';

export class CreateOrganisationDto {
  @ApiProperty({
    example: 'MIN-SANTE',
    maxLength: 50,
    description: 'Code unique (normalisé en majuscules)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Le code est obligatoire' })
  @MaxLength(50)
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  code: string;

  @ApiProperty({ example: 'Ministère de la Santé', maxLength: 200, description: 'Nom unique' })
  @IsString()
  @IsNotEmpty({ message: 'Le nom est obligatoire' })
  @MaxLength(200)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  nom: string;

  @ApiPropertyOptional({ enum: OrganisationType, default: OrganisationType.AUTRE })
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
}
