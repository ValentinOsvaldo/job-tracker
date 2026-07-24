import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobAnalysesModule } from '../job-analyses/job-analyses.module';
import { MarketTrendsModule } from '../market-trends/market-trends.module';
import { SearchProfile } from '../profiles/entities/search-profile.entity';
import { User } from '../users/entities/user.entity';
import { Job } from './entities/job.entity';
import { JobUserStatus } from './entities/job-user-status.entity';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Job, SearchProfile, JobUserStatus, User]),
    JobAnalysesModule,
    MarketTrendsModule,
  ],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
