/** Curated technology taxonomy used to tag jobs with structured, searchable
 * keywords (job.tech_keywords) instead of free-text word counting. Each
 * entry's aliases are matched against the raw title+description with
 * alnum-boundary matching (not \b, since several terms contain punctuation
 * that isn't a "word" character: c#, .net, node.js, ci/cd), and collapse to
 * one canonical label so "react.js"/"reactjs"/"react" all count as "React". */
interface TechKeywordDef {
  label: string;
  aliases: string[];
}

const TECH_KEYWORDS: TechKeywordDef[] = [
  // Languages
  { label: 'JavaScript', aliases: ['javascript'] },
  { label: 'TypeScript', aliases: ['typescript'] },
  { label: 'Python', aliases: ['python'] },
  { label: 'Java', aliases: ['java'] },
  { label: 'C#', aliases: ['c#', 'csharp'] },
  { label: 'C++', aliases: ['c++', 'cpp'] },
  { label: 'Go', aliases: ['golang'] },
  { label: 'PHP', aliases: ['php'] },
  { label: 'Ruby', aliases: ['ruby'] },
  { label: 'Kotlin', aliases: ['kotlin'] },
  { label: 'Swift', aliases: ['swift'] },
  { label: 'Rust', aliases: ['rust'] },

  // Frontend
  { label: 'React', aliases: ['react', 'react.js', 'reactjs'] },
  { label: 'Vue', aliases: ['vue', 'vue.js', 'vuejs'] },
  { label: 'Angular', aliases: ['angular', 'angularjs'] },
  { label: 'Next.js', aliases: ['next.js', 'nextjs'] },
  { label: 'Svelte', aliases: ['svelte'] },
  { label: 'Redux', aliases: ['redux'] },
  { label: 'Tailwind CSS', aliases: ['tailwind', 'tailwindcss'] },
  { label: 'HTML', aliases: ['html', 'html5'] },
  { label: 'CSS', aliases: ['css', 'css3'] },

  // Backend
  { label: 'Node.js', aliases: ['node.js', 'nodejs', 'node js'] },
  { label: 'Express', aliases: ['express.js', 'expressjs'] },
  { label: 'NestJS', aliases: ['nestjs', 'nest.js'] },
  { label: 'Django', aliases: ['django'] },
  { label: 'Flask', aliases: ['flask'] },
  { label: 'FastAPI', aliases: ['fastapi', 'fast api'] },
  {
    label: 'Spring',
    aliases: ['spring boot', 'springboot', 'spring framework'],
  },
  { label: 'Laravel', aliases: ['laravel'] },
  { label: 'Ruby on Rails', aliases: ['ruby on rails', 'rails'] },
  { label: '.NET', aliases: ['.net', 'dotnet', 'asp.net'] },

  // Mobile
  { label: 'React Native', aliases: ['react native'] },
  { label: 'Flutter', aliases: ['flutter'] },
  { label: 'iOS', aliases: ['ios'] },
  { label: 'Android', aliases: ['android'] },

  // Data
  { label: 'PostgreSQL', aliases: ['postgresql', 'postgres'] },
  { label: 'MySQL', aliases: ['mysql'] },
  { label: 'MongoDB', aliases: ['mongodb', 'mongo'] },
  { label: 'Redis', aliases: ['redis'] },
  { label: 'SQL Server', aliases: ['sql server', 'mssql'] },
  { label: 'DynamoDB', aliases: ['dynamodb'] },
  { label: 'SQL', aliases: ['sql'] },
  { label: 'GraphQL', aliases: ['graphql'] },

  // Cloud / DevOps
  { label: 'AWS', aliases: ['aws', 'amazon web services'] },
  { label: 'Azure', aliases: ['azure'] },
  { label: 'Google Cloud', aliases: ['gcp', 'google cloud'] },
  { label: 'Docker', aliases: ['docker'] },
  { label: 'Kubernetes', aliases: ['kubernetes', 'k8s'] },
  { label: 'Terraform', aliases: ['terraform'] },
  { label: 'Jenkins', aliases: ['jenkins'] },
  { label: 'CI/CD', aliases: ['ci/cd', 'ci cd'] },
  { label: 'Git', aliases: ['git'] },
  { label: 'Microservices', aliases: ['microservices', 'microservicios'] },
  { label: 'REST API', aliases: ['rest api', 'restful'] },
];

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Matches `term` in `haystack` only when it isn't glued to another
 * alphanumeric character on either side — a lightweight boundary check that
 * (unlike \b) also works for terms containing punctuation (c#, .net,
 * node.js, ci/cd), and correctly rejects "javascript" as a match for
 * "java" since "script" continues the alnum run. */
function containsTerm(haystack: string, term: string): boolean {
  const pattern = new RegExp(`(?<![a-z0-9])${escapeRegex(term)}(?![a-z0-9])`);
  return pattern.test(haystack);
}

export function extractTechKeywords(
  title: string | null | undefined,
  description: string | null | undefined,
): string[] {
  const haystack = `${title ?? ''} ${description ?? ''}`.toLowerCase();

  if (!haystack.trim()) {
    return [];
  }

  const found = new Set<string>();

  for (const def of TECH_KEYWORDS) {
    if (def.aliases.some((alias) => containsTerm(haystack, alias))) {
      found.add(def.label);
    }
  }

  return [...found];
}
