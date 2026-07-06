import { ApiHideProperty, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { JobAnalysis } from '../../job-analyses/entities/job-analysis.entity';
import { JobSource } from '../enums/job-source.enum';

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

  @ApiProperty({ type: String, format: 'date-time' })
  @CreateDateColumn({ type: 'timestamptz' })
  scraped_at: Date;

  @ApiHideProperty()
  @OneToMany(() => JobAnalysis, (analysis) => analysis.job)
  analyses: JobAnalysis[];
}
