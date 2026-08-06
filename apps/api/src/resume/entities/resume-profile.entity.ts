import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import {
  Education,
  ExperienceEntry,
  PersonalInfo,
  Project,
  Skill,
  SkillEvidenceItem,
  SummaryVariants,
} from '../types/resume-profile.types';

@Entity('resume_profiles')
export class ResumeProfile {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ format: 'uuid' })
  @Column({ type: 'uuid', unique: true })
  user_id: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty()
  @Column({ type: 'jsonb' })
  personal_info: PersonalInfo;

  @ApiProperty()
  @Column({ type: 'jsonb' })
  summary: SummaryVariants;

  @ApiProperty({ type: [Object] })
  @Column({ type: 'jsonb' })
  skills: Skill[];

  @ApiProperty({ type: [Object] })
  @Column({ type: 'jsonb' })
  experience: ExperienceEntry[];

  @ApiProperty({ type: [Object] })
  @Column({ type: 'jsonb' })
  skill_evidence: SkillEvidenceItem[];

  @ApiProperty({ type: [Object] })
  @Column({ type: 'jsonb' })
  projects: Project[];

  @ApiPropertyOptional({ type: [Object], nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  education: Education[] | null;

  @ApiProperty({ type: String, format: 'date-time' })
  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
