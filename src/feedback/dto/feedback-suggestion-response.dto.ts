import { ApiProperty } from '@nestjs/swagger';
import { FeedbackSuggestion, SuggestionSeverity, SuggestionType } from '../../common/entities/feedback-suggestion.entity';
import { SessionP } from '../../common/entities/session.entity';

export class FeedbackSuggestionResponseDto {
  @ApiProperty({ description: 'Unique identifier for the suggestion' })
  id: string;

  @ApiProperty({ 
    description: 'Type of suggestion',
    enum: Object.values(SuggestionType),
    example: SuggestionType.TONE,
  })
  type: SuggestionType;

  @ApiProperty({ description: 'The suggestion message', example: 'Try to pronounce this word more clearly' })
  message: string;

  @ApiProperty({ 
    description: 'Severity of the suggestion',
    enum: Object.values(SuggestionSeverity),
    example: SuggestionSeverity.MEDIUM,
  })
  severity: SuggestionSeverity;

  @ApiProperty({ 
    description: 'Start time of the suggestion in the audio (seconds)',
    example: 12.5,
    required: false,
  })
  startTime?: number;

  @ApiProperty({ 
    description: 'End time of the suggestion in the audio (seconds)',
    example: 14.2,
    required: false,
  })
  endTime?: number;

  @ApiProperty({ 
    description: 'Whether the suggestion has been applied',
    default: false,
  })
  isApplied: boolean;

  @ApiProperty({ 
    description: 'ID of the session this suggestion belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  sessionId: string;

  @ApiProperty({ 
    description: 'Date and time when the suggestion was created',
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({ 
    description: 'Date and time when the suggestion was last updated',
    example: '2023-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    required: false,
    description: 'Timestamp when the suggestion was marked as resolved',
  })
  resolvedAt?: Date;

  @ApiProperty({ default: false, description: 'Whether the suggestion has been resolved' })
  isResolved: boolean;

  @ApiProperty({ 
    description: 'Whether this is a deletion event',
    required: false,
    default: false,
  })
  deleted?: boolean;

  constructor(suggestion: Partial<FeedbackSuggestion & { deleted?: boolean; session?: SessionP }> = {}) {
    this.id = suggestion.id || '';
    this.type = suggestion.type || SuggestionType.TONE;
    this.message = suggestion.message || '';
    this.severity = suggestion.severity || SuggestionSeverity.MEDIUM;
    this.startTime = suggestion.startTime;
    this.endTime = suggestion.endTime;
    this.isApplied = suggestion.isApplied || false;
    this.sessionId = suggestion.session?.id || '';
    this.createdAt = suggestion.createdAt || new Date();
    this.deleted = suggestion.deleted || false;
  }
}
