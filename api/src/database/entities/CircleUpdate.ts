import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Circle } from './Circle';
import { User } from './User';

@Entity('circle_updates')
export class CircleUpdate {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'circle_id' }) circleId: string;
  @Column({ name: 'author_id' }) authorId: string;
  @Column({ length: 140 }) title: string;
  @Column({ type: 'text' }) message: string;
  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl: string | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
  @ManyToOne(() => Circle, (circle) => circle.updates, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'circle_id' })
  circle: Circle;
  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'author_id' })
  author: User;
}
