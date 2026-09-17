import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Circle } from './Circle';
import { Contribution } from './Contribution';
import { Invitation } from './Invitation';
import { User } from './User';

@Entity('contribution_ledger_entries')
export class ContributionLedgerEntry {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'contribution_id', type: 'uuid', unique: true })
  contributionId: string;
  @Column({ name: 'circle_id', type: 'uuid' }) circleId: string;
  @Column({ type: 'decimal', precision: 14, scale: 2 }) amount: string;
  @Column({ length: 3 }) currency: string;
  @Column({ length: 16, default: 'credit' }) direction: string;
  @Column({ length: 24, default: 'posted' }) status: string;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
  @ManyToOne(() => Contribution, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'contribution_id' })
  contribution: Contribution;
  @ManyToOne(() => Circle, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'circle_id' })
  circle: Circle;
}

@Entity('circle_messages')
@Index('IDX_circle_messages_circle_created', ['circleId', 'createdAt'])
export class CircleMessage {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'circle_id', type: 'uuid' }) circleId: string;
  @Column({ name: 'contribution_id', type: 'uuid', nullable: true })
  contributionId: string | null;
  @Column({ length: 24, default: 'organizer_message' }) kind: string;
  @Column({ type: 'text' }) message: string;
  @Column({ name: 'reply_email', type: 'varchar', length: 255, nullable: true })
  replyEmail: string | null;
  @Column({ length: 24, default: 'queued' }) status: string;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
  @ManyToOne(() => Circle, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'circle_id' })
  circle: Circle;
  @ManyToOne(() => Contribution, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'contribution_id' })
  contribution: Contribution | null;
}

@Entity('circle_broadcasts')
export class CircleBroadcast {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'circle_id', type: 'uuid' }) circleId: string;
  @Column({ type: 'text' }) message: string;
  @Column({ type: 'jsonb' }) channels: Record<string, string>;
  @Column({ length: 24, default: 'queued' }) status: string;
  @Column({ name: 'recipient_count', type: 'int', default: 0 })
  recipientCount: number;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
  @ManyToOne(() => Circle, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'circle_id' })
  circle: Circle;
}

@Entity('purchase_orders')
export class PurchaseOrder {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'circle_id', type: 'uuid' }) circleId: string;
  @Column({ length: 24 }) type: string;
  @Column({ name: 'wishlist_item_ids', type: 'uuid', array: true })
  wishlistItemIds: string[];
  @Column({ length: 32, default: 'under_review' }) status: string;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
  @ManyToOne(() => Circle, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'circle_id' })
  circle: Circle;
}

@Entity('circle_memberships')
@Unique('UQ_circle_membership_user', ['circleId', 'userId'])
export class CircleMembership {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'circle_id', type: 'uuid' }) circleId: string;
  @Column({ name: 'user_id', type: 'uuid' }) userId: string;
  @Column({ name: 'invitation_id', type: 'uuid', nullable: true, unique: true })
  invitationId: string | null;
  @Column({ length: 24, default: 'contributor' }) role: string;
  @Column({ length: 24, default: 'active' }) status: string;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
  @ManyToOne(() => Circle, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'circle_id' })
  circle: Circle;
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
  @ManyToOne(() => Invitation, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'invitation_id' })
  invitation: Invitation | null;
}

@Entity('delivery_address_records')
export class DeliveryAddressRecord {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'circle_id', type: 'uuid', unique: true }) circleId: string;
  @Column({ name: 'encrypted_payload', type: 'text', select: false })
  encryptedPayload: string;
  @Column({ length: 24, default: 'saved' }) status: string;
  @Column({ name: 'confirmed_at', type: 'timestamptz', nullable: true })
  confirmedAt: Date | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
  @ManyToOne(() => Circle, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'circle_id' })
  circle: Circle;
}

@Entity('catalog_items')
@Index('IDX_catalog_items_search', ['name', 'city', 'currency'])
export class CatalogItem {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ length: 160 }) name: string;
  @Column({ type: 'text', nullable: true }) description: string | null;
  @Column({ name: 'merchant_name', length: 160 }) merchantName: string;
  @Column({ name: 'merchant_verified', default: true })
  merchantVerified: boolean;
  @Column({ name: 'price_amount', type: 'decimal', precision: 14, scale: 2 })
  priceAmount: string;
  @Column({ length: 3, default: 'NGN' }) currency: string;
  @Column({ type: 'varchar', length: 80, nullable: true }) city: string | null;
  @Column({ default: true }) available: boolean;
  @Column({
    name: 'delivery_estimate',
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  deliveryEstimate: string | null;
  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl: string | null;
  @Column({ name: 'product_url', type: 'text', nullable: true })
  productUrl: string | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
