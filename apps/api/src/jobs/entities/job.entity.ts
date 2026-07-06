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
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  company: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 500, unique: true })
  url: string;

  @Column({ type: 'enum', enum: JobSource })
  source: JobSource;

  @Column({ type: 'date', nullable: true })
  date_posted: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  scraped_at: Date;

  @OneToMany(() => JobAnalysis, (analysis) => analysis.job)
  analyses: JobAnalysis[];
}
