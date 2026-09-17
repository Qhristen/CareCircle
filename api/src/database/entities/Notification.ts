import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { NotificationType } from '../enums';
import { User } from './User';

@Entity('notifications')
@Index('IDX_notifications_user_read', ['userId', 'readAt'])
export class Notification {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'user_id' }) userId: string;
  @Column({ type: 'enum', enum: NotificationType }) type: NotificationType;
  @Column({ length: 140 }) title: string;
  @Column({ type: 'text' }) message: string;
  @Column({ type: 'jsonb', nullable: true }) data: Record<
    string,
    unknown
  > | null;
  @Column({ name: 'read_at', type: 'timestamptz', nullable: true })
  readAt: Date | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
  @ManyToOne(() => User, (user) => user.notifications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
