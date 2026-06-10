import { IsEnum, IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { PartialType } from '@nestjs/mapped-types';
import { RegisterDto } from '../../auth/dto/auth.dto';

export class UpdateUserDto extends PartialType(RegisterDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}

export class QueryUsersDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: Role })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional()
  @IsOptional()
  sortBy?: string = 'createdAt';
}
