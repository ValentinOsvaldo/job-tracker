import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

const VARIANT_KEY_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]{0,49}$/;
const MAX_VARIANT_TEXT_LENGTH = 2000;

@ValidatorConstraint({ name: 'isSummaryVariantsMap', async: false })
export class IsSummaryVariantsMapConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return false;
    }

    const entries = Object.entries(value as Record<string, unknown>);

    if (entries.length === 0) {
      return false;
    }

    return entries.every(
      ([key, text]) =>
        VARIANT_KEY_PATTERN.test(key) &&
        typeof text === 'string' &&
        text.trim().length > 0 &&
        text.length <= MAX_VARIANT_TEXT_LENGTH,
    );
  }

  defaultMessage(): string {
    return (
      'summary must be a non-empty object mapping variant names ' +
      '(letters/numbers/underscore) to non-empty text ' +
      `(max ${MAX_VARIANT_TEXT_LENGTH} chars each)`
    );
  }
}
