import { Injectable, Inject } from '@nestjs/common';
import {
  StartTranscriptionJobCommand,
  LanguageCode,
} from '@aws-sdk/client-transcribe';

@Injectable()
export class TranscribeService {
  constructor(@Inject('TRANSCRIBE_CLIENT') private readonly transcribeClient) {}

  async startTranscriptionJob(
    jobName: string,
    languageCode: LanguageCode,
    mediaFileUri: string,
  ) {
    const command = new StartTranscriptionJobCommand({
      TranscriptionJobName: jobName,
      LanguageCode: languageCode,
      Media: {
        MediaFileUri: mediaFileUri,
      },
      OutputBucketName: process.env.AWS_S3_BUCKET_NAME,
    });

    return this.transcribeClient.send(command);
  }
}
