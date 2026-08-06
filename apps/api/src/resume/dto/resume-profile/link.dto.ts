import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUrl, MinLength } from 'class-validator';

export class LinkDto {
  @ApiProperty({ example: 'GitHub' })
  @IsString()
  @MinLength(1)
  label: string;

  @ApiProperty({ example: 'https://github.com/octocat' })
  @IsUrl()
  url: string;
}
