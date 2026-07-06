import { ApiProperty } from '@nestjs/swagger';
import { PublicUserDto } from '../../users/dto/public-user.dto';

export class AuthTokensResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  refreshToken: string;
}

export class LoginResponseDto extends AuthTokensResponseDto {
  @ApiProperty({ type: PublicUserDto })
  user: PublicUserDto;
}
