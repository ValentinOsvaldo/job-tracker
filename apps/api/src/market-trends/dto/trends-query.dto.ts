import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { ParseBoolean } from '../../common/transforms/parse-boolean.transform';
import { JobSource } from '../../jobs/enums/job-source.enum';

export class TrendsQueryDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 365, default: 30, example: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  days?: number = 30;

  @ApiPropertyOptional({ enum: JobSource, example: JobSource.LINKEDIN })
  @IsOptional()
  @IsEnum(JobSource)
  source?: JobSource;

  @ApiPropertyOptional({ minimum: 5, maximum: 50, default: 20, example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(50)
  limit?: number = 20;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @ParseBoolean()
  @IsBoolean()
  refresh?: boolean = false;
}
