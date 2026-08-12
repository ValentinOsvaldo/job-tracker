import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { JobAnalysis } from '../../job-analyses/entities/job-analysis.entity';
import { JobSource } from '../enums/job-source.enum';
import { InterestStatus } from '../enums/interest-status.enum';
import { JobRelevance } from '../enums/job-relevance.enum';
import { JobRoleCategory } from '../enums/job-role-category.enum';
import { WorkMode } from '../enums/work-mode.enum';
import { WorkModeSource } from '../enums/work-mode-source.enum';

@Entity('jobs')
export class Job {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Senior Frontend Developer' })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiPropertyOptional({ nullable: true, example: 'Acme Corp' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  company: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'Remote' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string | null;

  @ApiProperty({ enum: WorkMode, example: WorkMode.REMOTE })
  @Column({
    type: 'enum',
    enum: WorkMode,
    default: WorkMode.UNKNOWN,
  })
  work_mode: WorkMode;

  @ApiPropertyOptional({
    enum: WorkModeSource,
    nullable: true,
    description: 'How work_mode was determined',
  })
  @Column({ type: 'enum', enum: WorkModeSource, nullable: true })
  work_mode_source: WorkModeSource | null;

  @ApiPropertyOptional({ nullable: true, example: 'Ciudad de México' })
  @Column({ type: 'varchar', length: 150, nullable: true })
  location_city: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'CDMX' })
  @Column({ type: 'varchar', length: 150, nullable: true })
  location_region: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'Mexico' })
  @Column({ type: 'varchar', length: 150, nullable: true })
  location_country: string | null;

  @ApiPropertyOptional({ nullable: true })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'AI-generated TLDR of the description',
  })
  @Column({ type: 'text', nullable: true })
  description_summary: string | null;

  @ApiProperty({ example: 'https://linkedin.com/jobs/view/123456' })
  @Column({ type: 'varchar', length: 500, unique: true })
  url: string;

  @ApiProperty({ enum: JobSource, example: JobSource.LINKEDIN })
  @Column({ type: 'enum', enum: JobSource })
  source: JobSource;

  @ApiPropertyOptional({ nullable: true, type: String, format: 'date' })
  @Column({ type: 'date', nullable: true })
  date_posted: Date | null;

  @ApiPropertyOptional({ nullable: true, example: 'fulltime' })
  @Column({ type: 'varchar', length: 50, nullable: true })
  job_type: string | null;

  @ApiProperty({
    enum: JobRoleCategory,
    example: JobRoleCategory.FULLSTACK,
    description:
      'Dev role inferred from title/description (frontend/backend/fullstack/mobile/other), for filtering and stats',
  })
  @Column({
    type: 'enum',
    enum: JobRoleCategory,
    default: JobRoleCategory.OTHER,
  })
  role_category: JobRoleCategory;

  @ApiProperty({
    type: [String],
    example: ['React', 'TypeScript', 'AWS'],
    description: 'Technology keywords detected in title/description',
  })
  @Column({ type: 'text', array: true, default: '{}' })
  tech_keywords: string[];

  @ApiPropertyOptional({ nullable: true, example: 110000 })
  @Column({ type: 'int', nullable: true })
  salary_min: number | null;

  @ApiPropertyOptional({ nullable: true, example: 135000 })
  @Column({ type: 'int', nullable: true })
  salary_max: number | null;

  @ApiPropertyOptional({ nullable: true, example: 'yearly' })
  @Column({ type: 'varchar', length: 20, nullable: true })
  salary_interval: string | null;

  @ApiProperty({
    enum: JobRelevance,
    example: JobRelevance.RELEVANT,
    description:
      'Whether this posting matches the kind of roles being searched for (AI-classified, on demand)',
  })
  @Column({
    type: 'enum',
    enum: JobRelevance,
    default: JobRelevance.UNKNOWN,
  })
  relevance: JobRelevance;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Short AI-written reason for the relevance classification',
  })
  @Column({ type: 'text', nullable: true })
  relevance_reason: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  @CreateDateColumn({ type: 'timestamptz' })
  scraped_at: Date;

  @ApiProperty({ type: () => [JobAnalysis] })
  @OneToMany(() => JobAnalysis, (analysis) => analysis.job)
  analyses: JobAnalysis[];

  /** Populated per-request for the authenticated user (not DB columns). */
  @ApiPropertyOptional({
    enum: InterestStatus,
    nullable: true,
    description: 'Current user like/dislike status for this job',
  })
  user_interest?: InterestStatus | null;

  @ApiPropertyOptional({
    description: 'Whether the current user applied to this job',
  })
  user_applied?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the current user was rejected from this job',
  })
  user_rejected?: boolean;
}
