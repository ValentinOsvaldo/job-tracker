import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RegenerateAnalysesResultDto } from '../job-analyses/dto/regenerate-analyses-result.dto';
import { JobAnalysesService } from '../job-analyses/job-analyses.service';
import { MarketTrendsResponseDto } from '../market-trends/dto/market-trends-response.dto';
import { TrendsQueryDto } from '../market-trends/dto/trends-query.dto';
import { MarketTrendsService } from '../market-trends/market-trends.service';
import { Public } from '../auth/decorators/public.decorator';
import { PublicUser } from '../users/types/public-user.type';
import { IngestJobDto } from './dto/ingest-job.dto';
import { ListJobsQueryDto } from './dto/list-jobs-query.dto';
import {
  DeleteAllJobsResultDto,
  IngestResultDto,
  PaginatedJobsResponseDto,
} from './dto/jobs-response.dto';
import { ScrapeTriggerResultDto } from './dto/scrape-trigger-result.dto';
import {
  JobStatusResponseDto,
  UpdateJobStatusDto,
} from './dto/update-job-status.dto';
import { Job } from './entities/job.entity';
import { JobsService } from './jobs.service';
import { JobsListQuery } from './types/jobs-list-query.type';

@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly jobAnalysesService: JobAnalysesService,
    private readonly marketTrendsService: MarketTrendsService,
  ) {}

  @Public()
  @Post('ingest')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Ingest scraped jobs',
    description: 'Accepts a raw JSON array of job records from the scraper.',
  })
  @ApiBody({ type: [IngestJobDto] })
  @ApiResponse({ status: 200, type: IngestResultDto })
  ingest(@Body() records: Record<string, unknown>[]) {
    if (!Array.isArray(records)) {
      throw new BadRequestException('Body must be a JSON array of job records');
    }

    return this.jobsService.ingest(records);
  }

  @Post('scrape')
  @HttpCode(200)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Trigger a manual scrape',
    description:
      'Calls the Python scraper using keywords/locations from the authenticated user’s active profiles (or scraper defaults when none exist).',
  })
  @ApiResponse({ status: 200, type: ScrapeTriggerResultDto })
  @ApiResponse({ status: 502, description: 'Scraper failed' })
  @ApiResponse({ status: 503, description: 'Scraper unreachable' })
  triggerScrape(@Req() req: { user: PublicUser }) {
    return this.jobsService.triggerScrape(req.user.id);
  }

  @Get('trends')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get market trends from scraped jobs' })
  @ApiResponse({ status: 200, type: MarketTrendsResponseDto })
  getTrends(@Query() query: TrendsQueryDto) {
    return this.marketTrendsService.getTrends(query);
  }

  @Get()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List jobs with pagination' })
  @ApiResponse({ status: 200, type: PaginatedJobsResponseDto })
  findAll(@Req() req: { user: PublicUser }, @Query() query: ListJobsQueryDto) {
    const listQuery: JobsListQuery = {
      source: query.source,
      profileId: query.profile_id,
      minScore: query.min_score,
      status: query.status,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    };

    return this.jobsService.findAll(req.user.id, listQuery);
  }

  @Delete()
  @HttpCode(200)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete all jobs and their analyses' })
  @ApiResponse({ status: 200, type: DeleteAllJobsResultDto })
  async removeAll() {
    const { deleted } = await this.jobsService.removeAll();
    return { ok: true, deleted };
  }

  @Patch(':id/status')
  @HttpCode(200)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Set job interest/application status for the current user',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: UpdateJobStatusDto })
  @ApiResponse({ status: 200, type: JobStatusResponseDto })
  @ApiResponse({ status: 404, description: 'Job not found' })
  updateStatus(
    @Req() req: { user: PublicUser },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateJobStatusDto,
  ) {
    return this.jobsService.updateUserStatus(
      req.user.id,
      id,
      body.status === undefined ? null : body.status,
    );
  }

  @Post(':id/analyses/regenerate')
  @HttpCode(200)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Regenerate AI analyses for a job' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiQuery({ name: 'profile_id', required: false, format: 'uuid' })
  @ApiResponse({ status: 200, type: RegenerateAnalysesResultDto })
  regenerateAnalyses(
    @Req() req: { user: PublicUser },
    @Param('id', ParseUUIDPipe) id: string,
    @Query('profile_id', new ParseUUIDPipe({ optional: true }))
    profileId?: string,
  ) {
    return this.jobAnalysesService.regenerateForJob(req.user.id, id, profileId);
  }

  @Get(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get a job by ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: Job })
  @ApiResponse({ status: 404, description: 'Job not found' })
  findOne(
    @Req() req: { user: PublicUser },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.jobsService.findOne(req.user.id, id);
  }
}
