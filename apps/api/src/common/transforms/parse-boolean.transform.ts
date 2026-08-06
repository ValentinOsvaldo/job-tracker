import { Transform } from 'class-transformer';

/**
 * class-transformer's `@Type(() => Boolean)` coerces via the JS `Boolean()`
 * constructor, so any non-empty query string — including the literal text
 * "false" — becomes `true`. Query params always arrive as strings, so that
 * makes `?flag=false` indistinguishable from `?flag=true`. This transform
 * parses "true"/"false" text explicitly instead of relying on truthiness.
 */
export function ParseBoolean(): PropertyDecorator {
  return Transform(({ value }: { value: unknown }): unknown => {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      if (value.toLowerCase() === 'true') return true;
      if (value.toLowerCase() === 'false') return false;
    }
    return value;
  });
}
