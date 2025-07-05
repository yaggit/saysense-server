import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';
import { SessionP } from '../common/entities/session.entity';
import { User } from '../common/entities/user.entity';
import { TranscriptSegmentEntity } from '../common/entities/transcript-segment.entity';
import { AnalysisMetric } from '../common/entities/analysis-metric.entity';
import { FeedbackSuggestion } from '../common/entities/feedback-suggestion.entity';
import { AuthModule } from '../auth/auth.module';
import { WebSocketModule } from '../websocket/websocket.module';
import { AwsCloudModule } from 'src/aws-cloud/aws-cloud.module';
import { Participants } from '../common/entities/participants.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SessionP,
      User,
      TranscriptSegmentEntity,
      AnalysisMetric,
      FeedbackSuggestion,
      Participants,
    ]),
    AuthModule,
    AwsCloudModule,
    WebSocketModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', '1h'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [SessionsController],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
