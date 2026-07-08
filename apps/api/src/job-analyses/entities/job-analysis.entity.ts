import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
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
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ format: 'uuid' })
  @Column({ type: 'uuid' })
  job_id: string;

  @ApiHideProperty()
  @ManyToOne(() => Job, (job) => job.analyses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job: Job;

  @ApiProperty({ format: 'uuid' })
  @Column({ type: 'uuid' })
  profile_id: string;

  @ApiProperty({ type: () => SearchProfile })
  @ManyToOne(() => SearchProfile, (profile) => profile.analyses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'profile_id' })
  profile: SearchProfile;

  @ApiProperty({ example: 8.5, minimum: 0, maximum: 10 })
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

  @ApiProperty({ type: [String], example: ['react', 'typescript'] })
  @Column({ type: 'text', array: true, default: [] })
  matched_skills: string[];

  @ApiProperty({ type: [String], example: ['kubernetes'] })
  @Column({ type: 'text', array: true, default: [] })
  missing_skills: string[];

  @ApiProperty({
    example: 'Strong match for frontend role with React experience.',
  })
  @Column({ type: 'text' })
  summary: string;

  @ApiPropertyOptional({ nullable: true, example: 80000 })
  @Column({ type: 'int', nullable: true })
  salary_min: number | null;

  @ApiPropertyOptional({ nullable: true, example: 120000 })
  @Column({ type: 'int', nullable: true })
  salary_max: number | null;

  @ApiProperty({ example: false })
  @Column({ type: 'boolean', default: false })
  salary_is_inferred: boolean;

  @ApiProperty({ type: [String], example: ['health insurance', 'remote work'] })
  @Column({ type: 'text', array: true, default: [] })
  benefits: string[];

  @ApiProperty({ example: false })
  @Column({ type: 'boolean', default: false })
  benefits_is_inferred: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  @CreateDateColumn({ type: 'timestamptz' })
  analyzed_at: Date;
}
