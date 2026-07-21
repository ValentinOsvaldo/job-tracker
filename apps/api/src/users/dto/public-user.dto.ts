import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../enums/user-role.enum';

export class PublicUserDto {
  @ApiProperty({
    format: 'uuid',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  id: string;

  @ApiProperty({ example: 'Osvaldo' })
  name: string;

  @ApiProperty({ example: 'osvaldo@example.com' })
  email: string;

  @ApiProperty({ enum: UserRole, example: UserRole.USER })
  role: UserRole;

  @ApiPropertyOptional({ nullable: true, example: null })
  cv_text: string | null;

  @ApiPropertyOptional({ nullable: true, example: null })
  cv_filename: string | null;

  @ApiPropertyOptional({ nullable: true, type: String, format: 'date-time' })
  cv_uploaded_at: Date | null;

  @ApiProperty({ type: String, format: 'date-time' })
  created_at: Date;
}
