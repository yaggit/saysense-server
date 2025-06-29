import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { SessionP } from './session.entity';

export enum MetricType {
  TONE = 'tone',
  CLARITY = 'clarity',
  ENERGY = 'energy',
  SENTIMENT = 'sentiment',
  PAUSE = 'pause',
  SPEED = 'speed',
}

@Entity('analysis_metrics')
export class AnalysisMetric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => SessionP, (session) => session.analysisMetrics, { onDelete: 'CASCADE' })
  session: SessionP;

  @Column({ type: 'float' })
  timestamp: number;

  @Column({
    type: 'enum',
    enum: MetricType,
  })
  metricType: MetricType;

  @Column('float')
  value: number;

  @Column({ nullable: true })
  label?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  constructor(partial: Partial<AnalysisMetric>) {
    Object.assign(this, partial);
  }
}
