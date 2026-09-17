import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { GiftItemStatus } from '../enums';
import { Circle } from './Circle';
import { Category } from './Category';
import { Contribution } from './Contribution';

@Entity('gift_items')
@Index('IDX_gift_items_circle_status', ['circleId', 'status'])
export class GiftItem {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'circle_id' }) circleId: string;
  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId: string | null;
  @Column({ length: 120 }) name: string;
  @Column({ type: 'varchar', length: 32, nullable: true }) emoji: string | null;
  @Column({
    name: 'category_label',
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  categoryLabel: string | null;
  @Column({
    name: 'client_reference',
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  clientReference: string | null;
  @Column({ type: 'text', nullable: true }) description: string | null;
  @Column({ type: 'int', default: 1 }) quantity: number;
  @Column({ name: 'target_amount', type: 'decimal', precision: 14, scale: 2 })
  targetAmount: string;
  @Column({
    name: 'funded_amount',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  fundedAmount: string;
  @Column({ name: 'product_url', type: 'text', nullable: true })
  productUrl: string | null;
  @Column({
    type: 'enum',
    enum: GiftItemStatus,
    default: GiftItemStatus.ACTIVE,
  })
  status: GiftItemStatus;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
  @ManyToOne(() => Circle, (circle) => circle.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'circle_id' })
  circle: Circle;
  @ManyToOne(() => Category, (category) => category.giftItems, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'category_id' })
  category: Category | null;
  @OneToMany(() => Contribution, (contribution) => contribution.giftItem)
  contributions: Contribution[];
}
