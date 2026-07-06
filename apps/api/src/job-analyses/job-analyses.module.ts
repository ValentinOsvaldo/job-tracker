import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobAnalysis } from './entities/job-analysis.entity';
import { JobAnalysesService } from './job-analyses.service';

@Module({
  imports: [TypeOrmModule.forFeature([JobAnalysis])],
  providers: [JobAnalysesService],
  exports: [JobAnalysesService, TypeOrmModule],
})
export class JobAnalysesModule {}
