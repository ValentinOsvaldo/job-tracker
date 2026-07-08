import { Job } from '../../jobs/entities/job.entity';
import { KeywordStat, KeywordTrend } from '../../ai/types/keyword-stat.type';
import { normalizeTerm, tokenizeText } from './keyword-tokenizer';

function countTerms(texts: string[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const text of texts) {
    const seenInDoc = new Set<string>();

    for (const term of tokenizeText(text)) {
      if (seenInDoc.has(term)) {
        continue;
      }

      seenInDoc.add(term);
      counts.set(term, (counts.get(term) ?? 0) + 1);
    }
  }

  return counts;
}

function jobCorpusText(job: Job): string {
  return [job.title, job.description ?? ''].filter(Boolean).join(' ');
}

export function extractKeywordStats(jobs: Job[], limit: number): KeywordStat[] {
  const counts = countTerms(jobs.map(jobCorpusText));
  const total = jobs.length || 1;

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([term, count]) => ({
      term,
      count,
      percentage: Math.round((count / total) * 1000) / 10,
      source: 'jobs' as const,
    }));
}

export function detectRisingKeywords(
  jobs: Job[],
  periodDays: number,
  limit: number,
): KeywordStat[] {
  const now = Date.now();
  const periodMs = periodDays * 24 * 60 * 60 * 1000;
  const recentCutoff = new Date(now - periodMs);
  const previousCutoff = new Date(now - periodMs * 2);

  const recentJobs = jobs.filter((job) => job.scraped_at >= recentCutoff);
  const previousJobs = jobs.filter(
    (job) => job.scraped_at >= previousCutoff && job.scraped_at < recentCutoff,
  );

  const recentCounts = countTerms(recentJobs.map(jobCorpusText));
  const previousCounts = countTerms(previousJobs.map(jobCorpusText));

  const terms = new Set([...recentCounts.keys(), ...previousCounts.keys()]);
  const stats: KeywordStat[] = [];

  for (const term of terms) {
    const recent = recentCounts.get(term) ?? 0;
    const previous = previousCounts.get(term) ?? 0;

    if (recent === 0 && previous === 0) {
      continue;
    }

    let trend: KeywordTrend = 'stable';

    if (recent > previous) {
      trend = 'rising';
    } else if (recent < previous) {
      trend = 'declining';
    }

    stats.push({
      term: normalizeTerm(term),
      count: recent,
      trend,
      source: 'jobs',
    });
  }

  return stats
    .filter((stat) => stat.trend === 'rising')
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function toSkillStats(
  rows: Array<{ skill: string; count: number }>,
  limit: number,
): KeywordStat[] {
  return rows.slice(0, limit).map((row) => ({
    term: normalizeTerm(row.skill),
    count: Number(row.count),
    source: 'analyses' as const,
  }));
}
