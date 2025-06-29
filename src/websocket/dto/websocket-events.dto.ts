export enum WebSocketEventType {
  // Client to server events
  JOIN_SESSION = 'join_session',
  LEAVE_SESSION = 'leave_session',
  AUDIO_CHUNK = 'audio_chunk',
  
  // Server to client events
  SESSION_UPDATED = 'session_updated',
  ANALYSIS_UPDATE = 'analysis_update',
  TRANSCRIPT_UPDATE = 'transcript_update',
  FEEDBACK_UPDATE = 'feedback_update',
  FEEDBACK_SUGGESTION = 'feedback_suggestion',
  ERROR = 'error',
}

export interface WebSocketMessage<T = any> {
  type: WebSocketEventType;
  data: T;
  timestamp: number;
}

export interface JoinSessionData {
  sessionId: string;
  userId: string;
  isGuest: boolean;
}

export interface AudioChunkData {
  sessionId: string;
  chunk: string; // Base64 encoded audio chunk
  sampleRate: number;
  timestamp: number;
}

export interface AnalysisUpdateData {
  sessionId: string;
  metricType: string;
  value: number;
  timestamp: number;
  label?: string;
}

export interface TranscriptUpdateData {
  sessionId: string;
  startTime: number;
  endTime: number;
  speakerLabel: string;
  transcript: string;
  isFinal: boolean;
}

export interface FeedbackSuggestionData {
  id: string;
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  timestamp?: number;
  metadata?: Record<string, any>;
  sessionId: string;
  createdAt: Date;
  resolvedAt?: Date;
  isResolved: boolean;
}

export interface ErrorData {
  code: string;
  message: string;
  details?: any;
}
