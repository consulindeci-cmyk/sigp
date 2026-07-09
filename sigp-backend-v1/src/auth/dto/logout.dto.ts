import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LogoutDto {
  @ApiProperty({
    description:
      'Refresh token courant à révoquer. Toute la Token Family associée est invalidée, ' +
      "empêchant toute rotation ultérieure. L'Access Token est blacklisté jusqu'à son exp.",
    example: 'a3f8c2...128 caractères hex',
  })
  @IsString()
  @IsNotEmpty({ message: 'Le refresh token est obligatoire' })
  refreshToken: string;
}
