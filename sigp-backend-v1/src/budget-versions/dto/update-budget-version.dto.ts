import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { BudgetStatus } from '@prisma/client';

export class UpdateBudgetVersionDto {
  @ApiPropertyOptional({ example: 'Budget révisé 2026', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  nom?: string;

  @ApiPropertyOptional({ enum: BudgetStatus })
  @IsOptional()
  @IsEnum(BudgetStatus, { message: 'Le statut est invalide' })
  statut?: BudgetStatus;

  @ApiPropertyOptional({ example: 160000000, description: 'Montant total révisé' })
  @IsOptional()
  @IsNumber({}, { message: 'Le montant total est invalide' })
  @Min(0)
  montantTotal?: number;

  @ApiPropertyOptional({
    example: 'b2c3d4e5-0000-4000-8000-ef1234567890',
    description: "Identifiant de l'approbateur",
  })
  @IsOptional()
  @IsUUID('4', { message: "L'identifiant de l'approbateur est invalide" })
  approvePar?: string;

  @ApiPropertyOptional({ example: '2026-04-01', description: "Date d'approbation" })
  @IsOptional()
  @IsDateString({}, { message: "La date d'approbation est invalide" })
  approuveLe?: string;

  @ApiPropertyOptional({ example: 'Révision suite au comité de pilotage' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  notes?: string;
}
