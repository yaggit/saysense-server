import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalysisMetric } from '../common/entities/analysis-metric.entity';
import { CreateAnalysisMetricDto } from './dto/create-analysis-metric.dto';
import { AnalysisMetricResponseDto } from './dto/analysis-metric-response.dto';
import { SessionsService } from '../sessions/sessions.service';
import { AppWebSocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class AnalysisService {
  constructor(
    @InjectRepository(AnalysisMetric)
    private analysisMetricsRepository: Repository<AnalysisMetric>,
    private sessionsService: SessionsService,
    private websocketGateway: AppWebSocketGateway,
  ) {}

  async create(
    sessionId: string,
    createAnalysisMetricDto: CreateAnalysisMetricDto,
    userId: string,
  ): Promise<AnalysisMetricResponseDto> {
    // Verify the session exists and belongs to the user
    const session = await this.sessionsService.getSessionForUser(sessionId, userId);

    const metric = this.analysisMetricsRepository.create({
      ...createAnalysisMetricDto,
      session,
    });

    const savedMetric = await this.analysisMetricsRepository.save(metric);
    
    // Notify WebSocket clients about the new metric
    this.websocketGateway.broadcastAnalysisUpdate(sessionId, {
      ...new AnalysisMetricResponseDto(savedMetric),
    });

    return new AnalysisMetricResponseDto(savedMetric);
  }

  async createBatch(
    sessionId: string,
    createAnalysisMetricDtos: CreateAnalysisMetricDto[],
    userId: string,
  ): Promise<AnalysisMetricResponseDto[]> {
    // Verify the session exists and belongs to the user
    const session = await this.sessionsService.getSessionForUser(sessionId, userId);

    const metrics = createAnalysisMetricDtos.map(dto =>
      this.analysisMetricsRepository.create({
        ...dto,
        session,
      })
    );

    const savedMetrics = await this.analysisMetricsRepository.save(metrics);
    
    // Notify WebSocket clients about the new metrics
    savedMetrics.forEach(metric => {
      this.websocketGateway.broadcastAnalysisUpdate(sessionId, {
        ...new AnalysisMetricResponseDto(metric),
      });
    });

    return savedMetrics.map(metric => new AnalysisMetricResponseDto(metric));
  }

  async findBySession(
    sessionId: string,
    userId: string,
    types?: string[],
    startTime?: number,
    endTime?: number,
  ): Promise<AnalysisMetricResponseDto[]> {
    // Verify the session exists and belongs to the user
    await this.sessionsService.getSessionForUser(sessionId, userId);

    const query = this.analysisMetricsRepository
      .createQueryBuilder('metric')
      .leftJoinAndSelect('metric.session', 'session')
      .where('session.id = :sessionId', { sessionId });

    if (types && types.length > 0) {
      query.andWhere('metric.metricType IN (:...types)', { types });
    }

    if (startTime !== undefined) {
      query.andWhere('metric.timestamp >= :startTime', { startTime });
    }

    if (endTime !== undefined) {
      query.andWhere('metric.timestamp <= :endTime', { endTime });
    }

    const metrics = await query.getMany();
    return metrics.map(metric => new AnalysisMetricResponseDto(metric));
  }

  async getMetricsSummary(
    sessionId: string,
    userId: string,
  ): Promise<{ [key: string]: any }> {
    // Verify the session exists and belongs to the user
    await this.sessionsService.getSessionForUser(sessionId, userId);

    const metrics = await this.analysisMetricsRepository
      .createQueryBuilder('metric')
      .select('metric.metricType', 'type')
      .addSelect('AVG(metric.value)', 'average')
      .addSelect('MIN(metric.value)', 'min')
      .addSelect('MAX(metric.value)', 'max')
      .addSelect('COUNT(metric.id)', 'count')
      .where('metric.session.id = :sessionId', { sessionId })
      .groupBy('metric.metricType')
      .getRawMany();

    return metrics.reduce((acc, { type, average, min, max, count }) => {
      acc[type] = {
        average: parseFloat(average),
        min: parseFloat(min),
        max: parseFloat(max),
        count: parseInt(count, 10),
      };
      return acc;
    }, {});
  }

  async getMetricsByType(
    sessionId: string,
    userId: string,
    type: string,
    limit?: number,
    order: 'ASC' | 'DESC' = 'DESC',
  ): Promise<AnalysisMetricResponseDto[]> {
    // Verify the session exists and belongs to the user
    await this.sessionsService.getSessionForUser(sessionId, userId);

    const query = this.analysisMetricsRepository
      .createQueryBuilder('metric')
      .where('metric.session.id = :sessionId', { sessionId })
      .andWhere('metric.metricType = :type', { type })
      .orderBy('metric.timestamp', order);

    if (limit) {
      query.take(limit);
    }

    const metrics = await query.getMany();
    return metrics.map(metric => new AnalysisMetricResponseDto(metric));
  }

  async getLatestMetricsByType(
    sessionId: string,
    userId: string,
  ): Promise<{ [key: string]: AnalysisMetricResponseDto }> {
    // Verify the session exists and belongs to the user
    await this.sessionsService.getSessionForUser(sessionId, userId);

    // First, get all unique metric types for this session
    const metricTypes = await this.analysisMetricsRepository
      .createQueryBuilder('metric')
      .select('DISTINCT(metric.metricType)', 'type')
      .where('metric.session.id = :sessionId', { sessionId })
      .getRawMany();

    // For each type, get the latest metric
    const latestMetrics: { [key: string]: AnalysisMetricResponseDto } = {};
    
    for (const { type } of metricTypes) {
      const latestMetric = await this.analysisMetricsRepository
        .createQueryBuilder('metric')
        .where('metric.session.id = :sessionId', { sessionId })
        .andWhere('metric.metricType = :type', { type })
        .orderBy('metric.timestamp', 'DESC')
        .getOne();
      
      if (latestMetric) {
        latestMetrics[type] = new AnalysisMetricResponseDto(latestMetric);
      }
    }

    return latestMetrics;
  }

  async remove(id: string, userId: string): Promise<void> {
    const metric = await this.analysisMetricsRepository.findOne({
      where: { id },
      relations: ['session', 'session.user'],
    });

    if (!metric) {
      throw new NotFoundException(`Analysis metric with ID ${id} not found`);
    }

    if (metric.session.user.id !== userId) {
      throw new ForbiddenException('You do not have permission to delete this metric');
    }

    await this.analysisMetricsRepository.remove(metric);
    
    // Create a response DTO for the deleted metric
    const deletedMetric = new AnalysisMetricResponseDto({
      ...metric,
      session: metric.session, // Include the session relation
    });

    // Notify WebSocket clients about the deletion
    this.websocketGateway.broadcastAnalysisUpdate(metric.session.id, deletedMetric);
  }
}
