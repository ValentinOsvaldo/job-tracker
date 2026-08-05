import { Job } from '../../jobs/entities/job.entity';
import { WorkMode } from '../../jobs/enums/work-mode.enum';

export interface WorkModeCount {
  work_mode: WorkMode;
  count: number;
}

const WORK_MODE_ORDER = [
  WorkMode.REMOTE,
  WorkMode.HYBRID,
  WorkMode.ONSITE,
  WorkMode.UNKNOWN,
];

export function aggregateWorkModes(jobs: Job[]): WorkModeCount[] {
  const counts = new Map<WorkMode, number>();

  for (const job of jobs) {
    counts.set(job.work_mode, (counts.get(job.work_mode) ?? 0) + 1);
  }

  return WORK_MODE_ORDER.filter((mode) => counts.has(mode)).map((mode) => ({
    work_mode: mode,
    count: counts.get(mode) as number,
  }));
}

export interface DayCount {
  date: string;
  count: number;
}

const MAX_TIMELINE_DAYS = 45;

/** Daily job-scrape counts for the timeline chart, zero-filled so gaps in
 * scraping don't read as missing data points. Capped at the most recent
 * 45 days regardless of the requested period so the chart stays legible. */
export function aggregateJobsByDay(
  jobs: Job[],
  periodDays: number,
): DayCount[] {
  const counts = new Map<string, number>();

  for (const job of jobs) {
    const key = job.scraped_at.toISOString().slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const span = Math.min(periodDays, MAX_TIMELINE_DAYS);
  const today = new Date();
  const days: DayCount[] = [];

  for (let offset = span - 1; offset >= 0; offset -= 1) {
    const day = new Date(today);
    day.setUTCDate(day.getUTCDate() - offset);
    const key = day.toISOString().slice(0, 10);
    days.push({ date: key, count: counts.get(key) ?? 0 });
  }

  return days;
}
