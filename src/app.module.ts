import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { WebsocketModule } from './websocket/websocket.module';
import { AiModule } from './ai/ai.module';
import { SessionsModule } from './sessions/sessions.module';
import { AnalysisModule } from './analysis/analysis.module';
import { FeedbackModule } from './feedback/feedback.module';
import { AwsCloudModule } from './aws-cloud/aws-cloud.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    WebsocketModule,
    AiModule,
    SessionsModule,
    AnalysisModule,
    FeedbackModule,
    AwsCloudModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
