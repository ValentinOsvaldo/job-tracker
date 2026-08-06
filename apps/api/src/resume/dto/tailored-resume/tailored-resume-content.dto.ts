import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsString, ValidateNested } from 'class-validator';
import { SkillDto } from '../resume-profile/skill.dto';
import { TailoredExperienceEntryDto } from './tailored-experience-entry.dto';
import { TailoredProjectDto } from './tailored-project.dto';

/**
 * Request shape for hand-edited tailored resume content (POST .../validate).
 * Deliberately has no personal_info/education fields — those are always
 * copied server-side from the user's ResumeProfile, never accepted from the
 * client, so an edit here can never invent or alter them.
 */
export class TailoredResumeContentDto {
  @ApiProperty()
  @IsString()
  summary_variant_used: string;

  @ApiProperty()
  @IsString()
  summary: string;

  @ApiProperty({ type: [SkillDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkillDto)
  skills: SkillDto[];

  @ApiProperty({ type: [TailoredExperienceEntryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TailoredExperienceEntryDto)
  experience: TailoredExperienceEntryDto[];

  @ApiProperty({ type: [TailoredProjectDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TailoredProjectDto)
  projects: TailoredProjectDto[];
}
