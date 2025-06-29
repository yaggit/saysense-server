import { ApiProperty } from '@nestjs/swagger';
import { SessionP, SessionStatus, SessionType, SourceType } from '../../common/entities/session.entity';

export class SessionResponseDto {
  @ApiProperty({ description: 'Unique identifier of the session' })
  id: string;

  @ApiProperty({ description: 'Title of the session' })
  title: string;

  @ApiProperty({ 
    enum: SessionType, 
    enumName: 'SessionType',
    description: 'Type of the session',
    example: SessionType.UPLOAD
  })
  session_type: SessionType;

  @ApiProperty({ 
    enum: SourceType, 
    enumName: 'SourceType',
    description: 'Source type of the session',
    example: SourceType.FILE
  })
  sourceType: SourceType;

  @ApiProperty({ 
    required: false, 
    description: 'URL of the source file',
    example: 'https://example.com/recording.mp3'
  })
  sourceUrl?: string;

  @ApiProperty({ 
    description: 'Language code of the session',
    example: 'en-US'
  })
  language: string;

  @ApiProperty({ 
    enum: SessionStatus, 
    enumName: 'SessionStatus',
    description: 'Status of the session',
    example: SessionStatus.PROCESSING
  })
  status: SessionStatus;

  @ApiProperty({ 
    description: 'Duration of the session in seconds',
    example: 120,
    minimum: 0
  })
  durationSec: number;

  @ApiProperty({ 
    description: 'Timestamp when the session was created',
    example: '2023-01-01T00:00:00.000Z'
  })
  createdAt: Date;

  @ApiProperty({ 
    required: false, 
    description: 'Timestamp when the session was completed',
    example: '2023-01-01T00:02:00.000Z'
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
