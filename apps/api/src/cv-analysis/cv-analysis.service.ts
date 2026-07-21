import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AI_CV_ANALYZER } from '../ai/ai.constants';
import { CvAnalyzer } from '../ai/interfaces/cv-analyzer.interface';
import { CvAnalysisAiResult } from '../ai/types/cv-analysis-result.type';
import { KeywordStat } from '../ai/types/keyword-stat.type';
import { JobAnalysis } from '../job-analyses/entities/job-analysis.entity';
import { SearchProfile } from '../profiles/entities/search-profile.entity';
import { User } from '../users/entities/user.entity';
import { CvAnalysisResponse } from './types/cv-analysis-response.type';

interface CachedCvAnalysis {
  result: CvAnalysisAiResult;
  analyzedJobsCount: number;
  expiresAt: number;
}

@Injectable()
export class CvAnalysisService {
  private readonly cache = new Map<string, CachedCvAnalysis>();

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(SearchProfile)
    private readonly profilesRepository: Repository<SearchProfile>,
    @InjectRepository(JobAnalysis)
    private readonly jobAnalysesRepository: Repository<JobAnalysis>,
    @Inject(AI_CV_ANALYZER)
    private readonly cvAnalyzer: CvAnalyzer,
    private readonly configService: ConfigService,
  ) {}

  async getCvAnalysis(
    userId: string,
    refresh = false,
  ): Promise<CvAnalysisResponse> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user?.cv_text) {
      throw new BadRequestException(
        'Upload a CV before requesting an analysis',
      );
    }

    // Keyed on cv_uploaded_at so a fresh CV upload naturally busts the cache
    // instead of returning a stale analysis of the previous CV for up to
    // CV_ANALYSIS_CACHE_TTL_HOURS.
    const cacheKey = `${userId}:${user.cv_uploaded_at?.toISOString() ?? 'none'}`;
    const cached = this.cache.get(cacheKey);
    const cacheValid = cached && cached.expiresAt > Date.now();

    if (!refresh && cacheValid) {
      return this.toResponse(cached.result, cached.analyzedJobsCount, true);
    }

    const profiles = await this.profilesRepository.find({
      where: { user_id: userId },
    });

    const [strengths, gaps, fitStats] = await Promise.all([
      this.aggregateSkills(userId, 'matched_skills'),
      this.aggregateSkills(userId, 'missing_skills'),
      this.getFitStats(userId),
    ]);

    const result = await this.cvAnalyzer.analyzeCv({
      cvText: user.cv_text,
      profiles: profiles.map((p) => ({
        name: p.name,
        role: p.role,
        keywords: p.keywords,
      })),
      topStrengths: strengths.slice(0, 15),
      topGaps: gaps.slice(0, 15),
      avgFitScore: fitStats.avg,
      analyzedJobsCount: fitStats.count,
    });

    this.cache.set(cacheKey, {
      result,
      analyzedJobsCount: fitStats.count,
      expiresAt: Date.now() + this.getCacheTtlMs(),
    });

    return this.toResponse(result, fitStats.count, false);
  }

  private toResponse(
    result: CvAnalysisAiResult,
    analyzedJobsCount: number,
    aiCached: boolean,
  ): CvAnalysisResponse {
    return {
      ...result,
      analyzed_jobs_count: analyzedJobsCount,
      generated_at: new Date().toISOString(),
      ai_cached: aiCached,
    };
  }

  private async aggregateSkills(
    userId: string,
    column: 'matched_skills' | 'missing_skills',
  ): Promise<KeywordStat[]> {
    const rows: Array<{ skill: string; count: number }> =
      await this.jobAnalysesRepository.query(
        `
          SELECT skill, COUNT(*)::int AS count
          FROM (
            SELECT unnest(ja.${column}) AS skill
            FROM job_analyses ja
            INNER JOIN search_profiles sp ON sp.id = ja.profile_id
            WHERE sp.user_id = $1
          ) aggregated
          WHERE skill IS NOT NULL AND skill <> ''
          GROUP BY skill
          ORDER BY count DESC
          LIMIT 50
        `,
        [userId],
      );

    return rows.map((row) => ({ term: row.skill, count: Number(row.count) }));
  }

  private async getFitStats(
    userId: string,
  ): Promise<{ avg: number | null; count: number }> {
    const rows: Array<{ avg: string | null; count: string }> =
      await this.jobAnalysesRepository.query(
        `
          SELECT AVG(ja.fit_score) AS avg, COUNT(*)::int AS count
          FROM job_analyses ja
          INNER JOIN search_profiles sp ON sp.id = ja.profile_id
          WHERE sp.user_id = $1
        `,
        [userId],
      );

    const row = rows[0];

    return {
      avg: row?.avg != null ? Number(row.avg) : null,
      count: Number(row?.count ?? 0),
    };
  }

  private getCacheTtlMs(): number {
    const hours = Number(
      this.configService.get('CV_ANALYSIS_CACHE_TTL_HOURS') ?? 24,
    );

    return hours * 60 * 60 * 1000;
  }
}
