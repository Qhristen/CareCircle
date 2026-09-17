import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from '../enums';
import { Circle } from './Circle';
import { Contribution } from './Contribution';
import { Invitation } from './Invitation';
import { Notification } from './Notification';
import { Token } from './Token';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ length: 100 }) name: string;
  @Column({ length: 255, unique: true }) email: string;
  @Column({
    name: 'password_hash',
    type: 'varchar',
    length: 255,
    nullable: true,
    select: false,
  })
  passwordHash: string | null;
  @Column({
    name: 'google_id',
    type: 'varchar',
    length: 255,
    nullable: true,
    unique: true,
  })
  googleId: string | null;
  @Column({ name: 'avatar_url', type: 'text', nullable: true }) avatarUrl:
    string | null;
  @Column({ type: 'varchar', length: 30, nullable: true }) phone: string | null;
  @Column({ default: 'Nigeria' }) country: string;
  @Column({ length: 3, default: 'NGN' }) currency: string;
  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;
  @Column({ name: 'is_suspended', default: false }) isSuspended: boolean;
  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
  @OneToMany(() => Token, (token) => token.user) tokens: Token[];
  @OneToMany(() => Circle, (circle) => circle.organizer) circles: Circle[];
  @OneToMany(() => Contribution, (contribution) => contribution.contributor)
  contributions: Contribution[];
  @OneToMany(() => Invitation, (invitation) => invitation.acceptedBy)
  acceptedInvitations: Invitation[];
  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];
}
