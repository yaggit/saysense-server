import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { TranscriptSegment } from './transcript-segment.entity';
import { AnalysisMetric } from './analysis-metric.entity';
import { FeedbackSuggestion } from './feedback-suggestion.entity';

export enum SessionType {
  LIVE = 'live',
  UPLOAD = 'upload',
}

export enum SourceType {
  MICROPHONE = 'microphone',
  FILE = 'file',
}

export enum SessionStatus {
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('sessionp')
export class SessionP {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.sessions, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  title: string;

  @Column({
    type: 'enum',
    enum: SessionType,
  })
  session_type: SessionType;

  @Column({
    name: 'source_type',
    type: 'enum',
    enum: SourceType,
  })
  sourceType: SourceType;

  @Column({ name: 'source_url', nullable: true })
  sourceUrl?: string;

  @Column()
  language: string;

  @Column({
    type: 'enum',
    enum: SessionStatus,
    default: SessionStatus.PROCESSING,
  })
  status: SessionStatus;

  @Column({ name: 'duration_sec', type: 'integer', default: 0 })
  durationSec: number;

  @Column({ name: 'completed_at', nullable: true })
  completedAt?: Date;

  @OneToMany(() => TranscriptSegment, (segment) => segment.session)
  transcriptSegments: TranscriptSegment[];

  @OneToMany(() => AnalysisMetric, (metric) => metric.session)
  analysisMetrics: AnalysisMetric[];

  @OneToMany(() => FeedbackSuggestion, (suggestion) => suggestion.session)
  feedbackSuggestions: FeedbackSuggestion[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  constructor(partial: Partial<SessionP>) {
    Object.assign(this, partial);
  }
}
