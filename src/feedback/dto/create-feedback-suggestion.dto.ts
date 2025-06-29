import { ApiProperty } from '@nestjs/swagger';
import { SuggestionType, SuggestionSeverity } from '../../common/entities/feedback-suggestion.entity';

export class CreateFeedbackSuggestionDto {
  @ApiProperty({
    description: 'Type of the suggestion',
    enum: SuggestionType,
    example: SuggestionType.TONE,
  })
  type: SuggestionType;

  @ApiProperty({
    description: 'The suggestion message',
    example: 'Try to vary your tone more to keep the audience engaged.',
  })
  message: string;

  @ApiProperty({
    description: 'Severity level of the suggestion',
    enum: SuggestionSeverity,
    example: SuggestionSeverity.MEDIUM,
    default: SuggestionSeverity.MEDIUM,
  })
  severity: SuggestionSeverity = SuggestionSeverity.MEDIUM;

  @ApiProperty({
    description: 'Start time in seconds when this suggestion applies',
    required: false,
    example: 42.5,
  })
  startTime?: number;

  @ApiProperty({
    description: 'End time in seconds when this suggestion applies',
    required: false,
    example: 47.8,
  })
  endTime?: number;

  @ApiProperty({
    description: 'Optional metadata for the suggestion',
    required: false,
    example: { currentValue: 0.8, targetValue: 0.6 },
  })
  metadata?: Record<string, any>;
}
