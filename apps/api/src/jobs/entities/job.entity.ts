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
import { JobInterestStatus } from '../enums/job-interest-status.enum';

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

  @ApiPropertyOptional({ nullable: true })
  @Column({ type: 'text', nullable: true })
  description: string | null;

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

  @ApiPropertyOptional({ nullable: true, example: 110000 })
  @Column({ type: 'int', nullable: true })
  salary_min: number | null;

  @ApiPropertyOptional({ nullable: true, example: 135000 })
  @Column({ type: 'int', nullable: true })
  salary_max: number | null;

  @ApiPropertyOptional({ nullable: true, example: 'yearly' })
  @Column({ type: 'varchar', length: 20, nullable: true })
  salary_interval: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  @CreateDateColumn({ type: 'timestamptz' })
  scraped_at: Date;

  @ApiProperty({ type: () => [JobAnalysis] })
  @OneToMany(() => JobAnalysis, (analysis) => analysis.job)
  analyses: JobAnalysis[];

  /** Populated per-request for the authenticated user (not a DB column). */
  @ApiPropertyOptional({
    enum: JobInterestStatus,
    nullable: true,
    description: 'Current user interest/application status for this job',
  })
  user_status?: JobInterestStatus | null;
}
