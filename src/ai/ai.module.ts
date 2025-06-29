import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { OpenAIService } from './services/openai.service';
import { SessionsModule } from '../sessions/sessions.module';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => SessionsModule),
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        timeout: 5000,
        maxRedirects: 5,
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    {
      provide: 'IAiService',
      useClass: OpenAIService,
    },
  ],
  exports: ['IAiService'],
})
export class AiModule {}
