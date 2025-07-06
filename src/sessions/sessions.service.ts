import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  IsNull,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { SessionP, SessionStatus } from '../common/entities/session.entity';
import { Participants } from '../common/entities/participants.entity';
import { User } from '../common/entities/user.entity';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import {
  SessionResponseDto,
  SessionWithMetricResponseDto,
} from './dto/session-response.dto';
import { AppWebSocketGateway } from '../websocket/websocket.gateway';
import { S3Service } from 'src/aws-cloud/aws-services/s3.services';
import { TranscriptSegmentEntity } from '../common/entities/transcript-segment.entity';
import { TranscribeService } from 'src/aws-cloud/aws-services/transcribe.services';
import { LanguageCode } from '@aws-sdk/client-transcribe';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(SessionP)
    private sessionsRepository: Repository<SessionP>,
    @InjectRepository(Participants)
    private participantsRepository: Repository<Participants>,
    @InjectRepository(TranscriptSegmentEntity)
    private transcriptSegmentRepository: Repository<TranscriptSegmentEntity>,
    private websocketGateway: AppWebSocketGateway,
    private s3Service: S3Service,
    private transcribeService: TranscribeService,
  ) {}

  async create(
    createSessionDto: CreateSessionDto,
    user: User,
  ): Promise<SessionResponseDto> {
    try {
      const session = this.sessionsRepository.create({
        ...createSessionDto,
        user,
        status: SessionStatus.PROCESSING,
        durationSec: 0,
        sentiment: 0,
      });

      const savedSession = await this.sessionsRepository.save(session);

      if (savedSession?.id) {
        await this.transcribeService.startTranscriptionJob(
          `transcribe-${savedSession.id}`,
          savedSession.language as LanguageCode,
          savedSession.source_url as string,
        );
        // create a participant
        await this.participantsRepository.upsert(
          {
            session: savedSession,
            name: user.name,
            role: 'Self',
          },
          ['id'],
        );

        await this.transcriptSegmentRepository.upsert(
          {
            session: savedSession,
            startTime: 0,
            endTime: 0,
            speakerLabel: 'Self',
            transcript: 'Processing...',
            createdAt: new Date(),
          },
          ['id'],
        );
      }

      return new SessionResponseDto(savedSession);
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  async findAll(userId: string): Promise<SessionResponseDto[]> {
    const sessions = await this.sessionsRepository.find({
      where: { user: { id: userId }, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
    return sessions.map((session) => new SessionResponseDto(session));
  }

  async findOne(
    id: string,
    userId: string,
  ): Promise<SessionWithMetricResponseDto> {
    const session = await this.sessionsRepository.findOne({
      where: { id, user: { id: userId }, deletedAt: IsNull() },
      relations: [
        'user',
        'transcriptSegments',
        'participants',
        'analysisMetrics',
        'feedbackSuggestions',
      ],
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }
    if (session.user.id !== userId) {
      throw new ForbiddenException(`
        You do not have permission to access this session
        `);
    }
    return new SessionWithMetricResponseDto(session);
  }

  async update(
    id: string,
    updateSessionDto: UpdateSessionDto,
    userId: string,
  ): Promise<SessionResponseDto> {
    // First find the session with the user relation to ensure ownership
    const session = await this.sessionsRepository.findOne({
      where: { id, user: { id: userId }, deletedAt: IsNull() },
      relations: ['user'],
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    // Handle status changes with proper type safety
    const updateData: Partial<SessionP> = {
      ...updateSessionDto,
      status: updateSessionDto.status
        ? Object.values(SessionStatus).includes(
            updateSessionDto.status as SessionStatus,
          )
          ? (updateSessionDto.status as SessionStatus)
          : undefined
        : undefined,
    };

    // If the session is being marked as completed, set the completedAt timestamp
    if (
      updateSessionDto.status === SessionStatus.COMPLETED &&
      session.status !== SessionStatus.COMPLETED
    ) {
      updateData.completedAt = new Date();
    }
    // If the session is being marked as failed, ensure we don't set completedAt
    else if (updateSessionDto.status === SessionStatus.FAILED) {
      updateData.completedAt = undefined;
    }

    // Ensure status is properly typed
    if (updateSessionDto.status) {
      updateData.status = updateSessionDto.status as SessionStatus;
    }

    // Update the session with the new data
    const updatedSession = await this.sessionsRepository.save({
      ...session,
      ...updateData,
    });

    // Create the response DTO
    const responseDto = new SessionResponseDto(updatedSession);

    try {
      // Notify WebSocket clients about the session update
      this.websocketGateway.broadcastSessionUpdate(
        updatedSession.id,
        responseDto,
      );
    } catch (error) {
      // Log WebSocket errors but don't fail the request
      console.error('Error broadcasting session update:', error);
    }

    return responseDto;
  }

  async remove(id: string): Promise<void> {
    try {
      await this.sessionsRepository.update(id, { deletedAt: new Date() });
    } catch (error) {
      throw new Error(`Failed to delete session with ID ${id}: ${error}`);
    }
  }

  async getSessionForUser(
    sessionId: string,
    userId: string,
  ): Promise<SessionP> {
    const session = await this.sessionsRepository.findOne({
      where: { id: sessionId, user: { id: userId } },
      relations: [
        'user',
        'transcriptSegments',
        'analysisMetrics',
        'feedbackSuggestions',
        'participants',
      ],
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    return session;
  }

  async createPresignedUrl(fileName: string, fileType: string) {
    return this.s3Service.getPresignedUrl(fileName, fileType);
  }

  async filter(
    startDate: string,
    endDate: string,
    userId: string,
    status?: string,
  ): Promise<SessionResponseDto[]> {
    try {
      const sessions = await this.sessionsRepository.find({
        where: {
          user: { id: userId },
          createdAt: Between(new Date(startDate), new Date(endDate)),
          status: status ? (status as SessionStatus) : undefined,
        },
      });
      return sessions.map((session) => new SessionResponseDto(session));
    } catch (error) {
      throw new Error(`Failed to filter sessions: ${error}`);
    }
  }
}
