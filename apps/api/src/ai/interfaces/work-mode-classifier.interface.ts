import { Job } from '../../jobs/entities/job.entity';
import { WorkModeClassificationResult } from '../types/work-mode-classification-result.type';

export interface WorkModeClassifier {
  classify(job: Job): Promise<WorkModeClassificationResult>;
}
