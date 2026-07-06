import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobAnalysesService } from '../job-analyses/job-analyses.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SearchProfile } from './entities/search-profile.entity';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(SearchProfile)
    private readonly profilesRepository: Repository<SearchProfile>,
    private readonly jobAnalysesService: JobAnalysesService,
  ) {}

  findAllByUserId(userId: string): Promise<SearchProfile[]> {
    return this.profilesRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  async findOneByUserId(
    userId: string,
    profileId: string,
  ): Promise<SearchProfile> {
    const profile = await this.profilesRepository.findOne({
      where: { id: profileId, user_id: userId },
    });

    if (!profile) {
      throw new NotFoundException(`Profile with id ${profileId} not found`);
    }

    return profile;
  }

  async create(userId: string, dto: CreateProfileDto): Promise<SearchProfile> {
    const profile = await this.profilesRepository.save({
      user_id: userId,
      name: dto.name,
      role: dto.role,
      keywords: dto.keywords,
      locations: dto.locations,
      is_active: dto.is_active ?? true,
    });

    if (profile.is_active) {
      this.jobAnalysesService.queueAnalysesForProfile(profile.id);
    }

    return profile;
  }

  async update(
    userId: string,
    profileId: string,
    dto: UpdateProfileDto,
  ): Promise<SearchProfile> {
    const profile = await this.findOneByUserId(userId, profileId);
    const wasInactive = !profile.is_active;

    Object.assign(profile, dto);
    const updated = await this.profilesRepository.save(profile);

    if (wasInactive && updated.is_active) {
      this.jobAnalysesService.queueAnalysesForProfile(updated.id);
    }

    return updated;
  }

  async remove(userId: string, profileId: string): Promise<void> {
    const profile = await this.findOneByUserId(userId, profileId);
    await this.profilesRepository.remove(profile);
  }

  async assertOwnership(userId: string, profileId: string): Promise<void> {
    const profile = await this.profilesRepository.findOne({
      where: { id: profileId },
      select: { id: true, user_id: true },
    });

    if (!profile) {
      throw new NotFoundException(`Profile with id ${profileId} not found`);
    }

    if (profile.user_id !== userId) {
      throw new ForbiddenException('You do not have access to this profile');
    }
  }
}
