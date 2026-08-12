import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { AI_TRENDS_ANALYZER } from '../ai/ai.constants';
import { TrendsAnalyzer } from '../ai/interfaces/trends-analyzer.interface';
import { MarketTrendsAiResult } from '../ai/types/market-trends-result.type';
import { JobAnalysis } from '../job-analyses/entities/job-analysis.entity';
import { JobSource } from '../jobs/enums/job-source.enum';
import { Job } from '../jobs/entities/job.entity';
import { MarketTrendsResponse } from './dto/market-trends-response.dto';
import { TrendsQueryDto } from './dto/trends-query.dto';
import {
  detectRisingKeywords,
  extractKeywordStats,
  toSkillStats,
} from './utils/keyword-extraction';
import {
  aggregateJobsByDay,
  aggregateRoleCategories,
  aggregateWorkModes,
} from './utils/job-stats';
import { aggregateLocations } from './utils/location-aggregation';

interface CachedTrendsInsights {
  result: MarketTrendsAiResult;
  expiresAt: number;
}

@Injectable()
export class MarketTrendsService {
  private readonly logger = new Logger(MarketTrendsService.name);
  private readonly aiCache = new Map<string, CachedTrendsInsights>();

  constructor(
    @InjectRepository(Job)
    private readonly jobsRepository: Repository<Job>,
    @InjectRepository(JobAnalysis)
    private readonly jobAnalysesRepository: Repository<JobAnalysis>,
    @Inject(AI_TRENDS_ANALYZER)
    private readonly trendsAnalyzer: TrendsAnalyzer,
    private readonly configService: ConfigService,
  ) {}

  async getTrends(query: TrendsQueryDto): Promise<MarketTrendsResponse> {
    const periodDays = query.days ?? 30;
    const limit = query.limit ?? 20;
    const refresh = query.refresh ?? false;
    const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

    const jobs = await this.jobsRepository.find({
      where: {
        scraped_at: MoreThanOrEqual(since),
        ...(query.source ? { source: query.source } : {}),
      },
      order: { scraped_at: 'DESC' },
    });

    const topKeywords = extractKeywordStats(jobs, limit);
    const risingKeywords = detectRisingKeywords(jobs, periodDays, 15);
    const topDemandedSkills = toSkillStats(
      await this.aggregateSkills('matched_skills'),
      limit,
    );
    const topMissingSkills = toSkillStats(
      await this.aggregateSkills('missing_skills'),
      limit,
    );
    const locations = aggregateLocations(jobs);
    const byWorkMode = aggregateWorkModes(jobs);
    const byRoleCategory = aggregateRoleCategories(jobs);
    const jobsByDay = aggregateJobsByDay(jobs, periodDays);

    if (jobs.length === 0) {
      return {
        period_days: periodDays,
        total_jobs: 0,
        jobs_with_description: 0,
        top_keywords: [],
        top_demanded_skills: topDemandedSkills,
        top_missing_skills: topMissingSkills,
        locations,
        by_work_mode: byWorkMode,
        by_role_category: byRoleCategory,
        jobs_by_day: jobsByDay,
        ai_insights: null,
        generated_at: new Date().toISOString(),
        ai_cached: false,
      };
    }

    const cacheKey = this.buildCacheKey(periodDays, query.source, topKeywords);
    let aiInsights: MarketTrendsAiResult | null = null;
    let aiCached = false;

    const cached = this.aiCache.get(cacheKey);
    const cacheValid = cached && cached.expiresAt > Date.now();

    if (!refresh && cacheValid) {
      aiInsights = cached.result;
      aiCached = true;
    } else {
      try {
        aiInsights = await this.trendsAnalyzer.summarizeTrends({
          periodDays,
          totalJobs: jobs.length,
          topKeywords: topKeywords.slice(0, 30),
          risingKeywords,
          topSkillsFromAnalyses: topDemandedSkills.slice(0, 15),
          sampleTitles: jobs.slice(0, 10).map((job) => job.title),
        });

        this.aiCache.set(cacheKey, {
          result: aiInsights,
          expiresAt: Date.now() + this.getCacheTtlMs(),
        });
      } catch (error: unknown) {
        this.logger.warn(
          'Failed to generate AI market trends insights',
          error instanceof Error ? error.message : error,
        );
      }
    }

    return {
      period_days: periodDays,
      total_jobs: jobs.length,
      jobs_with_description: jobs.filter((job) => !!job.description).length,
      top_keywords: topKeywords,
      top_demanded_skills: topDemandedSkills,
      top_missing_skills: topMissingSkills,
      locations,
      by_work_mode: byWorkMode,
      by_role_category: byRoleCategory,
      jobs_by_day: jobsByDay,
      ai_insights: aiInsights,
      generated_at: new Date().toISOString(),
      ai_cached: aiCached,
    };
  }

  private async aggregateSkills(
    column: 'matched_skills' | 'missing_skills',
  ): Promise<Array<{ skill: string; count: number }>> {
    return this.jobAnalysesRepository.query(
      `
        SELECT skill, COUNT(*)::int AS count
        FROM (
          SELECT unnest(${column}) AS skill
          FROM job_analyses
        ) aggregated
        WHERE skill IS NOT NULL AND skill <> ''
        GROUP BY skill
        ORDER BY count DESC
        LIMIT 50
      `,
    );
  }

  private buildCacheKey(
    periodDays: number,
    source: JobSource | undefined,
    topKeywords: { term: string; count: number }[],
  ): string {
    const keywordSnapshot = topKeywords
      .slice(0, 10)
      .map((item) => `${item.term}:${item.count}`)
      .join('|');

    return `${periodDays}:${source ?? 'all'}:${keywordSnapshot}`;
  }

  private getCacheTtlMs(): number {
    const hours = Number(this.configService.get('TRENDS_CACHE_TTL_HOURS') ?? 6);

    return hours * 60 * 60 * 1000;
  }
}
