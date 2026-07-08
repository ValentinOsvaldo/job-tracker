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
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { JobAnalysis } from '../../job-analyses/entities/job-analysis.entity';
import { ProfileRole } from '../enums/profile-role.enum';

@Entity('search_profiles')
export class SearchProfile {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ format: 'uuid' })
  @Column({ type: 'uuid' })
  user_id: string;

  @ApiHideProperty()
  @ManyToOne(() => User, (user) => user.search_profiles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({ example: 'Frontend Remote MX' })
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ApiProperty({ enum: ProfileRole, example: ProfileRole.FRONTEND })
  @Column({ type: 'enum', enum: ProfileRole })
  role: ProfileRole;

  @ApiProperty({ type: [String], example: ['react', 'typescript'] })
  @Column({ type: 'text', array: true, default: [] })
  keywords: string[];

  @ApiProperty({ type: [String], example: ['Mexico', 'Remote'] })
  @Column({ type: 'text', array: true, default: [] })
  locations: string[];

  @ApiProperty({ example: true })
  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @ApiHideProperty()
  @OneToMany(() => JobAnalysis, (analysis) => analysis.profile)
  analyses: JobAnalysis[];
}
