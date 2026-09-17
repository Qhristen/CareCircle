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
import { InvitationStatus } from '../enums';
import { Circle } from './Circle';
import { User } from './User';

@Entity('invitations')
@Index('IDX_invitations_circle_status', ['circleId', 'status'])
@Index('IDX_invitations_token_hash', ['tokenHash'])
export class Invitation {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'circle_id' }) circleId: string;
  @Column({ type: 'varchar', length: 255, nullable: true }) email:
    string | null;
  @Column({ type: 'varchar', length: 30, nullable: true }) phone: string | null;
  @Column({ unique: true, length: 64 }) code: string;
  @Column({ name: 'token_hash', type: 'text', nullable: true, select: false })
  tokenHash: string | null;
  @Column({ name: 'batch_id', type: 'uuid', nullable: true })
  batchId: string | null;
  @Column({ type: 'varchar', length: 16, nullable: true }) channel:
    string | null;
  @Column({ type: 'text', nullable: true }) message: string | null;
  @Column({
    type: 'enum',
    enum: InvitationStatus,
    default: InvitationStatus.PENDING,
  })
  status: InvitationStatus;
  @Column({ name: 'accepted_by_id', type: 'uuid', nullable: true })
  acceptedById: string | null;
  @Column({ name: 'expires_at', type: 'timestamptz' }) expiresAt: Date;
  @Column({ name: 'accepted_at', type: 'timestamptz', nullable: true })
  acceptedAt: Date | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
  @ManyToOne(() => Circle, (circle) => circle.invitations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'circle_id' })
  circle: Circle;
  @ManyToOne(() => User, (user) => user.acceptedInvitations, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'accepted_by_id' })
  acceptedBy: User | null;
}
