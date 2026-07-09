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
import { JournalType } from '@prisma/client';

export class CreateJournalOperationDto {
  @ApiProperty({
    example: 'a1b2c3d4-0000-4000-8000-ef1234567890',
    description: 'Identifiant de la ligne budgétaire (obligatoire)',
  })
  @IsUUID('4', { message: "L'identifiant de la ligne budgétaire est invalide" })
  budgetLineId: string;

  @ApiProperty({ enum: JournalType, description: 'Type de mouvement' })
  @IsEnum(JournalType, { message: 'Le type est invalide' })
  type: JournalType;

  @ApiProperty({ example: 5000000, description: 'Montant de la transaction' })
  @IsNumber({}, { message: 'Le montant est invalide' })
  @Min(0)
  montant: number;

  @ApiProperty({ example: '2026-03-15', description: "Date de l'opération (YYYY-MM-DD)" })
  @IsDateString({}, { message: "La date d'opération est invalide" })
  dateOperation: string;

  @ApiPropertyOptional({ example: 'BON-2026-001', maxLength: 100, description: 'Référence pièce' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  reference?: string;

  @ApiPropertyOptional({ example: 'Paiement salaires mars 2026' })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;

  @ApiPropertyOptional({
    example: 'b2c3d4e5-0000-4000-8000-ef1234567890',
    description: 'Identifiant de la pièce jointe',
  })
  @IsOptional()
  @IsUUID('4', { message: "L'identifiant de la pièce jointe est invalide" })
  pieceJointeId?: string;
}
