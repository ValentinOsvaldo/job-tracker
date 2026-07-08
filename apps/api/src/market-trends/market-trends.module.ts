import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiModule } from '../ai/ai.module';
import { JobAnalysis } from '../job-analyses/entities/job-analysis.entity';
import { Job } from '../jobs/entities/job.entity';
import { MarketTrendsService } from './market-trends.service';

@Module({
  imports: [TypeOrmModule.forFeature([Job, JobAnalysis]), AiModule],
  providers: [MarketTrendsService],
  exports: [MarketTrendsService],
})
export class MarketTrendsModule {}
