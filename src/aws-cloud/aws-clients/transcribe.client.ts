import { TranscribeClient } from "@aws-sdk/client-transcribe";

export const TranscribeClientProvider = {
  provide: 'TRANSCRIBE_CLIENT',
  useFactory: () =>
    new TranscribeClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    }),
};
