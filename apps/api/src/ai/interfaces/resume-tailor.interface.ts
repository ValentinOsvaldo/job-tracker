import { Job } from '../../jobs/entities/job.entity';
import { ResumeLanguage } from '../../resume/enums/resume-language.enum';
import { ResumeProfile } from '../../resume/entities/resume-profile.entity';
import { TailorResumeAiResultDto } from '../types/tailor-resume-result.dto';

export interface ResumeTailor {
  tailorResume(
    job: Job,
    profile: ResumeProfile,
    language: ResumeLanguage,
  ): Promise<TailorResumeAiResultDto>;
}
