import { Type, plainToInstance } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateNested,
  validateSync,
} from 'class-validator';
import { stripJsonFences } from '../utils/strip-json-fences';

export class TailorBulletDto {
  @IsOptional()
  @IsString()
  source_bullet_id?: string | null;

  @IsOptional()
  @IsString()
  source_evidence_id?: string | null;

  @IsString()
  @MinLength(1)
  text: string;

  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @IsNumber()
  @Min(0)
  @Max(100)
  relevance_score: number;
}

export class TailorExperienceDto {
  @IsString()
  company: string;

  @IsString()
  role: string;

  @IsString()
  period: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TailorBulletDto)
  bullets: TailorBulletDto[];
}

export class TailorProjectDto {
  @IsString()
  source_project_id: string;

  @IsOptional()
  @IsString()
  text_override?: string | null;

  @IsNumber()
  @Min(0)
  @Max(100)
  relevance_score: number;
}

export class TailorSkillDto {
  @IsString()
  name: string;

  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @IsString()
  level: string;
}

export class TailorResumeAiResultDto {
  @IsString()
  summary_variant_used: string;

  @IsString()
  summary_text: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TailorSkillDto)
  skills: TailorSkillDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TailorExperienceDto)
  experience: TailorExperienceDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TailorProjectDto)
  projects: TailorProjectDto[];
}

export function parseTailorResumeResult(raw: string): TailorResumeAiResultDto {
  const cleaned = stripJsonFences(raw);
  const parsed: unknown = JSON.parse(cleaned);
  const instance = plainToInstance(TailorResumeAiResultDto, parsed);
  const errors = validateSync(instance, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });

  if (errors.length > 0) {
    throw new Error(
      `Invalid tailor-resume AI response: ${errors.map((e) => e.toString()).join('; ')}`,
    );
  }

  return instance;
}
