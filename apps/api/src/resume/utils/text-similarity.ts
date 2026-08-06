const COMBINING_DIACRITICS = /[̀-ͯ]/g;

function tokenize(text: string): Set<string> {
  const normalized = text
    .toLowerCase()
    .normalize('NFD')
    .replace(COMBINING_DIACRITICS, '')
    .replace(/[^a-z0-9\s]/g, ' ');

  return new Set(normalized.split(/\s+/).filter(Boolean));
}

/** Jaccard similarity (token-overlap) between two texts, 0-1. No embeddings
 * exist in this project, so this is the deliberately simple stand-in used to
 * flag a rewritten bullet that drifted too far from its source fact. */
export function jaccardSimilarity(a: string, b: string): number {
  const tokensA = tokenize(a);
  const tokensB = tokenize(b);

  if (tokensA.size === 0 && tokensB.size === 0) {
    return 1;
  }

  if (tokensA.size === 0 || tokensB.size === 0) {
    return 0;
  }

  let intersection = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) {
      intersection++;
    }
  }

  const union = tokensA.size + tokensB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}
