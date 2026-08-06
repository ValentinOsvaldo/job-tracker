import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, MaxLength, MinLength } from 'class-validator';

export class BulletDto {
  @ApiProperty({ example: 'a1b2c3' })
  @IsString()
  @MinLength(1)
  id: string;

  @ApiProperty({
    example: 'Reduje el tiempo de build de CI en 40% migrando a Turborepo',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(400)
  text: string;

  @ApiProperty({ type: [String], example: ['ci', 'performance'] })
  @IsArray()
  @IsString({ each: true })
  tags: string[];
}
