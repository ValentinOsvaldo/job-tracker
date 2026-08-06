const EMAIL_SOURCE = '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}'

/** Regex objects with the "g" flag carry mutable lastIndex state across
 * calls, so callers that need a fresh scan (DOM walking, repeated .exec)
 * must get their own instance rather than sharing one. */
export function createEmailRegex(): RegExp {
  return new RegExp(EMAIL_SOURCE, 'g')
}

// Description text sometimes embeds image srcset-style fragments like
// "logo@2x.png" that happen to match the email shape; filter those out.
const NON_EMAIL_TLDS = new Set(['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico'])

export function isLikelyEmail(candidate: string): boolean {
  const tld = candidate.split('.').pop()?.toLowerCase()
  return !tld || !NON_EMAIL_TLDS.has(tld)
}

/** Unique emails found in free text, in first-seen order. */
export function extractEmails(text: string | null | undefined): string[] {
  if (!text) return []

  const matches = text.match(createEmailRegex()) ?? []
  const seen = new Set<string>()
  const emails: string[] = []

  for (const match of matches) {
    if (!isLikelyEmail(match)) continue
    const key = match.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    emails.push(match)
  }

  return emails
}
