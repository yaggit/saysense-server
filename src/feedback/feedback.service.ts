import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, FindManyOptions } from 'typeorm';
import { FeedbackSuggestion } from '../common/entities/feedback-suggestion.entity';
import { CreateFeedbackSuggestionDto } from './dto/create-feedback-suggestion.dto';
import { FeedbackSuggestionResponseDto } from './dto/feedback-suggestion-response.dto';
import { SessionsService } from '../sessions/sessions.service';
import { AppWebSocketGateway } from '../websocket/websocket.gateway';
import { plainToClass } from 'class-transformer';

type SuggestionFilter = {
  types?: string[];
  severities?: string[];
  isResolved?: boolean;
  startTime?: number;
  endTime?: number;
};

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(FeedbackSuggestion)
    private feedbackRepository: Repository<FeedbackSuggestion>,
    private sessionsService: SessionsService,
    private websocketGateway: AppWebSocketGateway,
  ) {}

  async findAll(
    sessionId: string,
    userId: string,
    filter: SuggestionFilter = {},
  ): Promise<FeedbackSuggestionResponseDto[]> {
    // Verify the session exists and belongs to the user
    await this.sessionsService.getSessionForUser(sessionId, userId);

    // Initialize the where clause with the session filter
    const where: any = {
      session: { id: sessionId },
    };

    // Apply filters
    if (filter.types?.length) {
      where.type = In(filter.types);
    }
    if (filter.severities?.length) {
      where.severity = In(filter.severities);
    }
    if (filter.isResolved !== undefined) {
      where.isResolved = filter.isResolved;
    }
    if (filter.startTime) {
      where.createdAt = { ...(where.createdAt || {}), $gte: new Date(filter.startTime) };
    }
    if (filter.endTime) {
      where.createdAt = { ...(where.createdAt || {}), $lte: new Date(filter.endTime) };
    }

    const query: FindManyOptions<FeedbackSuggestion> = {
      where,
      relations: ['session'],
    };

    const suggestions = await this.feedbackRepository.find(query);
    return suggestions.map(suggestion => this.toResponseDto(suggestion));
  }

  async create(
    sessionId: string,
    createFeedbackSuggestionDto: CreateFeedbackSuggestionDto,
    userId: string,
  ): Promise<FeedbackSuggestionResponseDto> {
    // Verify the session exists and belongs to the user
    const session = await this.sessionsService.getSessionForUser(sessionId, userId);

    const suggestion = this.feedbackRepository.create({
      ...createFeedbackSuggestionDto,
      session,
    });

    const savedSuggestion = await this.feedbackRepository.save(suggestion);
    
    // Notify WebSocket clients about the new suggestion
    this.websocketGateway.broadcastFeedbackSuggestion(sessionId, {
      ...this.toResponseDto(savedSuggestion),
    });

    return this.toResponseDto(savedSuggestion);
  }

  private toResponseDto(suggestion: FeedbackSuggestion): FeedbackSuggestionResponseDto {
    return new FeedbackSuggestionResponseDto({
      ...suggestion,
      session: suggestion.session,
    });
  }

  async createBatch(
    sessionId: string,
    createDtos: CreateFeedbackSuggestionDto[],
    userId: string,
  ): Promise<FeedbackSuggestionResponseDto[]> {
    // Verify the session exists and belongs to the user
    const session = await this.sessionsService.getSessionForUser(sessionId, userId);

    const suggestions = createDtos.map(dto => {
      return this.feedbackRepository.create({
        ...dto,
        session,
      });
    });

    const savedSuggestions = await this.feedbackRepository.save(suggestions);
    
    // Broadcast the new suggestions via WebSocket
    savedSuggestions.forEach(suggestion => {
      this.websocketGateway.broadcastFeedbackSuggestion(
        sessionId,
        this.toResponseDto(suggestion),
      );
    });

    return savedSuggestions.map(suggestion =>
      this.toResponseDto(suggestion),
    );
  }

  async findAllForSession(
    sessionId: string,
    userId: string,
    filters: SuggestionFilter = {},
  ): Promise<FeedbackSuggestionResponseDto[]> {
    // Verify the session exists and belongs to the user
    await this.sessionsService.getSessionForUser(sessionId, userId);

    const query: FindManyOptions<FeedbackSuggestion> = {
      where: { session: { id: sessionId } },
      relations: ['session'],
      order: { createdAt: 'DESC' },
    };

    if (filters.types && filters.types.length > 0) {
      query.where = {
        ...query.where,
        type: In(filters.types as any[]),
      };
    }

    if (filters.severities && filters.severities.length > 0) {
      query.where = {
        ...query.where,
        severity: In(filters.severities as any[]),
      };
    }

    if (filters.isResolved !== undefined) {
      query.where = {
        ...query.where,
        isApplied: filters.isResolved, // Map isResolved to isApplied
      };
    }

    if (filters.startTime !== undefined) {
      query.where = {
        ...query.where,
        startTime: filters.startTime,
      };
    }

    if (filters.endTime !== undefined) {
      query.where = {
        ...query.where,
        endTime: filters.endTime,
      };
    }

    const suggestions = await this.feedbackRepository.find(query);
    return suggestions.map((suggestion) => this.toResponseDto(suggestion));
  }

  async findOne(id: string, userId: string): Promise<FeedbackSuggestionResponseDto> {
    const suggestion = await this.feedbackRepository.findOne({
      where: { id },
      relations: ['session'],
    });

    if (!suggestion) {
      throw new NotFoundException(`Feedback suggestion with ID ${id} not found`);
    }

    // Verify the session belongs to the user
    if (suggestion.session.user?.id !== userId) {
      throw new ForbiddenException('You do not have permission to access this suggestion');
    }

    return this.toResponseDto(suggestion);
  }

  async update(
    id: string, 
    updateData: any, 
    userId: string
  ): Promise<FeedbackSuggestionResponseDto> {
    const suggestion = await this.feedbackRepository.findOne({
      where: { id },
      relations: ['session'],
    });

    if (!suggestion) {
      throw new NotFoundException(`Feedback suggestion with ID ${id} not found`);
    }

    // Verify the session belongs to the user
    if (suggestion.session.user?.id !== userId) {
      throw new ForbiddenException('You do not have permission to update this suggestion');
    }

    const updated = await this.feedbackRepository.save({
      ...suggestion,
      ...updateData,
    });

    // Broadcast the update via WebSocket
    this.websocketGateway.broadcastFeedbackSuggestion(
      suggestion.session.id,
      plainToClass(FeedbackSuggestionResponseDto, updated, {
        excludeExtraneousValues: true,
      }),
    );

    return plainToClass(FeedbackSuggestionResponseDto, updated, {
      excludeExtraneousValues: true,
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    const suggestion = await this.feedbackRepository.findOne({
      where: { id },
      relations: ['session'],
    });

    if (!suggestion) {
      throw new NotFoundException(`Feedback suggestion with ID ${id} not found`);
    }

    // Verify the session belongs to the user
    if (suggestion.session.user?.id !== userId) {
      throw new ForbiddenException('You do not have permission to delete this suggestion');
    }

    await this.feedbackRepository.remove(suggestion);

    // Create a minimal response DTO for deletion notification
    const deletionDto = new FeedbackSuggestionResponseDto({
      id,
      session: suggestion.session,
      deleted: true,
    });
    
    // Notify WebSocket clients about the deletion
    this.websocketGateway.broadcastFeedbackSuggestion(suggestion.session.id, deletionDto);
  }

  async getSuggestionsSummary(
    sessionId: string,
    userId: string,
  ): Promise<{ [key: string]: any }> {
    // Verify the session exists and belongs to the user
    await this.sessionsService.getSessionForUser(sessionId, userId);

    const summary = await this.feedbackRepository
      .createQueryBuilder('suggestion')
      .select('suggestion.type', 'type')
      .addSelect('suggestion.severity', 'severity')
      .addSelect('COUNT(suggestion.id)', 'count')
      .where('suggestion.sessionId = :sessionId', { sessionId })
      .groupBy('suggestion.type, suggestion.severity')
      .getRawMany();

    return summary.reduce((acc, { type, severity, count }) => {
      if (!acc[type]) {
        acc[type] = { total: 0, bySeverity: {} };
      }
      acc[type].total += parseInt(count, 10);
      acc[type].bySeverity[severity] = parseInt(count, 10);
      return acc;
    }, {});
  }
}
