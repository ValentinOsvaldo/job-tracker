import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
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
import { Roles } from '../auth/decorators/roles.decorator';
import { PublicUser } from '../users/types/public-user.type';
import { UserRole } from '../users/enums/user-role.enum';
import { BulkDeleteJobsDto } from './dto/bulk-delete-jobs.dto';
import {
  BlockedCompanyResponseDto,
  CreateBlockedCompanyDto,
  CreateBlockedCompanyResultDto,
} from './dto/blocked-company.dto';
import { IngestJobDto } from './dto/ingest-job.dto';
import { ListJobsQueryDto } from './dto/list-jobs-query.dto';
import { PipelineStatsDto } from './dto/pipeline-stats.dto';
import {
  BulkDeleteJobsResultDto,
  DeleteAllJobsResultDto,
  IngestResultDto,
  PaginatedJobsResponseDto,
  RelevanceScanResultDto,
  WorkModeBackfillResultDto,
} from './dto/jobs-response.dto';
import { ScrapeTriggerResultDto } from './dto/scrape-trigger-result.dto';
import {
  JobStatusResponseDto,
  UpdateJobStatusDto,
} from './dto/update-job-status.dto';
import { Job } from './entities/job.entity';
import { JobsService } from './jobs.service';
import { JobsListQuery } from './types/jobs-list-query.type';
import { ValidateTailoredResumeDto } from '../resume/dto/tailored-resume/validate-tailored-resume.dto';
import { TailoredResume } from '../resume/entities/tailored-resume.entity';
import { ResumeLanguage } from '../resume/enums/resume-language.enum';
import { ResumeTemplateService } from '../resume/services/resume-template.service';
import { TailorResumeService } from '../resume/services/tailor-resume.service';

@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly jobAnalysesService: JobAnalysesService,
    private readonly marketTrendsService: MarketTrendsService,
    private readonly tailorResumeService: TailorResumeService,
    private readonly resumeTemplateService: ResumeTemplateService,
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

  @Get('pipeline-stats')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get application pipeline stats for the current user',
    description:
      'Counts of applied jobs still pending vs. rejected, and the average number of days between applying and being rejected.',
  })
  @ApiResponse({ status: 200, type: PipelineStatsDto })
  getPipelineStats(@Req() req: { user: PublicUser }) {
    return this.jobsService.getPipelineStats(req.user.id);
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
      interest: query.interest,
      applied: query.applied,
      rejected: query.rejected,
      workMode: query.work_mode,
      relevance: query.relevance,
      locationCountry: query.location_country,
      locationCity: query.location_city,
      addedWithin: query.added_within,
      sortBy: query.sort_by,
      sortDir: query.sort_dir,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    };

    return this.jobsService.findAll(req.user.id, listQuery);
  }

  @Delete()
  @HttpCode(200)
  @ApiBearerAuth('access-token')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete all jobs and their analyses (admin only)' })
  @ApiResponse({ status: 200, type: DeleteAllJobsResultDto })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  async removeAll() {
    const { deleted } = await this.jobsService.removeAll();
    return { ok: true, deleted };
  }

  @Post('bulk-delete')
  @HttpCode(200)
  @ApiBearerAuth('access-token')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Delete multiple jobs and their analyses (admin only)',
  })
  @ApiBody({ type: BulkDeleteJobsDto })
  @ApiResponse({ status: 200, type: BulkDeleteJobsResultDto })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  async bulkDelete(@Body() body: BulkDeleteJobsDto) {
    const { deleted } = await this.jobsService.removeMany(body.ids);
    return { ok: true, deleted };
  }

  @Delete(':id')
  @HttpCode(200)
  @ApiBearerAuth('access-token')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Delete a single job and its analyses (admin only)',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Deleted' })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.jobsService.remove(id);
    return { ok: true };
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
    return this.jobsService.updateUserStatus(req.user.id, id, body);
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

  @Post(':id/summary/regenerate')
  @HttpCode(200)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Regenerate the AI TLDR summary for a job' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: Job })
  @ApiResponse({ status: 404, description: 'Job not found' })
  regenerateSummary(@Param('id', ParseUUIDPipe) id: string) {
    return this.jobAnalysesService.regenerateSummaryForJob(id);
  }

  @Post(':id/work-mode/regenerate')
  @HttpCode(200)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Regenerate the AI work mode/location classification for a job',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: Job })
  @ApiResponse({ status: 404, description: 'Job not found' })
  regenerateWorkMode(@Param('id', ParseUUIDPipe) id: string) {
    return this.jobAnalysesService.regenerateWorkModeForJob(id);
  }

  @Post('work-mode/backfill')
  @HttpCode(200)
  @ApiBearerAuth('access-token')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary:
      'Queue AI work mode/location classification for all jobs still unknown (admin only)',
  })
  @ApiResponse({ status: 200, type: WorkModeBackfillResultDto })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  backfillWorkModes() {
    return this.jobAnalysesService.backfillWorkModes();
  }

  @Post('relevance/scan')
  @HttpCode(200)
  @ApiBearerAuth('access-token')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary:
      'Queue AI relevance classification for all jobs not yet checked (admin only)',
    description:
      'Classifies each unchecked job as related or unrelated to the roles/keywords of active search profiles, so off-topic scraped jobs can be filtered and bulk-deleted.',
  })
  @ApiResponse({ status: 200, type: RelevanceScanResultDto })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  scanRelevance() {
    return this.jobAnalysesService.scanRelevance();
  }

  @Get('blocked-companies')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List blocked companies' })
  @ApiResponse({ status: 200, type: [BlockedCompanyResponseDto] })
  listBlockedCompanies() {
    return this.jobsService.listBlockedCompanies();
  }

  @Post('blocked-companies')
  @HttpCode(200)
  @ApiBearerAuth('access-token')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Block a company (admin only)',
    description:
      'Prevents future scraped jobs from this company from being ingested and hides any already-scraped ones. Optionally purges existing matches.',
  })
  @ApiBody({ type: CreateBlockedCompanyDto })
  @ApiResponse({ status: 200, type: CreateBlockedCompanyResultDto })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  createBlockedCompany(@Body() body: CreateBlockedCompanyDto) {
    return this.jobsService.createBlockedCompany(body);
  }

  @Delete('blocked-companies/:id')
  @HttpCode(200)
  @ApiBearerAuth('access-token')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Unblock a company (admin only)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Deleted' })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  @ApiResponse({ status: 404, description: 'Blocked company not found' })
  async removeBlockedCompany(@Param('id', ParseUUIDPipe) id: string) {
    await this.jobsService.removeBlockedCompany(id);
    return { ok: true };
  }

  @Post(':id/tailor-resume')
  @HttpCode(200)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Generate an AI-tailored resume for this job application',
    description:
      'Requires the job to be marked as applied by the current user and a resume profile to already exist. Overwrites any previously generated tailored resume for this job.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiQuery({
    name: 'language',
    required: false,
    enum: ResumeLanguage,
    description: 'Defaults to English; pass "es" for a Spanish resume.',
  })
  @ApiResponse({ status: 200, type: TailoredResume })
  @ApiResponse({ status: 403, description: 'Job was not marked as applied' })
  @ApiResponse({
    status: 404,
    description: 'Job not found, or no resume profile created yet',
  })
  generateTailoredResume(
    @Req() req: { user: PublicUser },
    @Param('id', ParseUUIDPipe) id: string,
    @Query(
      'language',
      new DefaultValuePipe(ResumeLanguage.EN),
      new ParseEnumPipe(ResumeLanguage),
    )
    language: ResumeLanguage,
  ) {
    return this.tailorResumeService.generate(req.user.id, id, language);
  }

  @Get(':id/tailor-resume')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get the saved tailored resume for this job' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: TailoredResume })
  @ApiResponse({
    status: 404,
    description: 'Job not found, or no tailored resume generated yet',
  })
  getTailoredResume(
    @Req() req: { user: PublicUser },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tailorResumeService.findSaved(req.user.id, id);
  }

  @Post(':id/tailor-resume/validate')
  @HttpCode(200)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Re-check (and optionally save) edits to a tailored resume',
    description:
      'Send generated_content to persist a hand-edited version first; omit it to just re-run the needs_review check against what is currently saved.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: ValidateTailoredResumeDto })
  @ApiResponse({ status: 200, type: TailoredResume })
  @ApiResponse({
    status: 404,
    description: 'Job not found, or no tailored resume generated yet',
  })
  validateTailoredResume(
    @Req() req: { user: PublicUser },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ValidateTailoredResumeDto,
  ) {
    return this.tailorResumeService.validate(
      req.user.id,
      id,
      body.generated_content,
    );
  }

  @Get(':id/tailor-resume/pdf')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Download the tailored resume as a PDF' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiQuery({ name: 'template', required: false, example: 'classic' })
  @ApiResponse({ status: 200, description: 'application/pdf stream' })
  @ApiResponse({
    status: 404,
    description: 'Job not found, or no tailored resume generated yet',
  })
  async downloadTailoredResumePdf(
    @Req() req: { user: PublicUser },
    @Param('id', ParseUUIDPipe) id: string,
    @Query('template') template = 'classic',
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const saved = await this.tailorResumeService.findSaved(req.user.id, id);
    const buffer = await this.resumeTemplateService.renderPdf(
      template,
      saved.generated_content,
      saved.language,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="cv-${id}.pdf"`,
    });

    return new StreamableFile(buffer);
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
