import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { IngestJobDto } from './dto/ingest-job.dto';
import { ListJobsQueryDto } from './dto/list-jobs-query.dto';
import {
  IngestResultDto,
  PaginatedJobsResponseDto,
} from './dto/jobs-response.dto';
import { Job } from './entities/job.entity';
import { JobsService } from './jobs.service';

@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

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

  @Get()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List jobs with pagination' })
  @ApiResponse({ status: 200, type: PaginatedJobsResponseDto })
  findAll(@Query() query: ListJobsQueryDto) {
    return this.jobsService.findAll(query);
  }

  @Get(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get a job by ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: Job })
  @ApiResponse({ status: 404, description: 'Job not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.jobsService.findOne(id);
  }
}
