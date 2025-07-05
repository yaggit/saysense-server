import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TranscriptSegmentEntity } from '../common/entities/transcript-segment.entity';
import { SessionP } from '../common/entities/session.entity';
import { CreateTranscriptSegmentDto } from './dto/create-transcript-segment.dto';
import { TranscriptSegmentResponseDto } from './dto/transcript-segment-response.dto';
import { plainToClass } from 'class-transformer';
import { AppWebSocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class TranscriptService {
  constructor(
    @InjectRepository(TranscriptSegmentEntity)
    private transcriptSegmentRepository: Repository<TranscriptSegmentEntity>,
    @InjectRepository(SessionP)
    private sessionRepository: Repository<SessionP>,
    private websocketGateway: AppWebSocketGateway,
  ) {}

  async create(
    createDto: CreateTranscriptSegmentDto,
    userId: string,
  ): Promise<TranscriptSegmentResponseDto> {
    // Verify the session exists and belongs to the user
    const session = await this.sessionRepository.findOne({
      where: { id: createDto.sessionId, user: { id: userId } },
    });

    if (!session) {
      throw new NotFoundException(
        `Session with ID ${createDto.sessionId} not found or access denied`,
      );
    }

    const segment = this.transcriptSegmentRepository.create({
      ...createDto,
      session,
    });

    const savedSegment = await this.transcriptSegmentRepository.save(segment);

    // Broadcast the new transcript segment via WebSocket
    this.websocketGateway.broadcastTranscriptUpdate(session.id, {
      type: 'new',
      data: plainToClass(TranscriptSegmentResponseDto, savedSegment, {
        excludeExtraneousValues: true,
      }),
    });

    return plainToClass(TranscriptSegmentResponseDto, savedSegment, {
      excludeExtraneousValues: true,
    });
  }

  async createBatch(
    createDtos: CreateTranscriptSegmentDto[],
    userId: string,
  ): Promise<TranscriptSegmentResponseDto[]> {
    if (createDtos.length === 0) {
      return [];
    }

    // Group by session ID to verify all segments belong to the same session
    const sessionId = createDtos[0].sessionId;
    if (!createDtos.every((dto) => dto.sessionId === sessionId)) {
      throw new Error(
        'All transcript segments must belong to the same session',
      );
    }

    // Verify the session exists and belongs to the user
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, user: { id: userId } },
    });

    if (!session) {
      throw new NotFoundException(
        `Session with ID ${sessionId} not found or access denied`,
      );
    }

    const segments = createDtos.map((dto) =>
      this.transcriptSegmentRepository.create({
        ...dto,
        session,
      }),
    );

    const savedSegments = await this.transcriptSegmentRepository.save(segments);

    // Convert to DTOs for response
    const responseDtos = savedSegments.map((segment) =>
      plainToClass(TranscriptSegmentResponseDto, segment, {
        excludeExtraneousValues: true,
      }),
    );

    // Broadcast the batch update
    this.websocketGateway.broadcastTranscriptUpdate(sessionId, {
      type: 'batch',
      data: responseDtos,
    });

    return responseDtos;
  }

  async findAllBySession(
    sessionId: string,
    userId: string,
    options: {
      startTime?: number;
      endTime?: number;
      speaker?: string;
      isFinal?: boolean;
    } = {},
  ): Promise<TranscriptSegmentResponseDto[]> {
    // Verify the session exists and belongs to the user
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, user: { id: userId } },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    const query = this.transcriptSegmentRepository
      .createQueryBuilder('segment')
      .where('segment.sessionId = :sessionId', { sessionId });

    if (options.startTime !== undefined) {
      query.andWhere('segment.endTime >= :startTime', {
        startTime: options.startTime,
      });
    }

    if (options.endTime !== undefined) {
      query.andWhere('segment.startTime <= :endTime', {
        endTime: options.endTime,
      });
    }

    if (options.speaker) {
      query.andWhere('segment.speaker = :speaker', {
        speaker: options.speaker,
      });
    }

    if (options.isFinal !== undefined) {
      query.andWhere("segment.metadata->>'isFinal' = :isFinal", {
        isFinal: options.isFinal.toString(),
      });
    }

    query.orderBy('segment.startTime', 'ASC');

    const segments = await query.getMany();
    return segments.map((segment) =>
      plainToClass(TranscriptSegmentResponseDto, segment, {
        excludeExtraneousValues: true,
      }),
    );
  }

  async findOne(
    id: string,
    userId: string,
  ): Promise<TranscriptSegmentResponseDto> {
    const segment = await this.transcriptSegmentRepository
      .createQueryBuilder('segment')
      .leftJoinAndSelect('segment.session', 'session')
      .where('segment.id = :id', { id })
      .andWhere('session.userId = :userId', { userId })
      .getOne();

    if (!segment) {
      throw new NotFoundException(
        `Transcript segment with ID ${id} not found or access denied`,
      );
    }

    return plainToClass(TranscriptSegmentResponseDto, segment, {
      excludeExtraneousValues: true,
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    const segment = await this.transcriptSegmentRepository
      .createQueryBuilder('segment')
      .leftJoinAndSelect('segment.session', 'session')
      .where('segment.id = :id', { id })
      .andWhere('session.userId = :userId', { userId })
      .getOne();

    if (!segment) {
      throw new NotFoundException(
        `Transcript segment with ID ${id} not found or access denied`,
      );
    }

    await this.transcriptSegmentRepository.remove(segment);

    // Notify clients about the deletion
    this.websocketGateway.broadcastTranscriptUpdate(segment.session.id, {
      type: 'deleted',
      id: segment.id,
    });
  }
}
