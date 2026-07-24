import { Job } from '../../jobs/entities/job.entity';
import { RelevanceClassificationResult } from '../types/relevance-classification-result.type';

export interface RelevanceClassifier {
  classify(
    job: Job,
    targetRoles: string,
  ): Promise<RelevanceClassificationResult>;
}
