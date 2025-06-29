import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';
import { IAiService, AudioAnalysisResult, SentimentAnalysisResult, SpeechToTextResult } from '../interfaces/ai-service.interface';
import { AnalysisMetric, MetricType } from '../../common/entities/analysis-metric.entity';
import { SuggestionType, SuggestionSeverity, FeedbackSuggestion } from '../../common/entities/feedback-suggestion.entity';
import { SessionsService } from '../../sessions/sessions.service';
import { Session } from 'inspector/promises';
import { SessionP } from 'src/common/entities/session.entity';

@Injectable()
export class OpenAIService implements IAiService {
  private readonly logger = new Logger(OpenAIService.name);
  private openai: OpenAI;

  constructor(
    private configService: ConfigService,
    @Inject(forwardRef(() => SessionsService))
    private sessionsService: SessionsService
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY'),
    });
  }

  async transcribeAudio(audioData: Buffer, language: string = 'en'): Promise<SpeechToTextResult> {
    try {
      // In a real implementation, you would send the audio data to OpenAI's Whisper API
      // For now, we'll return a mock response
      this.logger.log(`Transcribing audio (${audioData.length} bytes) in ${language}`);
      
      // Mock implementation - replace with actual API call
      return {
        text: 'This is a sample transcription of the audio content.',
        isFinal: true,
        confidence: 0.95,
        words: [
          { word: 'This', startTime: 0.0, endTime: 0.3, confidence: 0.98 },
          { word: 'is', startTime: 0.3, endTime: 0.5, confidence: 0.99 },
          { word: 'a', startTime: 0.5, endTime: 0.6, confidence: 0.99 },
          { word: 'sample', startTime: 0.6, endTime: 1.0, confidence: 0.97 },
          { word: 'transcription', startTime: 1.0, endTime: 1.8, confidence: 0.96 },
          { word: 'of', startTime: 1.8, endTime: 2.0, confidence: 0.98 },
          { word: 'the', startTime: 2.0, endTime: 2.1, confidence: 0.99 },
          { word: 'audio', startTime: 2.1, endTime: 2.6, confidence: 0.97 },
          { word: 'content', startTime: 2.6, endTime: 3.2, confidence: 0.96 },
        ],
      };
    } catch (error) {
      this.logger.error('Error transcribing audio:', error);
      throw new Error('Failed to transcribe audio');
    }
  }

  async analyzeSentiment(text: string, language: string = 'en'): Promise<SentimentAnalysisResult> {
    try {
      this.logger.log(`Analyzing sentiment for text (${text.length} chars) in ${language}`);
      
      // Mock implementation - replace with actual API call
      return {
        sentiment: 'positive',
        confidence: 0.85,
        emotions: {
          joy: 0.8,
          sadness: 0.1,
          anger: 0.05,
          fear: 0.03,
          surprise: 0.02,
        },
      };
    } catch (error) {
      this.logger.error('Error analyzing sentiment:', error);
      throw new Error('Failed to analyze sentiment');
    }
  }

  async analyzeAudio(audioData: Buffer, sessionId: string, language: string = 'en'): Promise<AudioAnalysisResult> {
    try {
      const transcription = await this.transcribeAudio(audioData, language);
      const sentiment = await this.analyzeSentiment(transcription.text, language);
      
      // Get the session to associate with metrics
      const session = await this.sessionsService.getSessionForUser(sessionId, 'system');
      
      // Create metrics with the session
      const metrics: Omit<AnalysisMetric, 'id' | 'createdAt' | 'sessionId'>[] = [
        {
          metricType: MetricType.TONE,
          value: this.mapSentimentToTone(sentiment.sentiment),
          label: 'tone score',
          timestamp: Date.now(),
          session: session
        },
        {
          metricType: MetricType.SPEED,
          value: this.calculateSpeakingRate(transcription.words),
          label: 'words per minute',
          timestamp: Date.now(),
          session: session
        },
        {
          metricType: MetricType.CLARITY,
          value: this.calculateClarityScore(transcription.words),
          label: 'clarity score',
          timestamp: Date.now(),
          session: session
        },
      ];

      // Generate feedback with required properties
      const feedback = await this.generateFeedback(transcription.text, metrics, session);
      const suggestions: Omit<FeedbackSuggestion, 'id' | 'createdAt' | 'sessionId'>[] = feedback.map(suggestion => ({
        ...suggestion,
        isApplied: false,
      }));

      return {
        transcript: transcription.text,
        metrics,
        suggestions,
      };
    } catch (error) {
      this.logger.error('Error analyzing audio:', error);
      throw new Error('Failed to analyze audio');
    }
  }

  async generateFeedback(
    transcript: string,
    metrics: any[],
    session: SessionP
  ): Promise<FeedbackSuggestion[]> {
    const suggestions: FeedbackSuggestion[] = [];

    // Example: Check speaking rate
    const speedMetric = metrics.find(m => m.metricType === MetricType.SPEED);
    if (speedMetric) {
      if (speedMetric.value > 180) {
        const suggestion = new FeedbackSuggestion({
          type: SuggestionType.PACING,
          message: 'You\'re speaking very quickly. Try to slow down for better clarity.',
          severity: SuggestionSeverity.MEDIUM,
          isApplied: false,
          session: session
        });
        suggestions.push(suggestion);
      } else if (speedMetric.value < 100) {
        const suggestion = new FeedbackSuggestion({
          type: SuggestionType.PACING,
          message: 'You\'re speaking quite slowly. Try to maintain a moderate pace to keep your audience engaged.',
          severity: SuggestionSeverity.LOW,
          isApplied: false,
          session: session,
        });
        suggestions.push(suggestion);
      }
    }

    // Example: Check for filler words
    const fillerWords = ['um', 'uh', 'like', 'you know', 'so', 'basically'];
    const fillerCount = fillerWords.reduce((count, word) => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      return count + ((transcript.match(regex) || []).length);
    }, 0);

    if (fillerCount > 5) {
      const suggestion = new FeedbackSuggestion({
        type: SuggestionType.PAUSE,
        message: `You used ${fillerCount} filler words. Try pausing instead to gather your thoughts.`,
        severity: SuggestionSeverity.MEDIUM,
        isApplied: false,
        session: session,
      });
      suggestions.push(suggestion);
    }

    return suggestions;
  }

  private mapSentimentToTone(sentiment: string): number {
    // Map sentiment to a scale of -1 (very negative) to 1 (very positive)
    switch (sentiment) {
      case 'positive': return 0.8;
      case 'neutral': return 0;
      case 'negative': return -0.6;
      default: return 0;
    }
  }

  private calculateSpeakingRate(words: any[]): number {
    if (words.length < 2) return 0;
    
    const duration = words[words.length - 1].endTime - words[0].startTime;
    const minutes = duration / 60;
    return words.length / minutes;
  }

  private calculateClarityScore(words: any[]): number {
    if (words.length === 0) return 0;
    
    const totalConfidence = words.reduce((sum, word) => sum + word.confidence, 0);
    return totalConfidence / words.length;
  }
}
