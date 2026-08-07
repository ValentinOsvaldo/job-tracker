import { Type, plainToInstance } from 'class-transformer';
import {
  IsArray,
  IsString,
  MinLength,
  ValidateNested,
  validateSync,
} from 'class-validator';
import { stripJsonFences } from '../utils/strip-json-fences';

export class TranslationItemDto {
  @IsString()
  @MinLength(1)
  id: string;

  @IsString()
  text: string;
}

export class TranslateProfileResultDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TranslationItemDto)
  translations: TranslationItemDto[];
}

export function parseTranslateProfileResult(
  raw: string,
): TranslateProfileResultDto {
  const cleaned = stripJsonFences(raw);
  const parsed: unknown = JSON.parse(cleaned);
  const instance = plainToInstance(TranslateProfileResultDto, parsed);
  const errors = validateSync(instance, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });

  if (errors.length > 0) {
    throw new Error(
      `Invalid translate-profile AI response: ${errors.map((e) => e.toString()).join('; ')}`,
    );
  }

  return instance;
}
