import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  ModerationReason,
  ModerationStatus,
  ModerationTargetType,
} from '../enums';
import { User } from './User';

@Entity('moderation_reports')
@Index('IDX_moderation_status_created', ['status', 'createdAt'])
@Index('IDX_moderation_target', ['targetType', 'targetId'])
export class ModerationReport {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'reporter_id' }) reporterId: string;
  @Column({ name: 'target_type', type: 'enum', enum: ModerationTargetType })
  targetType: ModerationTargetType;
  @Column({ name: 'target_id', type: 'uuid' }) targetId: string;
  @Column({ type: 'enum', enum: ModerationReason }) reason: ModerationReason;
  @Column({ type: 'text', nullable: true }) details: string | null;
  @Column({
    type: 'enum',
    enum: ModerationStatus,
    default: ModerationStatus.OPEN,
  })
  status: ModerationStatus;
  @Column({ name: 'reviewed_by_id', type: 'uuid', nullable: true })
  reviewedById: string | null;
  @Column({ name: 'resolution_note', type: 'text', nullable: true })
  resolutionNote: string | null;
  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt: Date | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reporter_id' })
  reporter: User;
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reviewed_by_id' })
  reviewedBy: User | null;
}
