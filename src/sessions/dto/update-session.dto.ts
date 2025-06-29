import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateSessionDto } from './create-session.dto';

export class UpdateSessionDto extends PartialType(CreateSessionDto) {
  @ApiProperty({
    description: 'New status of the session',
    enum: ['processing', 'completed', 'failed'],
    required: false,
  })
  status?: string;

  @ApiProperty({
    description: 'Duration of the session in seconds',
    required: false,
    example: 300,
  })
  durationSec?: number;
}
