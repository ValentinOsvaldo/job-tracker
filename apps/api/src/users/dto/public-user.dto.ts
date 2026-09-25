import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

  @ApiPropertyOptional({ nullable: true, example: null })
  cv_text: string | null;

  @ApiPropertyOptional({ nullable: true, example: null })
  cv_filename: string | null;

  @ApiPropertyOptional({ nullable: true, type: String, format: 'date-time' })
  cv_uploaded_at: Date | null;

  @ApiPropertyOptional({ nullable: true, example: 'Guadalajara' })
  home_city: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'Mexico' })
  home_country: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  created_at: Date;
}
