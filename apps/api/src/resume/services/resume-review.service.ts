import { Injectable } from '@nestjs/common';
import { ResumeProfile } from '../entities/resume-profile.entity';
import { TailoredResumeContent } from '../types/tailored-resume-content.type';
import { jaccardSimilarity } from '../utils/text-similarity';

const NEEDS_REVIEW_SIMILARITY_THRESHOLD = 0.35;

@Injectable()
export class ResumeReviewService {
  /** Marks needs_review on any bullet whose text drifted too far (by simple
   * token-overlap similarity) from the source bullet/evidence it claims to
   * come from. No embeddings exist in this project, so this is intentionally
   * a cheap heuristic, not semantic search. */
  annotate(
    content: TailoredResumeContent,
    profile: ResumeProfile,
  ): TailoredResumeContent {
    const bulletTextById = new Map<string, string>();
    for (const entry of profile.experience) {
      for (const bullet of entry.bullets) {
        bulletTextById.set(bullet.id, bullet.text);
      }
    }

    const evidenceTextById = new Map<string, string>();
    for (const evidence of profile.skill_evidence) {
      evidenceTextById.set(evidence.id, evidence.raw_fact);
    }

    return {
      ...content,
      experience: content.experience.map((entry) => ({
        ...entry,
        bullets: entry.bullets.map((bullet) => {
          const sourceText =
            (bullet.source_bullet_id &&
              bulletTextById.get(bullet.source_bullet_id)) ||
            (bullet.source_evidence_id &&
              evidenceTextById.get(bullet.source_evidence_id)) ||
            null;

          const similarity = sourceText
            ? jaccardSimilarity(bullet.text, sourceText)
            : 0;

          return {
            ...bullet,
            needs_review: similarity < NEEDS_REVIEW_SIMILARITY_THRESHOLD,
          };
        }),
      })),
    };
  }
}
