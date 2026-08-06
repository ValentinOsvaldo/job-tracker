import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { AI_RESUME_TAILOR } from '../../ai/ai.constants';
import { ResumeTailor } from '../../ai/interfaces/resume-tailor.interface';
import {
  TailorBulletDto,
  TailorResumeAiResultDto,
} from '../../ai/types/tailor-resume-result.dto';
import { Job } from '../../jobs/entities/job.entity';
import { JobUserStatus } from '../../jobs/entities/job-user-status.entity';
import { TailoredResumeContentDto } from '../dto/tailored-resume/tailored-resume-content.dto';
import { EvidenceConfidence } from '../enums/evidence-confidence.enum';
import { ResumeProfile } from '../entities/resume-profile.entity';
import { TailoredResume } from '../entities/tailored-resume.entity';
import { ResumeProfileService } from './resume-profile.service';
import { ResumeReviewService } from './resume-review.service';
import {
  Bullet,
  Skill,
  SkillEvidenceItem,
} from '../types/resume-profile.types';
import {
  TailoredBullet,
  TailoredExperienceEntry,
  TailoredProject,
  TailoredResumeContent,
} from '../types/tailored-resume-content.type';

function experienceKey(entry: {
  company: string;
  role: string;
  period: string;
}): string {
  return `${entry.company}|||${entry.role}|||${entry.period}`;
}

@Injectable()
export class TailorResumeService {
  private readonly logger = new Logger(TailorResumeService.name);

  constructor(
    @InjectRepository(TailoredResume)
    private readonly tailoredResumeRepository: Repository<TailoredResume>,
    @InjectRepository(Job)
    private readonly jobsRepository: Repository<Job>,
    @InjectRepository(JobUserStatus)
    private readonly jobUserStatusRepository: Repository<JobUserStatus>,
    @Inject(AI_RESUME_TAILOR)
    private readonly resumeTailor: ResumeTailor,
    private readonly resumeProfileService: ResumeProfileService,
    private readonly resumeReviewService: ResumeReviewService,
  ) {}

  async generate(userId: string, jobId: string): Promise<TailoredResume> {
    const job = await this.assertOwnership(userId, jobId);
    const profile = await this.resumeProfileService.findByUser(userId);

    const aiResult = await this.resumeTailor.tailorResume(job, profile);
    const assembled = this.assembleGeneratedContent(aiResult, profile);
    const reviewed = this.resumeReviewService.annotate(assembled, profile);

    return this.save(userId, jobId, reviewed);
  }

  async findSaved(userId: string, jobId: string): Promise<TailoredResume> {
    await this.assertOwnership(userId, jobId);

    const saved = await this.tailoredResumeRepository.findOne({
      where: { user_id: userId, job_id: jobId },
    });

    if (!saved) {
      throw new NotFoundException(
        'No tailored resume generated yet for this job',
      );
    }

    return saved;
  }

  async validate(
    userId: string,
    jobId: string,
    edited?: TailoredResumeContentDto,
  ): Promise<TailoredResume> {
    await this.assertOwnership(userId, jobId);
    const profile = await this.resumeProfileService.findByUser(userId);

    const existing = await this.tailoredResumeRepository.findOne({
      where: { user_id: userId, job_id: jobId },
    });

    if (!existing) {
      throw new NotFoundException(
        'No tailored resume generated yet for this job',
      );
    }

    // personal_info/education are never accepted from the client — always
    // re-synced from the live profile, same guarantee as on generate().
    const current: TailoredResumeContent = edited
      ? {
          personal_info: profile.personal_info,
          summary_variant_used: edited.summary_variant_used,
          summary: edited.summary,
          skills: edited.skills,
          experience: edited.experience.map((entry) => ({
            ...entry,
            bullets: entry.bullets.map((bullet) => ({
              ...bullet,
              needs_review: bullet.needs_review ?? false,
            })),
          })),
          projects: edited.projects,
          education: profile.education,
        }
      : existing.generated_content;

    const reviewed = this.resumeReviewService.annotate(current, profile);
    return this.save(userId, jobId, reviewed, existing.id);
  }

  private async save(
    userId: string,
    jobId: string,
    content: TailoredResumeContent,
    existingId?: string,
  ): Promise<TailoredResume> {
    const row = this.tailoredResumeRepository.create({
      id: existingId,
      job_id: jobId,
      user_id: userId,
      generated_content: content,
    });

    return this.tailoredResumeRepository.save(row);
  }

  private async assertOwnership(userId: string, jobId: string): Promise<Job> {
    const job = await this.jobsRepository.findOneBy({ id: jobId });

    if (!job) {
      throw new NotFoundException(`Job with id ${jobId} not found`);
    }

    const status = await this.jobUserStatusRepository.findOne({
      where: { user_id: userId, job_id: jobId, applied: true },
    });

    if (!status) {
      throw new ForbiddenException(
        'You must mark this job as applied before generating a tailored resume',
      );
    }

    return job;
  }

  /** Enforces "never invent" in code, not just in the prompt: every bullet
   * must resolve to a real source in this user's profile, low-confidence
   * evidence never becomes an achievement bullet, at most 4 bullets survive
   * per role, and personal_info/education are copied verbatim rather than
   * read from the AI's output at all. */
  private assembleGeneratedContent(
    aiResult: TailorResumeAiResultDto,
    profile: ResumeProfile,
  ): TailoredResumeContent {
    if (!(aiResult.summary_variant_used in profile.summary)) {
      throw new BadRequestException(
        'AI selected a summary variant that does not exist in this profile',
      );
    }

    const bulletById = new Map<string, Bullet>();
    for (const entry of profile.experience) {
      for (const bullet of entry.bullets) {
        bulletById.set(bullet.id, bullet);
      }
    }

    const evidenceById = new Map<string, SkillEvidenceItem>();
    for (const evidence of profile.skill_evidence) {
      evidenceById.set(evidence.id, evidence);
    }

    const profileExperienceByKey = new Map(
      profile.experience.map((entry) => [experienceKey(entry), entry]),
    );

    const experience: TailoredExperienceEntry[] = [];

    for (const aiEntry of aiResult.experience) {
      const profileEntry = profileExperienceByKey.get(experienceKey(aiEntry));

      if (!profileEntry) {
        this.logger.warn(
          `Dropping unmatched experience entry: ${aiEntry.company} / ${aiEntry.role}`,
        );
        continue;
      }

      const profileBulletIds = new Set(
        profileEntry.bullets.map((bullet) => bullet.id),
      );

      const bullets = aiEntry.bullets
        .map((aiBullet) =>
          this.resolveBullet(
            aiBullet,
            profileBulletIds,
            bulletById,
            evidenceById,
          ),
        )
        .filter((bullet): bullet is TailoredBullet => bullet !== null)
        .sort((a, b) => b.relevance_score - a.relevance_score)
        .slice(0, 4);

      if (bullets.length === 0) {
        continue;
      }

      experience.push({
        company: profileEntry.company,
        role: profileEntry.role,
        period: profileEntry.period,
        location: profileEntry.location,
        bullets,
      });
    }

    const profileProjectById = new Map(
      profile.projects.map((project) => [project.id, project]),
    );

    const projects: TailoredProject[] = [];
    for (const aiProject of aiResult.projects) {
      const source = profileProjectById.get(aiProject.source_project_id);

      if (!source) {
        this.logger.warn(
          `Dropping project with unknown source_project_id: ${aiProject.source_project_id}`,
        );
        continue;
      }

      projects.push({
        id: randomUUID(),
        name: source.name,
        description: aiProject.text_override ?? source.description,
        tags: source.tags,
        url: source.url,
        relevance_score: aiProject.relevance_score,
        source_project_id: source.id,
      });
    }

    const profileSkillByNameLower = new Map(
      profile.skills.map((skill) => [skill.name.toLowerCase(), skill]),
    );
    const resolvedSkills = new Map<string, Skill>();
    for (const aiSkill of aiResult.skills) {
      const source = profileSkillByNameLower.get(aiSkill.name.toLowerCase());
      if (source) {
        resolvedSkills.set(source.name, source);
      }
    }

    if (experience.length === 0 && projects.length === 0) {
      throw new BadRequestException(
        'La IA no generó contenido válido a partir de tu perfil; intenta de nuevo',
      );
    }

    return {
      personal_info: profile.personal_info,
      summary_variant_used: aiResult.summary_variant_used,
      summary: aiResult.summary_text,
      skills: Array.from(resolvedSkills.values()),
      experience,
      projects,
      education: profile.education,
    };
  }

  private resolveBullet(
    aiBullet: TailorBulletDto,
    profileBulletIdsForThisRole: Set<string>,
    bulletById: Map<string, Bullet>,
    evidenceById: Map<string, SkillEvidenceItem>,
  ): TailoredBullet | null {
    const sourceBullet = aiBullet.source_bullet_id
      ? bulletById.get(aiBullet.source_bullet_id)
      : undefined;
    const sourceEvidence = aiBullet.source_evidence_id
      ? evidenceById.get(aiBullet.source_evidence_id)
      : undefined;

    if (!sourceBullet && !sourceEvidence) {
      this.logger.warn('Dropping bullet with no valid source reference');
      return null;
    }

    if (sourceBullet && !profileBulletIdsForThisRole.has(sourceBullet.id)) {
      this.logger.warn(
        `Dropping bullet: source_bullet_id ${sourceBullet.id} does not belong to this role`,
      );
      return null;
    }

    if (
      sourceEvidence &&
      sourceEvidence.confidence === EvidenceConfidence.LOW
    ) {
      this.logger.warn(
        `Dropping bullet sourced from low-confidence evidence ${sourceEvidence.id}`,
      );
      return null;
    }

    return {
      id: randomUUID(),
      text: aiBullet.text,
      tags: aiBullet.tags,
      relevance_score: aiBullet.relevance_score,
      source_bullet_id: sourceBullet?.id ?? null,
      source_evidence_id: sourceEvidence?.id ?? null,
      needs_review: false,
    };
  }
}
