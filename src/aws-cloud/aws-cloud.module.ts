import { Module } from '@nestjs/common';
import { S3ClientProvider } from './aws-clients/s3.client';
import { S3Service } from './aws-services/s3.services';
import { TranscribeClientProvider } from './aws-clients/transcribe.client';
import { TranscribeService } from './aws-services/transcribe.services';

@Module({
  providers: [
    S3ClientProvider,
    S3Service,
    TranscribeClientProvider,
    TranscribeService,
  ],
  exports: [
    S3Service,
    TranscribeService,
  ],
})
export class AwsCloudModule {}
