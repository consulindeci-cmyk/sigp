import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFundingDto {
  @ApiProperty({ example: 'Banque Mondiale' })
  @IsString()
  @IsNotEmpty()
  nom_bailleur: string;

  @ApiProperty({ example: '2000000.00' })
  @IsNotEmpty()
  montant: string;

  @ApiProperty({ example: 'XOF' })
  @IsString()
  @IsNotEmpty()
  devise: string;

  @ApiPropertyOptional({ example: '2025-01-15' })
  @IsOptional()
  @IsDateString()
  date_financement?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  commentaire?: string;
}

export class UpdateFundingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nom_bailleur?: string;

  @ApiPropertyOptional()
  @IsOptional()
  montant?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  devise?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date_financement?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  commentaire?: string;
}
