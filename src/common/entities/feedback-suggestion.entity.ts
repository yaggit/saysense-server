import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { SessionP } from './session.entity';

export enum SuggestionType {
  TONE = 'tone',
  PACING = 'pacing',
  CLARITY = 'clarity',
  VOCABULARY = 'vocabulary',
  PAUSE = 'pause',
  EMPHASIS = 'emphasis',
}

export enum SuggestionSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

@Entity('feedback_suggestions')
export class FeedbackSuggestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => SessionP, (session) => session.feedbackSuggestions, { onDelete: 'CASCADE' })
  session: SessionP;

  @Column({
    type: 'enum',
    enum: SuggestionType,
  })
  type: SuggestionType;

  @Column('text')
  message: string;

  @Column({
    type: 'enum',
    enum: SuggestionSeverity,
    default: SuggestionSeverity.MEDIUM,
  })
  severity: SuggestionSeverity;

  @Column({ name: 'start_time', type: 'float', nullable: true })
  startTime?: number;

  @Column({ name: 'end_time', type: 'float', nullable: true })
  endTime?: number;

  @Column({ name: 'is_applied', default: false })
  isApplied: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  constructor(partial: Partial<FeedbackSuggestion>) {
    Object.assign(this, partial);
  }
}
