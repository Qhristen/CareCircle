import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FulfillmentStatus } from '../enums';
import { Circle, DeliveryAddress } from './Circle';

@Entity('fulfillments')
export class Fulfillment {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'circle_id', unique: true }) circleId: string;
  @Column({
    type: 'enum',
    enum: FulfillmentStatus,
    default: FulfillmentStatus.PENDING,
  })
  status: FulfillmentStatus;
  @Column({ name: 'delivery_address', type: 'jsonb', nullable: true })
  deliveryAddress: DeliveryAddress | null;
  @Column({ name: 'address_status', length: 24, default: 'pending' })
  addressStatus: string;
  @Column({
    name: 'purchase_order_status',
    length: 32,
    default: 'not_requested',
  })
  purchaseOrderStatus: string;
  @Column({
    name: 'courier_name',
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  courierName: string | null;
  @Column({
    name: 'tracking_number',
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  trackingNumber: string | null;
  @Column({ name: 'tracking_url', type: 'text', nullable: true })
  trackingUrl: string | null;
  @Column({ name: 'proof_url', type: 'text', nullable: true })
  proofUrl: string | null;
  @Column({ type: 'text', nullable: true }) note: string | null;
  @Column({ name: 'dispatched_at', type: 'timestamptz', nullable: true })
  dispatchedAt: Date | null;
  @Column({ name: 'delivered_at', type: 'timestamptz', nullable: true })
  deliveredAt: Date | null;
  @Column({ name: 'confirmed_at', type: 'timestamptz', nullable: true })
  confirmedAt: Date | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
  @OneToOne(() => Circle, (circle) => circle.fulfillment, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'circle_id' })
  circle: Circle;
}
