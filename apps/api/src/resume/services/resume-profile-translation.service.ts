import { Inject, Injectable, Logger } from '@nestjs/common';
import { AI_PROFILE_TRANSLATOR } from '../../ai/ai.constants';
import {
  ProfileTranslator,
  TranslationItem,
} from '../../ai/interfaces/profile-translator.interface';
import { ResumeProfile } from '../entities/resume-profile.entity';

const SUMMARY_PREFIX = 'summary:';
const BULLET_PREFIX = 'bullet:';
const EVIDENCE_FACT_PREFIX = 'evidence_fact:';
const EVIDENCE_IMPACT_PREFIX = 'evidence_impact:';
const PROJECT_PREFIX = 'project:';

/** Translates the free-text facts of a resume profile to English so a
 * tailored resume can be generated (and later similarity-checked) entirely
 * in English. Never touches personal_info, education, skill names/tags, or
 * structural fields (company/role/period/ids) — those are proper nouns or
 * already-English enum values, not prose to translate. */
@Injectable()
export class ResumeProfileTranslationService {
  private readonly logger = new Logger(ResumeProfileTranslationService.name);

  constructor(
    @Inject(AI_PROFILE_TRANSLATOR)
    private readonly translator: ProfileTranslator,
  ) {}

  async toEnglish(profile: ResumeProfile): Promise<ResumeProfile> {
    const items = this.collectItems(profile);

    if (items.length === 0) {
      return profile;
    }

    const translated = await this.translator.translateToEnglish(items);
    const textById = new Map(translated.map((item) => [item.id, item.text]));

    return this.applyTranslations(profile, textById);
  }

  private collectItems(profile: ResumeProfile): TranslationItem[] {
    const items: TranslationItem[] = [];

    for (const [key, text] of Object.entries(profile.summary)) {
      items.push({ id: `${SUMMARY_PREFIX}${key}`, text });
    }

    for (const entry of profile.experience) {
      for (const bullet of entry.bullets) {
        items.push({ id: `${BULLET_PREFIX}${bullet.id}`, text: bullet.text });
      }
    }

    for (const evidence of profile.skill_evidence) {
      items.push({
        id: `${EVIDENCE_FACT_PREFIX}${evidence.id}`,
        text: evidence.raw_fact,
      });
      if (evidence.impact) {
        items.push({
          id: `${EVIDENCE_IMPACT_PREFIX}${evidence.id}`,
          text: evidence.impact,
        });
      }
    }

    for (const project of profile.projects) {
      items.push({
        id: `${PROJECT_PREFIX}${project.id}`,
        text: project.description,
      });
    }

    return items;
  }

  private applyTranslations(
    profile: ResumeProfile,
    textById: Map<string, string>,
  ): ResumeProfile {
    const translatedOrOriginal = (id: string, original: string): string => {
      const translated = textById.get(id);
      if (translated === undefined) {
        this.logger.warn(
          `Missing translation for "${id}", keeping source text`,
        );
        return original;
      }
      return translated;
    };

    return {
      ...profile,
      summary: Object.fromEntries(
        Object.entries(profile.summary).map(([key, text]) => [
          key,
          translatedOrOriginal(`${SUMMARY_PREFIX}${key}`, text),
        ]),
      ),
      experience: profile.experience.map((entry) => ({
        ...entry,
        bullets: entry.bullets.map((bullet) => ({
          ...bullet,
          text: translatedOrOriginal(
            `${BULLET_PREFIX}${bullet.id}`,
            bullet.text,
          ),
        })),
      })),
      skill_evidence: profile.skill_evidence.map((evidence) => ({
        ...evidence,
        raw_fact: translatedOrOriginal(
          `${EVIDENCE_FACT_PREFIX}${evidence.id}`,
          evidence.raw_fact,
        ),
        impact: evidence.impact
          ? translatedOrOriginal(
              `${EVIDENCE_IMPACT_PREFIX}${evidence.id}`,
              evidence.impact,
            )
          : evidence.impact,
      })),
      projects: profile.projects.map((project) => ({
        ...project,
        description: translatedOrOriginal(
          `${PROJECT_PREFIX}${project.id}`,
          project.description,
        ),
      })),
    };
  }
}
