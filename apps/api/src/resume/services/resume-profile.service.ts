import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpsertResumeProfileDto } from '../dto/resume-profile/upsert-resume-profile.dto';
import { ResumeProfile } from '../entities/resume-profile.entity';

@Injectable()
export class ResumeProfileService {
  constructor(
    @InjectRepository(ResumeProfile)
    private readonly resumeProfileRepository: Repository<ResumeProfile>,
  ) {}

  async findByUser(userId: string): Promise<ResumeProfile> {
    const profile = await this.resumeProfileRepository.findOne({
      where: { user_id: userId },
    });

    if (!profile) {
      throw new NotFoundException(
        'No resume profile found for this user. Create one first.',
      );
    }

    return profile;
  }

  async findByUserOrNull(userId: string): Promise<ResumeProfile | null> {
    return this.resumeProfileRepository.findOne({ where: { user_id: userId } });
  }

  async upsert(
    userId: string,
    dto: UpsertResumeProfileDto,
  ): Promise<ResumeProfile> {
    const existing = await this.findByUserOrNull(userId);

    const profile = this.resumeProfileRepository.create({
      id: existing?.id,
      user_id: userId,
      personal_info: dto.personal_info,
      summary: dto.summary,
      skills: dto.skills,
      experience: dto.experience,
      skill_evidence: dto.skill_evidence,
      projects: dto.projects,
      education: dto.education ?? null,
    });

    return this.resumeProfileRepository.save(profile);
  }
}
