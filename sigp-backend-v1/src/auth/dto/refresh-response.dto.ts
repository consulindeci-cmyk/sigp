import { ApiProperty } from '@nestjs/swagger';

export class RefreshResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJSUzI1NiJ9...',
    description: 'Nouvel access token JWT RS256',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Nouveau refresh token opaque (le précédent est invalidé)',
    example: 'a3f8c2...128 caractères hex',
  })
  refreshToken: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType: 'Bearer';

  @ApiProperty({ example: 900, description: "Durée de validité de l'access token en secondes" })
  expiresIn: number;
}
