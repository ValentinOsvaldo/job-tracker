import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiModule } from '../ai/ai.module';
import { JobAnalysis } from '../job-analyses/entities/job-analysis.entity';
import { SearchProfile } from '../profiles/entities/search-profile.entity';
import { User } from '../users/entities/user.entity';
import { CvAnalysisService } from './cv-analysis.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, SearchProfile, JobAnalysis]),
    AiModule,
  ],
  providers: [CvAnalysisService],
  exports: [CvAnalysisService],
})
export class CvAnalysisModule {}
