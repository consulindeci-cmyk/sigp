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
import { DisbursementStatus } from '@prisma/client';

export class UpdateDisbursementDto {
  @ApiPropertyOptional({
    example: 'd4e5f6a7-0000-4000-8000-ef1234567890',
    description: 'Identifiant du contrat',
  })
  @IsOptional()
  @IsUUID('4', { message: "L'identifiant du contrat est invalide" })
  contractId?: string;

  @ApiPropertyOptional({ enum: DisbursementStatus })
  @IsOptional()
  @IsEnum(DisbursementStatus, { message: 'Le statut du décaissement est invalide' })
  statut?: DisbursementStatus;

  @ApiPropertyOptional({ example: 5000000, minimum: 0 })
  @IsOptional()
  @IsNumber({}, { message: 'Le montant est invalide' })
  @Min(0)
  montant?: number;

  @ApiPropertyOptional({ example: '2026-06-01' })
  @IsOptional()
  @IsDateString({}, { message: 'La date prévue est invalide' })
  datePrevue?: string;

  @ApiPropertyOptional({ example: '2026-06-15' })
  @IsOptional()
  @IsDateString({}, { message: 'La date réelle est invalide' })
  dateReelle?: string;

  @ApiPropertyOptional({ example: 'DEC-2026-001', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  reference?: string;

  @ApiPropertyOptional({ example: 'Décaissement révisé' })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;
}
