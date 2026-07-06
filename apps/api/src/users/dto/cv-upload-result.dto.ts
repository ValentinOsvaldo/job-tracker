import { ApiProperty } from '@nestjs/swagger';

export class CvUploadResultDto {
  @ApiProperty({ example: 'resume.pdf' })
  filename: string;

  @ApiProperty({ example: 4521 })
  characters_extracted: number;

  @ApiProperty({ type: String, format: 'date-time' })
  uploaded_at: Date;
}
