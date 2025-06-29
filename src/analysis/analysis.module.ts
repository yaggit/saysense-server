import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { AnalysisService } from './analysis.service';
import { AnalysisController } from './analysis.controller';
import { AnalysisMetric } from '../common/entities/analysis-metric.entity';
import { SessionP } from '../common/entities/session.entity';
import { User } from '../common/entities/user.entity';
import { SessionsModule } from '../sessions/sessions.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AnalysisMetric, SessionP, User]),
    SessionsModule,
    WebSocketModule,
    ConfigModule,
  ],
  controllers: [AnalysisController],
  providers: [AnalysisService],
  exports: [AnalysisService],
})
export class AnalysisModule {}
