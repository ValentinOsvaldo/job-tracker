function camelToSnakeKey(key: string): string {
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/** Recursively converts camelCase object keys to snake_case, leaving array
 * items and primitive values untouched. Lets a resume profile JSON written
 * in the feature's originally-proposed camelCase shape (personalInfo,
 * skillEvidence, ...) load through the snake_case API/DB shape unchanged. */
export function camelToSnakeDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => camelToSnakeDeep(item));
  }

  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, val]) => [
        camelToSnakeKey(key),
        camelToSnakeDeep(val),
      ]),
    );
  }

  return value;
}
