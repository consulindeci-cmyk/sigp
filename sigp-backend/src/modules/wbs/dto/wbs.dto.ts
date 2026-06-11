import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWbsDto {
  @ApiProperty({ example: 'WBS-001' })
  @IsString()
  @IsNotEmpty()
  code_wbs: string;

  @ApiProperty({ example: 'Infrastructures' })
  @IsString()
  @IsNotEmpty()
  nom_phase: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateWbsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nom_phase?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
