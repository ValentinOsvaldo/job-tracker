import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiModule } from '../ai/ai.module';
import { Job } from '../jobs/entities/job.entity';
import { JobUserStatus } from '../jobs/entities/job-user-status.entity';
import { ResumeProfile } from './entities/resume-profile.entity';
import { TailoredResume } from './entities/tailored-resume.entity';
import { ResumeProfileService } from './services/resume-profile.service';
import { ResumeReviewService } from './services/resume-review.service';
import { ResumeTemplateService } from './services/resume-template.service';
import { TailorResumeService } from './services/tailor-resume.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ResumeProfile,
      TailoredResume,
      Job,
      JobUserStatus,
    ]),
    AiModule,
  ],
  providers: [
    ResumeProfileService,
    ResumeReviewService,
    TailorResumeService,
    ResumeTemplateService,
  ],
  exports: [
    ResumeProfileService,
    ResumeReviewService,
    TailorResumeService,
    ResumeTemplateService,
    TypeOrmModule,
  ],
})
export class ResumeModule {}
