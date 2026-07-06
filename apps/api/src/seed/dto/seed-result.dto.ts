import { ApiProperty } from '@nestjs/swagger';

export class SeedResultDto {
  @ApiProperty({
    type: [String],
    example: ['osvaldo@example.com'],
    description: 'Emails of users created during this request',
  })
  created: string[];

  @ApiProperty({
    type: [String],
    example: ['guillermo@example.com'],
    description: 'Emails of users that already existed and were skipped',
  })
  skipped: string[];
}
