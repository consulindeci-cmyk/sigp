import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'Mamadou' })
  @IsString()
  @IsNotEmpty()
  prenom: string;

  @ApiProperty({ example: 'Koné' })
  @IsString()
  @IsNotEmpty()
  nom: string;

  @ApiProperty({ example: 'user@sigp.ci' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '+225 0102030405' })
  @IsOptional()
  @IsString()
  telephone?: string;

  @ApiProperty({ example: 'MotDePasse@2026', minLength: 8 })
  @IsString()
  @MinLength(8)
  mot_de_passe: string;

  @ApiProperty({ enum: Role, example: Role.OBSERVATEUR })
  @IsEnum(Role)
  role: Role;
}

export class LoginDto {
  @ApiProperty({ example: 'admin@sigp.ci' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Admin@2026' })
  @IsString()
  @IsNotEmpty()
  mot_de_passe: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refresh_token: string;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  ancien_mot_de_passe: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  nouveau_mot_de_passe: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@sigp.ci' })
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  nouveau_mot_de_passe: string;
}
