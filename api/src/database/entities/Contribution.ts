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
import { ContributionStatus, PaymentProvider } from '../enums';
import { Circle } from './Circle';
import { GiftItem } from './GiftItem';
import { User } from './User';

@Entity('contributions')
@Index('IDX_contributions_circle_status', ['circleId', 'status'])
@Index('IDX_contributions_user_status', ['contributorId', 'status'])
@Index('UQ_contributions_idempotency_key', ['idempotencyKey'], {
  unique: true,
  where: '"idempotency_key" IS NOT NULL',
})
export class Contribution {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'circle_id' }) circleId: string;
  @Column({ name: 'contributor_id', type: 'uuid', nullable: true })
  contributorId: string | null;
  @Column({ name: 'gift_item_id', type: 'uuid', nullable: true })
  giftItemId: string | null;
  @Column({ name: 'guest_name', type: 'varchar', length: 100, nullable: true })
  guestName: string | null;
  @Column({ name: 'guest_email', type: 'varchar', length: 255, nullable: true })
  guestEmail: string | null;
  @Column({ name: 'guest_phone', type: 'varchar', length: 30, nullable: true })
  guestPhone: string | null;
  @Column({ type: 'decimal', precision: 14, scale: 2 }) amount: string;
  @Column({ length: 3, default: 'NGN' }) currency: string;
  @Column({
    type: 'enum',
    enum: PaymentProvider,
    default: PaymentProvider.PAYSTACK,
  })
  provider: PaymentProvider;
  @Column({ name: 'payment_reference', unique: true }) paymentReference: string;
  @Column({
    name: 'idempotency_key',
    type: 'varchar',
    length: 160,
    nullable: true,
  })
  idempotencyKey: string | null;
  @Column({ name: 'payment_method', length: 32, default: 'card' })
  paymentMethod: string;
  @Column({
    type: 'enum',
    enum: ContributionStatus,
    default: ContributionStatus.PENDING,
  })
  status: ContributionStatus;
  @Column({ type: 'text', nullable: true }) message: string | null;
  @Column({ name: 'show_name', default: true }) showName: boolean;
  @Column({ name: 'show_amount', default: true }) showAmount: boolean;
  @Column({ name: 'show_message', default: true }) showMessage: boolean;
  @Column({
    name: 'provider_payload',
    type: 'jsonb',
    nullable: true,
    select: false,
  })
  providerPayload: Record<string, unknown> | null;
  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt: Date | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
  @ManyToOne(() => Circle, (circle) => circle.contributions, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'circle_id' })
  circle: Circle;
  @ManyToOne(() => User, (user) => user.contributions, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'contributor_id' })
  contributor: User | null;
  @ManyToOne(() => GiftItem, (item) => item.contributions, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'gift_item_id' })
  giftItem: GiftItem | null;
}
