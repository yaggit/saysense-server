import { SessionP } from '../../common/entities/session.entity';
import { AnalysisMetric } from '../../common/entities/analysis-metric.entity';
import { FeedbackSuggestion } from '../../common/entities/feedback-suggestion.entity';

export interface AudioAnalysisResult {
  transcript: string;
  metrics: Omit<AnalysisMetric, 'id' | 'sessionId' | 'createdAt'>[];
  suggestions: Omit<FeedbackSuggestion, 'id' | 'sessionId' | 'createdAt'>[];
}

export interface SentimentAnalysisResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  emotions: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
  };
}

export interface SpeechToTextResult {
  text: string;
  isFinal: boolean;
  confidence: number;
  words: Array<{
    word: string;
    startTime: number;
    endTime: number;
    confidence: number;
  }>;
}

export interface IAiService {
  transcribeAudio(audioData: Buffer, language: string): Promise<SpeechToTextResult>;
  analyzeSentiment(text: string, language: string): Promise<SentimentAnalysisResult>;
  analyzeAudio(audioData: Buffer, language: string): Promise<AudioAnalysisResult>;
  generateFeedback(transcript: string, metrics: any[], session?: SessionP): Promise<FeedbackSuggestion[]>;
}
