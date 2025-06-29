import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FeedbackService } from './feedback.service';
import { FeedbackController } from './feedback.controller';
import { FeedbackSuggestion } from '../common/entities/feedback-suggestion.entity';
import { SessionP } from '../common/entities/session.entity';
import { User } from '../common/entities/user.entity';
import { SessionsModule } from '../sessions/sessions.module';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FeedbackSuggestion, SessionP, User]),
    SessionsModule,
    WebsocketModule,
  ],
  controllers: [FeedbackController],
  providers: [FeedbackService],
  exports: [FeedbackService],
})
export class FeedbackModule {}
