import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SessionP, SessionStatus } from '../common/entities/session.entity';
import { User } from '../common/entities/user.entity';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { SessionResponseDto } from './dto/session-response.dto';
import { AppWebSocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(SessionP)
    private sessionsRepository: Repository<SessionP>,
    private websocketGateway: AppWebSocketGateway,
  ) {}

  async create(createSessionDto: CreateSessionDto, user: User): Promise<SessionResponseDto> {
    const session = this.sessionsRepository.create({
      ...createSessionDto,
      user,
      status: SessionStatus.PROCESSING,
      durationSec: 0,
    });

    const savedSession = await this.sessionsRepository.save(session);
    return new SessionResponseDto(savedSession);
  }

  async findAll(userId: string): Promise<SessionResponseDto[]> {
    const sessions = await this.sessionsRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
    return sessions.map(session => new SessionResponseDto(session));
  }

  async findOne(id: string, userId: string): Promise<SessionResponseDto> {
    const session = await this.sessionsRepository.findOne({
      where: { id, user: { id: userId } },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    return new SessionResponseDto(session);
  }

  async update(
    id: string,
    updateSessionDto: UpdateSessionDto,
    userId: string,
  ): Promise<SessionResponseDto> {
    // First find the session with the user relation to ensure ownership
    const session = await this.sessionsRepository.findOne({
      where: { id, user: { id: userId } },
      relations: ['user'],
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    // Handle status changes with proper type safety
    const updateData: Partial<SessionP> = { ...updateSessionDto, status: updateSessionDto.status ? 
      (Object.values(SessionStatus).includes(updateSessionDto.status as SessionStatus) 
        ? updateSessionDto.status as SessionStatus 
        : undefined) 
      : undefined };
    
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
      this.websocketGateway.broadcastSessionUpdate(updatedSession.id, responseDto);
    } catch (error) {
      // Log WebSocket errors but don't fail the request
      console.error('Error broadcasting session update:', error);
    }

    return responseDto;
  }

  async remove(id: string, userId: string): Promise<void> {
    const result = await this.sessionsRepository.delete({
      id,
      user: { id: userId },
    });

    if (result.affected === 0) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }
  }

  async getSessionForUser(sessionId: string, userId: string): Promise<SessionP> {
    const session = await this.sessionsRepository.findOne({
      where: { id: sessionId, user: { id: userId } },
      relations: ['user', 'transcriptSegments', 'analysisMetrics', 'feedbackSuggestions'],
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    return session;
  }
}
