import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ1dWlkIn0.signature',
    description: 'Access token JWT RS256',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Refresh token opaque (format: familyId.rawToken)',
    example: '123e4567-e89b-4d3c-a456-426614174000.aabbcc...',
  })
  refreshToken: string;

  @ApiProperty({ example: 'Bearer', description: 'Type de token (toujours Bearer)' })
  tokenType: 'Bearer';

  @ApiProperty({ example: 900, description: "Durée de validité de l'access token en secondes" })
  expiresIn: number;
}
