import { ApiHideProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('refresh_tokens')
export class RefreshToken {
  @ApiHideProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiHideProperty()
  @Column({ type: 'uuid' })
  user_id: string;

  @ApiHideProperty()
  @ManyToOne(() => User, (user) => user.refresh_tokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiHideProperty()
  @Column({ type: 'varchar', length: 255 })
  token_hash: string;

  @ApiHideProperty()
  @Column({ type: 'timestamptz' })
  expires_at: Date;

  @ApiHideProperty()
  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
