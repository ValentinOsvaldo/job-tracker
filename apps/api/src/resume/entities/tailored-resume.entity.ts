import { ApiProperty } from '@nestjs/swagger';
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
import { User } from '../../users/entities/user.entity';
import { TailoredResumeContent } from '../types/tailored-resume-content.type';

@Entity('tailored_resumes')
@Unique(['user_id', 'job_id'])
export class TailoredResume {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ format: 'uuid' })
  @Column({ type: 'uuid' })
  job_id: string;

  @ManyToOne(() => Job, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job: Job;

  @ApiProperty({ format: 'uuid' })
  @Column({ type: 'uuid' })
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty()
  @Column({ type: 'jsonb' })
  generated_content: TailoredResumeContent;

  @ApiProperty({ type: String, format: 'date-time' })
  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
