import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CircleActivityType } from '../enums';
import { Circle } from './Circle';

@Entity('circle_activities')
@Index('IDX_activities_circle_created', ['circleId', 'createdAt'])
export class CircleActivity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'circle_id' }) circleId: string;
  @Column({ type: 'enum', enum: CircleActivityType }) type: CircleActivityType;
  @Column({ length: 255 }) description: string;
  @Column({ type: 'jsonb', nullable: true }) metadata: Record<
    string,
    unknown
  > | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
  @ManyToOne(() => Circle, (circle) => circle.activities, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'circle_id' })
  circle: Circle;
}
