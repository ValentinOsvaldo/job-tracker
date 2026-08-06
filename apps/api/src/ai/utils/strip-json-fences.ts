/** Gemini sometimes wraps JSON responses in a ```json ... ``` markdown fence
 * despite being asked for raw JSON; strip it before parsing. */
export function stripJsonFences(raw: string): string {
  return raw
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '');
}
