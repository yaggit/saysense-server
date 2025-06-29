import { ApiProperty } from '@nestjs/swagger';

export class TranscriptSegmentResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the transcript segment',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'The ID of the session this transcript segment belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  sessionId: string;

  @ApiProperty({
    description: 'The speaker identifier',
    example: 'speaker_1',
  })
  speaker: string;

  @ApiProperty({
    description: 'The transcribed text content',
    example: 'Hello, how are you today?',
  })
  text: string;

  @ApiProperty({
    description: 'Start time of the segment in milliseconds',
    example: 1000,
  })
  startTime: number;

  @ApiProperty({
    description: 'End time of the segment in milliseconds',
    example: 2500,
  })
  endTime: number;

  @ApiProperty({
    description: 'Confidence score of the transcription (0-1)',
    example: 0.95,
  })
  confidence: number;

  @ApiProperty({
    description: 'Additional metadata for the segment',
    example: { isFinal: true, language: 'en-US' },
  })
  metadata: Record<string, any>;

  @ApiProperty({
    description: 'Timestamp when the segment was created',
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the segment was last updated',
    example: '2023-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}
