import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsObject, IsOptional, ValidateNested } from 'class-validator';
import { TailoredResumeContentDto } from './tailored-resume-content.dto';

export class ValidateTailoredResumeDto {
  @ApiPropertyOptional({
    type: TailoredResumeContentDto,
    description:
      'Hand-edited content to save before re-running the needs_review check. Omit to just re-check the currently saved content.',
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => TailoredResumeContentDto)
  generated_content?: TailoredResumeContentDto;
}
