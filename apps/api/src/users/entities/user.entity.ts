import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RefreshToken } from './refresh-token.entity';
import { SearchProfile } from '../../profiles/entities/search-profile.entity';

@Entity('users')
export class User {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Osvaldo', maxLength: 100 })
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ApiProperty({ example: 'osvaldo@example.com', maxLength: 150 })
  @Column({ type: 'varchar', length: 150, unique: true })
  email: string;

  @ApiHideProperty()
  @Column({ type: 'varchar', length: 255 })
  password: string;

  @ApiPropertyOptional({ nullable: true })
  @Column({ type: 'text', nullable: true })
  cv_text: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'resume.pdf' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  cv_filename: string | null;

  @ApiPropertyOptional({ nullable: true, type: String, format: 'date-time' })
  @Column({ type: 'timestamptz', nullable: true })
  cv_uploaded_at: Date | null;

  @ApiProperty({ type: String, format: 'date-time' })
  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @ApiHideProperty()
  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user)
  refresh_tokens: RefreshToken[];

  @ApiHideProperty()
  @OneToMany(() => SearchProfile, (profile) => profile.user)
  search_profiles: SearchProfile[];
}
