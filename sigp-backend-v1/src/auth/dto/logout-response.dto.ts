import { ApiProperty } from '@nestjs/swagger';

export class LogoutResponseDto {
  @ApiProperty({
    example: 'Déconnexion réussie',
    description: 'Message de confirmation de la déconnexion',
  })
  message: string;
}
