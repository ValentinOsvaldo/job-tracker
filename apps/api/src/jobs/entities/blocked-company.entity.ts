import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/** Manually-curated list of companies to exclude from ingest and listings
 * (junk/spam postings, or companies the user no longer wants to see after
 * repeated rejections). Deliberately not env-based so it can be managed
 * from the UI without a redeploy. */
@Entity('blocked_companies')
export class BlockedCompany {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'BairesDev' })
  @Column({ type: 'varchar', length: 255 })
  company: string;

  @ApiProperty({ example: 'bairesdev' })
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  company_normalized: string;

  @ApiPropertyOptional({ nullable: true, example: 'Rejected 3 times' })
  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
