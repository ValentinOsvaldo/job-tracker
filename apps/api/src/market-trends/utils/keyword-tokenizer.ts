export const STOPWORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'de',
  'del',
  'el',
  'en',
  'for',
  'from',
  'in',
  'is',
  'it',
  'la',
  'las',
  'lo',
  'los',
  'mx',
  'of',
  'on',
  'or',
  'para',
  'por',
  'que',
  'the',
  'to',
  'un',
  'una',
  'with',
  'y',
  'you',
  'your',
  'we',
  'our',
  'will',
  'this',
  'that',
  'have',
  'has',
  'all',
  'not',
  'can',
  'job',
  'jobs',
  'work',
  'remote',
  'engineer',
  'developer',
  'senior',
  'junior',
  'software',
  'full',
  'time',
  'stack',
  'team',
  'role',
  'position',
  'experience',
  'years',
  'year',
  'mexico',
  'mxn',
]);

const TERM_ALIASES: Record<string, string> = {
  'node.js': 'nodejs',
  'react.js': 'react',
  'vue.js': 'vue',
  'next.js': 'nextjs',
  'c#': 'csharp',
  '.net': 'dotnet',
};

export function normalizeTerm(term: string): string {
  const lower = term.toLowerCase().trim();
  return TERM_ALIASES[lower] ?? lower;
}

export function tokenizeText(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2)
    .filter((token) => !STOPWORDS.has(token))
    .map(normalizeTerm);
}
