import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { ParseBoolean } from '../../common/transforms/parse-boolean.transform';

export class CvAnalysisQueryDto {
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @ParseBoolean()
  @IsBoolean()
  refresh?: boolean = false;
}
