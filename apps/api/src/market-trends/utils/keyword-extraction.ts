import { Job } from '../../jobs/entities/job.entity';
import { KeywordStat, KeywordTrend } from '../../ai/types/keyword-stat.type';
import { normalizeTerm } from './keyword-tokenizer';

/** Counts, per curated tech keyword (job.tech_keywords, populated at
 * ingest/backfill time from the taxonomy in jobs/utils/tech-keywords.ts),
 * how many jobs mention it — each job contributes at most once per term
 * since tech_keywords is already deduped per posting. Using the persisted
 * column instead of tokenizing title/description on every request keeps
 * "top keywords" limited to real technologies rather than arbitrary
 * high-frequency words. */
function countTechKeywords(jobs: Job[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const job of jobs) {
    for (const term of job.tech_keywords ?? []) {
      counts.set(term, (counts.get(term) ?? 0) + 1);
    }
  }

  return counts;
}

export function extractKeywordStats(jobs: Job[], limit: number): KeywordStat[] {
  const counts = countTechKeywords(jobs);
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

  const recentCounts = countTechKeywords(recentJobs);
  const previousCounts = countTechKeywords(previousJobs);

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
      term,
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
