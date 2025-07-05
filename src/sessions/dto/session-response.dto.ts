import { ApiProperty } from '@nestjs/swagger';
import {
  SessionP,
  SessionStatus,
  SessionType,
  SourceType,
} from '../../common/entities/session.entity';
import {
  AnalysisMetric,
  AnalysisMetricType,
} from 'src/common/entities/analysis-metric.entity';

export class SessionResponseDto {
  @ApiProperty({ description: 'Unique identifier of the session' })
  id: string;

  @ApiProperty({ description: 'Title of the session' })
  title: string;

  @ApiProperty({
    enum: SessionType,
    enumName: 'SessionType',
    description: 'Type of the session',
    example: SessionType.UPLOAD,
  })
  session_type: SessionType;

  @ApiProperty({
    enum: SourceType,
    enumName: 'SourceType',
    description: 'Source type of the session',
    example: SourceType.FILE,
  })
  sourceType: SourceType;

  @ApiProperty({
    required: false,
    description: 'URL of the source file',
    example: 'https://example.com/recording.mp3',
  })
  sourceUrl?: string;

  @ApiProperty({
    description: 'Language code of the session',
    example: 'en-US',
  })
  language: string;

  @ApiProperty({
    enum: SessionStatus,
    enumName: 'SessionStatus',
    description: 'Status of the session',
    example: SessionStatus.PROCESSING,
  })
  status: SessionStatus;

  @ApiProperty({
    description: 'Duration of the session in seconds',
    example: 120,
    minimum: 0,
  })
  durationSec: number;

  @ApiProperty({
    description: 'Timestamp when the session was created',
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    required: false,
    description: 'Timestamp when the session was completed',
    example: '2023-01-01T00:02:00.000Z',
  })
  completedAt?: Date;

  constructor(session: SessionP) {
    this.id = session.id;
    this.title = session.title;
    this.session_type = session.session_type;
    this.sourceType = session.sourceType;
    this.sourceUrl = session.sourceUrl;
    this.language = session.language;
    this.status = session.status;
    this.durationSec = session.durationSec;
    this.createdAt = session.createdAt;
    this.completedAt = session.completedAt;
  }
}

export class SessionWithMetricResponseDto {
  id: string;
  name: string;
  date: Date;
  duration: number;
  sentiment: number;
  tags: string[];
  participants: { id: string; name: string; role: string }[];
  summary: string;
  transcript: any[];
  completedAt?: Date;

  constructor(session: SessionP) {
    this.id = session.id;
    this.name = session.title;
    this.date = session.createdAt;
    this.duration = session.durationSec;
    this.completedAt = session.completedAt;

    // Example sentiment: average from analysisMetrics
    const tones =
      session.analysisMetrics?.filter(
        (m) => m.metricType === AnalysisMetricType.TONE,
      ) ?? [];
    const avgSentiment = tones.length
      ? tones.reduce((sum, m) => sum + m.value, 0) / tones.length
      : 0;
    this.sentiment = parseFloat(avgSentiment.toFixed(1));

    this.participants =
      session.participants?.map((p) => ({
        id: p.id,
        name: p.name,
        role: p.role,
      })) ?? [];

    this.tags = session.tags ?? [];
    this.summary = session.summary ?? '';

    // Map transcriptSegments to frontend format
    this.transcript =
      session.transcriptSegments?.map((segment) => {
        return {
          id: segment.id,
          speaker: {
            id: '1', // if you don’t have speaker entity, use default or parse from label
            name: segment.speakerLabel,
          },
          text: segment.transcript,
          timestamp: this.computeTimestamp(
            session.completedAt,
            segment.startTime,
          ),
          sentiment: this.findSentimentForTimestamp(tones, segment.startTime),
          confidence: 0.9, // You can store this in TranscriptSegmentEntity if needed
          highlights: [], // compute or store separately if needed
        };
      }) ?? [];
  }

  private computeTimestamp(
    baseDate: Date | undefined,
    offsetSeconds: number,
  ): string {
    if (!baseDate) return new Date().toISOString();
    const ts = new Date(baseDate.getTime() + offsetSeconds * 1000);
    return ts.toISOString();
  }

  private findSentimentForTimestamp(
    tones: AnalysisMetric[],
    startTime: number,
  ): number {
    const nearby = tones.find((t) => Math.abs(t.timestamp - startTime) < 1.5);
    return nearby ? parseFloat(nearby.value.toFixed(1)) : 3.5; // fallback neutral
  }
}
