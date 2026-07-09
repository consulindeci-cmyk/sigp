import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token opaque (format: familyId.rawToken)',
    example: '123e4567-e89b-4d3c-a456-426614174000.aabbcc...',
  })
  @IsString()
  @IsNotEmpty({ message: 'Le refresh token est obligatoire' })
  refreshToken: string;
}
