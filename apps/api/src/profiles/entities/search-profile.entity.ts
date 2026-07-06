import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { JobAnalysis } from '../../job-analyses/entities/job-analysis.entity';
import { ProfileRole } from '../enums/profile-role.enum';

@Entity('search_profiles')
export class SearchProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @ManyToOne(() => User, (user) => user.search_profiles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'enum', enum: ProfileRole })
  role: ProfileRole;

  @Column({ type: 'text', array: true, default: [] })
  keywords: string[];

  @Column({ type: 'text', array: true, default: [] })
  locations: string[];

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @OneToMany(() => JobAnalysis, (analysis) => analysis.profile)
  analyses: JobAnalysis[];
}
