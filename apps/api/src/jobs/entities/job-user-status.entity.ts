import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { JobInterestStatus } from '../enums/job-interest-status.enum';
import { Job } from './job.entity';

@Entity('job_user_statuses')
@Unique(['user_id', 'job_id'])
@Index(['user_id', 'status'])
export class JobUserStatus {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ format: 'uuid' })
  @Column({ type: 'uuid' })
  user_id: string;

  @ApiProperty({ format: 'uuid' })
  @Column({ type: 'uuid' })
  job_id: string;

  @ApiProperty({ enum: JobInterestStatus })
  @Column({ type: 'enum', enum: JobInterestStatus })
  status: JobInterestStatus;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Job, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job: Job;

  @ApiProperty({ type: String, format: 'date-time' })
  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
