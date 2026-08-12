/** Aliases for free-form skill strings coming out of AI analyses
 * (job_analyses.matched_skills / missing_skills), so "Node.js" and "node"
 * don't show up as separate rows in top_demanded_skills / top_missing_skills. */
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
