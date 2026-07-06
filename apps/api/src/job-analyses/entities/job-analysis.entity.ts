import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Job } from '../../jobs/entities/job.entity';
import { SearchProfile } from '../../profiles/entities/search-profile.entity';

@Entity('job_analyses')
@Unique(['job_id', 'profile_id'])
export class JobAnalysis {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  job_id: string;

  @ManyToOne(() => Job, (job) => job.analyses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job: Job;

  @Column({ type: 'uuid' })
  profile_id: string;

  @ManyToOne(() => SearchProfile, (profile) => profile.analyses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'profile_id' })
  profile: SearchProfile;

  @Column({
    type: 'decimal',
    precision: 3,
    scale: 1,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  fit_score: number;

  @Column({ type: 'text', array: true, default: [] })
  matched_skills: string[];

  @Column({ type: 'text', array: true, default: [] })
  missing_skills: string[];

  @Column({ type: 'text' })
  summary: string;

  @Column({ type: 'int', nullable: true })
  salary_min: number | null;

  @Column({ type: 'int', nullable: true })
  salary_max: number | null;

  @Column({ type: 'boolean', default: false })
  salary_is_inferred: boolean;

  @Column({ type: 'text', array: true, default: [] })
  benefits: string[];

  @Column({ type: 'boolean', default: false })
  benefits_is_inferred: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  analyzed_at: Date;
}
