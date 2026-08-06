import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsObject,
  IsOptional,
  Validate,
  ValidateNested,
} from 'class-validator';
import { SummaryVariants } from '../../types/resume-profile.types';
import { IsSummaryVariantsMapConstraint } from '../../validators/is-summary-variants-map.validator';
import { EducationDto } from './education.dto';
import { ExperienceEntryDto } from './experience-entry.dto';
import { PersonalInfoDto } from './personal-info.dto';
import { ProjectDto } from './project.dto';
import { SkillDto } from './skill.dto';
import { SkillEvidenceItemDto } from './skill-evidence-item.dto';

export class UpsertResumeProfileDto {
  @ApiProperty({ type: PersonalInfoDto })
  @IsObject()
  @ValidateNested()
  @Type(() => PersonalInfoDto)
  personal_info: PersonalInfoDto;

  @ApiProperty({
    example: { frontend_heavy: '...', fullstack_heavy: '...' },
    description: 'Named summary variants, keyed by a name you choose',
  })
  @Validate(IsSummaryVariantsMapConstraint)
  summary: SummaryVariants;

  @ApiProperty({ type: [SkillDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkillDto)
  skills: SkillDto[];

  @ApiProperty({ type: [ExperienceEntryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperienceEntryDto)
  experience: ExperienceEntryDto[];

  @ApiProperty({ type: [SkillEvidenceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkillEvidenceItemDto)
  skill_evidence: SkillEvidenceItemDto[];

  @ApiProperty({ type: [ProjectDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectDto)
  projects: ProjectDto[];

  @ApiPropertyOptional({ type: [EducationDto], nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationDto)
  education?: EducationDto[] | null;
}
