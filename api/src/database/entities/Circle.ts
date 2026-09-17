import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { CircleOccasion, CirclePrivacy, CircleStatus } from '../enums';
import { CircleActivity } from './CircleActivity';
import { CircleUpdate } from './CircleUpdate';
import { Contribution } from './Contribution';
import { Fulfillment } from './Fulfillment';
import { GiftItem } from './GiftItem';
import { Invitation } from './Invitation';
import { User } from './User';

export interface DeliveryAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
  instructions?: string;
}

@Entity('circles')
@Index('IDX_circles_organizer_status', ['organizerId', 'status'])
@Index('IDX_circles_discovery', ['privacy', 'status', 'deadline'])
@Index('UQ_circles_publish_idempotency_key', ['publishIdempotencyKey'], {
  unique: true,
  where: '"publish_idempotency_key" IS NOT NULL',
})
export class Circle {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'organizer_id' }) organizerId: string;
  @Column({ unique: true, length: 160 }) slug: string;
  @Column({ length: 140 }) title: string;
  @Column({ type: 'enum', enum: CircleOccasion }) occasion: CircleOccasion;
  @Column({ type: 'text', nullable: true }) story: string | null;
  @Column({ name: 'recipient_name', length: 100 }) recipientName: string;
  @Column({
    name: 'recipient_relationship',
    type: 'varchar',
    length: 24,
    nullable: true,
  })
  recipientRelationship: string | null;
  @Column({
    name: 'recipient_city',
    type: 'varchar',
    length: 80,
    nullable: true,
  })
  recipientCity: string | null;
  @Column({
    name: 'recipient_country_code',
    type: 'varchar',
    length: 2,
    nullable: true,
  })
  recipientCountryCode: string | null;
  @Column({
    name: 'recipient_email',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  recipientEmail: string | null;
  @Column({
    name: 'recipient_phone',
    type: 'varchar',
    length: 30,
    nullable: true,
  })
  recipientPhone: string | null;
  @Column({ name: 'cover_image_url', type: 'text', nullable: true })
  coverImageUrl: string | null;
  @Column({
    name: 'cover_asset_id',
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  coverAssetId: string | null;
  @Column({ name: 'cover_alt', type: 'varchar', length: 255, nullable: true })
  coverAlt: string | null;
  @Column({
    type: 'enum',
    enum: CirclePrivacy,
    default: CirclePrivacy.LINK_ONLY,
  })
  privacy: CirclePrivacy;
  @Column({ type: 'enum', enum: CircleStatus, default: CircleStatus.DRAFT })
  status: CircleStatus;
  @Column({ name: 'target_amount', type: 'decimal', precision: 14, scale: 2 })
  targetAmount: string;
  @Column({
    name: 'amount_raised',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  amountRaised: string;
  @Column({ length: 3, default: 'NGN' }) currency: string;
  @Column({ name: 'funding_mode', type: 'varchar', length: 20, nullable: true })
  fundingMode: string | null;
  @Column({ name: 'flex_buffer_percent', type: 'int', default: 0 })
  flexBufferPercent: number;
  @Column({ type: 'timestamptz' }) deadline: Date;
  @Column({ name: 'delivery_address', type: 'jsonb', nullable: true })
  deliveryAddress: DeliveryAddress | null;
  @Column({
    name: 'delivery_collection_mode',
    type: 'varchar',
    length: 40,
    nullable: true,
  })
  deliveryCollectionMode: string | null;
  @Column({ name: 'allow_general_contributions', default: true })
  allowGeneralContributions: boolean;

  @Column({ name: 'supporter_count', type: 'int', default: 0 })
  supporterCount: number;
  @Column({
    name: 'publish_idempotency_key',
    type: 'varchar',
    length: 160,
    nullable: true,
  })
  publishIdempotencyKey: string | null;
  @VersionColumn({ default: 1 }) version: number;

  @Column({ name: 'is_hidden', default: false })
  isHidden: boolean;
  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt: Date | null;
  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;
  @Column({
    name: 'recipient_token_hash',
    type: 'text',
    nullable: true,
    select: false,
  })
  recipientTokenHash: string | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
  @ManyToOne(() => User, (user) => user.circles, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'organizer_id' })
  organizer: User;
  @OneToMany(() => GiftItem, (item) => item.circle, { cascade: true })
  items: GiftItem[];
  @OneToMany(() => Contribution, (contribution) => contribution.circle)
  contributions: Contribution[];
  @OneToMany(() => Invitation, (invitation) => invitation.circle, {
    cascade: true,
  })
  invitations: Invitation[];
  @OneToMany(() => CircleUpdate, (update) => update.circle, { cascade: true })
  updates: CircleUpdate[];
  @OneToMany(() => CircleActivity, (activity) => activity.circle, {
    cascade: true,
  })
  activities: CircleActivity[];
  @OneToOne(() => Fulfillment, (fulfillment) => fulfillment.circle, {
    cascade: true,
  })
  fulfillment: Fulfillment;
}
