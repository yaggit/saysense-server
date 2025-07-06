import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { TranscriptSegmentEntity } from './transcript-segment.entity';
import { AnalysisMetric } from './analysis-metric.entity';
import { FeedbackSuggestion } from './feedback-suggestion.entity';
import { Participants } from './participants.entity';

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
  source_url?: string;

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

  @OneToMany(() => TranscriptSegmentEntity, (segment) => segment.session)
  transcriptSegments: TranscriptSegmentEntity[];

  @OneToMany(() => AnalysisMetric, (metric) => metric.session)
  analysisMetrics: AnalysisMetric[];

  @OneToMany(() => FeedbackSuggestion, (suggestion) => suggestion.session)
  feedbackSuggestions: FeedbackSuggestion[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column('text', { array: true, nullable: true })
  tags?: string[];

  @OneToMany(() => Participants, (participant) => participant.session, {
    cascade: true,
  })
  participants: Participants[];

  @Column('text', { nullable: true })
  summary?: string;

  @Column({ type: 'float', nullable: true })
  sentiment?: number;

  @Column({ name: 'deletedAt', nullable: true })
  deletedAt?: Date;

  constructor(partial: Partial<SessionP>) {
    Object.assign(this, partial);
  }
}
