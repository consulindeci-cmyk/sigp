import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@sigp.local', description: 'Adresse email de connexion' })
  @IsEmail({}, { message: "L'adresse email est invalide" })
  @Transform(({ value }: { value: string }) => value.trim().toLowerCase())
  email: string;

  @ApiProperty({ example: '••••••••', description: 'Mot de passe' })
  @IsString()
  @IsNotEmpty({ message: 'Le mot de passe est obligatoire' })
  @Transform(({ value }: { value: string }) => value.trim())
  password: string;
}
