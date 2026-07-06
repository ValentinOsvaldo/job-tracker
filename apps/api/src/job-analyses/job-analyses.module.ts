import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroqModule } from '../groq/groq.module';
import { Job } from '../jobs/entities/job.entity';
import { SearchProfile } from '../profiles/entities/search-profile.entity';
import { JobAnalysis } from './entities/job-analysis.entity';
import { JobAnalysesService } from './job-analyses.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([JobAnalysis, Job, SearchProfile]),
    GroqModule,
  ],
  providers: [JobAnalysesService],
  exports: [JobAnalysesService, TypeOrmModule],
})
export class JobAnalysesModule {}
