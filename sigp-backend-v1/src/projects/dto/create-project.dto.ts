import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  Length,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { ProjectStatus } from '@prisma/client';

export class CreateProjectDto {
  @ApiPropertyOptional({
    example: 'a1b2c3d4-0000-0000-0000-ef1234567890',
    description: 'Identifiant du programme parent',
  })
  @IsOptional()
  @IsUUID('4', { message: "L'identifiant du programme est invalide" })
  programmeId?: string;

  @ApiProperty({ example: 'PRJ-SANTE-01', maxLength: 50, description: 'Code unique (majuscules)' })
  @IsString()
  @IsNotEmpty({ message: 'Le code est obligatoire' })
  @MaxLength(50)
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  code: string;

  @ApiProperty({ example: 'Projet Santé Rurale Phase 1', maxLength: 255 })
  @IsString()
  @IsNotEmpty({ message: 'Le nom est obligatoire' })
  @MaxLength(255)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  nom: string;

  @ApiPropertyOptional({ example: "Projet d'amélioration de l'accès aux soins" })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;

  @ApiPropertyOptional({ enum: ProjectStatus, default: ProjectStatus.EN_PREPARATION })
  @IsOptional()
  @IsEnum(ProjectStatus, { message: 'Le statut du projet est invalide' })
  statut?: ProjectStatus;

  @ApiPropertyOptional({
    example: 'a1b2c3d4-0000-0000-0000-ef1234567890',
    description: 'Chef de projet (User)',
  })
  @IsOptional()
  @IsUUID('4', { message: "L'identifiant du manager est invalide" })
  managerId?: string;

  @ApiPropertyOptional({ example: '2026-01-01', description: 'Date de début (ISO)' })
  @IsOptional()
  @IsDateString({}, { message: 'La date de début est invalide' })
  dateDebut?: string;

  @ApiPropertyOptional({ example: '2026-12-31', description: 'Date de fin prévue (ISO)' })
  @IsOptional()
  @IsDateString({}, { message: 'La date de fin prévue est invalide' })
  dateFinPrevue?: string;

  @ApiPropertyOptional({ example: 1000000, description: 'Budget total' })
  @IsOptional()
  @IsNumber({}, { message: 'Le budget total est invalide' })
  @Min(0)
  budgetTotal?: number;

  @ApiPropertyOptional({ example: 'XOF', maxLength: 3, default: 'XOF' })
  @IsOptional()
  @IsString()
  @Length(3, 3, { message: 'La devise doit être un code ISO à 3 caractères' })
  @MaxLength(3)
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  devise?: string;

  @ApiPropertyOptional({ example: "Côte d'Ivoire", maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  pays?: string;

  @ApiPropertyOptional({ example: 'Santé', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  secteur?: string;

  @ApiPropertyOptional({ example: 'Banque Mondiale', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  bailleurPrincipal?: string;
}
