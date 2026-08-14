import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class SaveManualAnalysisDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  profile_id: string;

  @ApiProperty({
    description:
      'Raw AI response pasted from an external chat tool, using the same prompt returned by GET /jobs/:id/analyses/prompt',
  })
  @IsString()
  @IsNotEmpty()
  raw: string;
}
