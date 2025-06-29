import { ApiProperty } from '@nestjs/swagger';
import { SessionType, SourceType } from '../../common/entities/session.entity';

export class CreateSessionDto {
  @ApiProperty({
    description: 'Title of the session',
    example: 'My Presentation',
  })
  title: string;

  @ApiProperty({
    description: 'Type of the session',
    enum: SessionType,
    example: SessionType.LIVE,
  })
  type: SessionType;

  @ApiProperty({
    description: 'Source type of the audio/video',
    enum: SourceType,
    example: SourceType.MICROPHONE,
  })
  sourceType: SourceType;

  @ApiProperty({
    description: 'Language code for the session (e.g., en, hi, gu, pa)',
    example: 'en',
  })
  language: string;

  @ApiProperty({
    description: 'URL of the source file (for UPLOAD type)',
    required: false,
    example: 'https://example.com/audio.mp3',
  })
  sourceUrl?: string;
}
