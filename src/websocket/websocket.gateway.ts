import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { WebSocketMessage, WebSocketEventType, ErrorData } from './dto/websocket-events.dto';
import { SessionResponseDto } from '../sessions/dto/session-response.dto';
import { AnalysisMetricResponseDto } from '../analysis/dto/analysis-metric-response.dto';
import { FeedbackSuggestionResponseDto } from '../feedback/dto/feedback-suggestion-response.dto';

type BroadcastEvent<T = any> = {
  type: string;
  data: T;
};

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: 'sessions',
})
export class AppWebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger = new Logger(AppWebSocketGateway.name);
  private activeSessions: Map<string, Set<string>> = new Map(); // sessionId -> Set of clientIds
  private clientToSession: Map<string, string> = new Map(); // clientId -> sessionId

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    
    // In a real app, you would authenticate the connection here
    // For now, we'll just accept all connections
  }

  async handleDisconnect(client: Socket) {
    const sessionId = this.clientToSession.get(client.id);
    if (sessionId) {
      this.leaveSession(client, sessionId);
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage(WebSocketEventType.JOIN_SESSION)
  handleJoinSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string; userId: string; isGuest: boolean },
  ) {
    const { sessionId, userId, isGuest } = data;
    
    // Leave any existing session
    const currentSessionId = this.clientToSession.get(client.id);
    if (currentSessionId && currentSessionId !== sessionId) {
      this.leaveSession(client, currentSessionId);
    }

    // Join the new session room
    client.join(sessionId);
    this.clientToSession.set(client.id, sessionId);

    // Track active sessions
    if (!this.activeSessions.has(sessionId)) {
      this.activeSessions.set(sessionId, new Set());
    }
    const sessionClients = this.activeSessions.get(sessionId);
    if (sessionClients) {
      sessionClients.add(client.id);
    }

    this.logger.log(`Client ${client.id} joined session ${sessionId}`);
    
    // Notify others in the room
    client.to(sessionId).emit(WebSocketEventType.SESSION_UPDATED, {
      type: WebSocketEventType.SESSION_UPDATED,
      data: { userId, isGuest, action: 'joined' },
      timestamp: Date.now(),
    });
  }

  @SubscribeMessage(WebSocketEventType.LEAVE_SESSION)
  handleLeaveSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string },
  ) {
    const { sessionId } = data;
    this.leaveSession(client, sessionId);
  }

  @SubscribeMessage(WebSocketEventType.AUDIO_CHUNK)
  async handleAudioChunk(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string; chunk: string; sampleRate: number },
  ) {
    const { sessionId, chunk, sampleRate } = data;
    const sessionClients = this.activeSessions.get(sessionId);

    if (!sessionClients || !sessionClients.has(client.id)) {
      this.sendError(client, {
        code: 'NOT_IN_SESSION',
        message: 'You are not part of this session',
      });
      return;
    }

    // In a real app, you would process the audio chunk here
    // For now, we'll just broadcast it to other clients in the session
    client.to(sessionId).emit(WebSocketEventType.AUDIO_CHUNK, {
      type: WebSocketEventType.AUDIO_CHUNK,
      data: { chunk, sampleRate, timestamp: Date.now() },
      timestamp: Date.now(),
    });
  }

  // Helper method to send error to client
  private sendError(client: Socket, error: ErrorData) {
    const message: WebSocketMessage = {
      type: WebSocketEventType.ERROR,
      data: error,
      timestamp: Date.now(),
    };
    client.emit(WebSocketEventType.ERROR, message);
  }

  /**
   * Broadcast a session update to all clients in the session
   */
  broadcastSessionUpdate(sessionId: string, sessionData: Partial<SessionResponseDto>) {
    const message: BroadcastEvent<Partial<SessionResponseDto>> = {
      type: WebSocketEventType.SESSION_UPDATED,
      data: sessionData,
    };
    this.server.to(sessionId).emit(WebSocketEventType.SESSION_UPDATED, message);
  }

  /**
   * Broadcast an analysis update to all clients in the session
   */
  broadcastAnalysisUpdate(sessionId: string, data: AnalysisMetricResponseDto) {
    const message: BroadcastEvent<AnalysisMetricResponseDto> = {
      type: WebSocketEventType.ANALYSIS_UPDATE,
      data,
    };
    this.server.to(sessionId).emit(WebSocketEventType.ANALYSIS_UPDATE, message);
  }

  /**
   * Broadcast a feedback suggestion to all clients in the session
   */
  broadcastFeedbackSuggestion(sessionId: string, suggestionData: FeedbackSuggestionResponseDto) {
    const message: BroadcastEvent<FeedbackSuggestionResponseDto> = {
      type: WebSocketEventType.FEEDBACK_SUGGESTION,
      data: suggestionData,
    };
    this.server.to(sessionId).emit(WebSocketEventType.FEEDBACK_SUGGESTION, message);
  }

  /**
   * Broadcast a transcript update to all clients in the session
   */
  broadcastTranscriptUpdate(sessionId: string, transcriptData: any) {
    const message: BroadcastEvent<any> = {
      type: WebSocketEventType.TRANSCRIPT_UPDATE,
      data: transcriptData,
    };
    this.server.to(sessionId).emit(WebSocketEventType.TRANSCRIPT_UPDATE, message);
  }

  /**
   * Get the number of active clients in a session
   */
  getActiveClientsInSession(sessionId: string): number {
    return this.activeSessions.get(sessionId)?.size || 0;
  }

  // Helper method to handle leaving a session
  private leaveSession(client: Socket, sessionId: string) {
    client.leave(sessionId);
    this.clientToSession.delete(client.id);

    const sessionClients = this.activeSessions.get(sessionId);
    if (sessionClients) {
      sessionClients.delete(client.id);
      if (sessionClients.size === 0) {
        this.activeSessions.delete(sessionId);
      }
    }

    this.logger.log(`Client ${client.id} left session ${sessionId}`);
  }

  // Public method to broadcast feedback updates to all clients in a session
  public broadcastFeedbackUpdate(sessionId: string, data: any) {
    this.server.to(sessionId).emit(WebSocketEventType.FEEDBACK_UPDATE, {
      type: WebSocketEventType.FEEDBACK_UPDATE,
      data,
      timestamp: Date.now(),
    });
  }
}
