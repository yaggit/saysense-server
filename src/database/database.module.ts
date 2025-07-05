import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../common/entities/user.entity';
import { SessionP } from '../common/entities/session.entity';
import { TranscriptSegmentEntity } from '../common/entities/transcript-segment.entity';
import { AnalysisMetric } from '../common/entities/analysis-metric.entity';
import { FeedbackSuggestion } from '../common/entities/feedback-suggestion.entity';
import { AppDataSource } from './data-source';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ...AppDataSource.options,
        autoLoadEntities: true,
      }),
    }),
    TypeOrmModule.forFeature([
      User,
      SessionP,
      TranscriptSegmentEntity,
      AnalysisMetric,
      FeedbackSuggestion,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
