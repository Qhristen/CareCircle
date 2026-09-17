import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { GiftItem } from './GiftItem';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true, length: 100 }) name: string;
  @Column({ unique: true, length: 120 }) slug: string;
  @Column({ type: 'text', nullable: true }) description: string | null;
  @Column({ name: 'icon_url', type: 'text', nullable: true }) iconUrl:
    string | null;
  @Column({ name: 'sort_order', type: 'int', default: 0 }) sortOrder: number;
  @Column({ name: 'is_active', default: true }) isActive: boolean;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
  @OneToMany(() => GiftItem, (item) => item.category) giftItems: GiftItem[];
}
