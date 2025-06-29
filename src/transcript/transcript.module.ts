import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TranscriptService } from './transcript.service';
import { TranscriptController } from './transcript.controller';
import { TranscriptSegment } from '../common/entities/transcript-segment.entity';
import { SessionP } from '../common/entities/session.entity';
import { SessionsModule } from '../sessions/sessions.module';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TranscriptSegment, SessionP]),
    SessionsModule,
    WebsocketModule,
  ],
  controllers: [TranscriptController],
  providers: [TranscriptService],
  exports: [TranscriptService],
})
export class TranscriptModule {}
