import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { BudgetStatus } from '@prisma/client';

export class CreateBudgetVersionDto {
  @ApiProperty({
    example: 'a1b2c3d4-0000-4000-8000-ef1234567890',
    description: 'Identifiant du projet (obligatoire)',
  })
  @IsUUID('4', { message: "L'identifiant du projet est invalide" })
  projectId: string;

  @ApiProperty({
    example: 'Budget initial 2026',
    maxLength: 100,
    description: 'Nom de la version budgétaire',
  })
  @IsString()
  @IsNotEmpty({ message: 'Le nom est obligatoire' })
  @MaxLength(100)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  nom: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Numéro de version (défaut : 1)',
  })
  @IsOptional()
  @IsInt({ message: 'La version doit être un entier' })
  @Min(1)
  version?: number;

  @ApiPropertyOptional({ enum: BudgetStatus, default: BudgetStatus.BROUILLON })
  @IsOptional()
  @IsEnum(BudgetStatus, { message: 'Le statut est invalide' })
  statut?: BudgetStatus;

  @ApiPropertyOptional({ example: 150000000, description: 'Montant total prévisionnel' })
  @IsOptional()
  @IsNumber({}, { message: 'Le montant total est invalide' })
  @Min(0)
  montantTotal?: number;

  @ApiPropertyOptional({
    example: 'b2c3d4e5-0000-4000-8000-ef1234567890',
    description: "Identifiant de l'approbateur (User)",
  })
  @IsOptional()
  @IsUUID('4', { message: "L'identifiant de l'approbateur est invalide" })
  approvePar?: string;

  @ApiPropertyOptional({ example: '2026-03-15', description: "Date d'approbation" })
  @IsOptional()
  @IsDateString({}, { message: "La date d'approbation est invalide" })
  approuveLe?: string;

  @ApiPropertyOptional({ example: 'Budget approuvé en comité de pilotage' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  notes?: string;
}
