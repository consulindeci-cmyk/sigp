import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateBudgetDto {
  @ApiProperty({ example: 'BUD-001' })
  @IsString()
  @IsNotEmpty()
  code_budget: string;

  @ApiProperty({ example: 'Équipements' })
  @IsString()
  @IsNotEmpty()
  rubrique: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sous_rubrique?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unite?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantite?: number;

  @ApiProperty({ example: '50000.00' })
  @IsNotEmpty()
  cout_unitaire: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  financement_bailleur?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  contrepartie_etat?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  commentaire?: string;
}

export class UpdateBudgetDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rubrique?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sous_rubrique?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unite?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantite?: number;

  @ApiPropertyOptional()
  @IsOptional()
  cout_unitaire?: string;

  @ApiPropertyOptional()
  @IsOptional()
  financement_bailleur?: string;

  @ApiPropertyOptional()
  @IsOptional()
  contrepartie_etat?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  commentaire?: string;
}
