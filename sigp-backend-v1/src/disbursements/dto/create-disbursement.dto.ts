import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
import { DisbursementStatus } from '@prisma/client';

export class CreateDisbursementDto {
  @ApiPropertyOptional({
    example: 'b2c3d4e5-0000-4000-8000-ef1234567890',
    description: 'Identifiant de la version budgétaire',
  })
  @IsOptional()
  @IsUUID('4', { message: "L'identifiant de la version budgétaire est invalide" })
  budgetVersionId?: string;

  @ApiPropertyOptional({
    example: 'c3d4e5f6-0000-4000-8000-ef1234567890',
    description: 'Identifiant de la ligne budgétaire',
  })
  @IsOptional()
  @IsUUID('4', { message: "L'identifiant de la ligne budgétaire est invalide" })
  budgetLineId?: string;

  @ApiPropertyOptional({
    example: 'd4e5f6a7-0000-4000-8000-ef1234567890',
    description: 'Identifiant du contrat',
  })
  @IsOptional()
  @IsUUID('4', { message: "L'identifiant du contrat est invalide" })
  contractId?: string;

  @ApiPropertyOptional({
    example: 'e5f6a7b8-0000-4000-8000-ef1234567890',
    description: 'Identifiant de la source de financement',
  })
  @IsOptional()
  @IsUUID('4', { message: "L'identifiant de la source de financement est invalide" })
  fundingSourceId?: string;

  @ApiPropertyOptional({ enum: DisbursementStatus, default: DisbursementStatus.PLANIFIE })
  @IsOptional()
  @IsEnum(DisbursementStatus, { message: 'Le statut du décaissement est invalide' })
  statut?: DisbursementStatus;

  @ApiProperty({ example: 5000000, description: 'Montant du décaissement' })
  @IsNumber({}, { message: 'Le montant est invalide' })
  @Min(0)
  montant: number;

  @ApiPropertyOptional({ example: '2026-06-01', description: 'Date prévue (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString({}, { message: 'La date prévue est invalide' })
  datePrevue?: string;

  @ApiPropertyOptional({ example: '2026-06-15', description: 'Date réelle (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString({}, { message: 'La date réelle est invalide' })
  dateReelle?: string;

  @ApiPropertyOptional({ example: 'DEC-2026-001', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  reference?: string;

  @ApiPropertyOptional({ example: 'Premier décaissement de la composante 1' })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;
}
