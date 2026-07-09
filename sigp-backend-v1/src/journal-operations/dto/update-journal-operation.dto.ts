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
import { JournalType } from '@prisma/client';

export class UpdateJournalOperationDto {
  @ApiPropertyOptional({ enum: JournalType })
  @IsOptional()
  @IsEnum(JournalType, { message: 'Le type est invalide' })
  type?: JournalType;

  @ApiPropertyOptional({ example: 5500000 })
  @IsOptional()
  @IsNumber({}, { message: 'Le montant est invalide' })
  @Min(0)
  montant?: number;

  @ApiPropertyOptional({ example: '2026-04-01' })
  @IsOptional()
  @IsDateString({}, { message: "La date d'opération est invalide" })
  dateOperation?: string;

  @ApiPropertyOptional({ example: 'BON-2026-002', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  reference?: string;

  @ApiPropertyOptional({ example: 'Paiement salaires avril 2026' })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;

  @ApiPropertyOptional({ example: 'b2c3d4e5-0000-4000-8000-ef1234567890' })
  @IsOptional()
  @IsUUID('4', { message: "L'identifiant de la pièce jointe est invalide" })
  pieceJointeId?: string;
}
