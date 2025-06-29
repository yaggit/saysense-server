import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { SessionP } from './session.entity';

@Entity('transcript_segments')
export class TranscriptSegment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => SessionP, (session) => session.transcriptSegments, { onDelete: 'CASCADE' })
  session: SessionP;

  @Column({ name: 'start_time', type: 'float' })
  startTime: number;

  @Column({ name: 'end_time', type: 'float' })
  endTime: number;

  @Column({ name: 'speaker_label' })
  speakerLabel: string;

  @Column('text')
  transcript: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  constructor(partial: Partial<TranscriptSegment>) {
    Object.assign(this, partial);
  }
}
