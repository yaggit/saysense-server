import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalysisService } from './analysis.service';
import { CreateAnalysisMetricDto } from './dto/create-analysis-metric.dto';
import { AnalysisMetricResponseDto } from './dto/analysis-metric-response.dto';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@ApiTags('analysis')
@Controller('sessions/:sessionId/analysis')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Post('metrics')
  @ApiOperation({ summary: 'Create a new analysis metric' })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiResponse({
    status: 201,
    description: 'The analysis metric has been successfully created.',
    type: AnalysisMetricResponseDto,
  })
  async create(
    @Param('sessionId') sessionId: string,
    @Body() createAnalysisMetricDto: CreateAnalysisMetricDto,
    @Req() req: RequestWithUser,
  ): Promise<AnalysisMetricResponseDto> {
    return this.analysisService.create(
      sessionId,
      createAnalysisMetricDto,
      req.user.id,
    );
  }

  @Post('metrics/batch')
  @ApiOperation({ summary: 'Create multiple analysis metrics in bulk' })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiResponse({
    status: 201,
    description: 'The analysis metrics have been successfully created.',
    type: [AnalysisMetricResponseDto],
  })
  async createBatch(
    @Param('sessionId') sessionId: string,
    @Body() createAnalysisMetricDtos: CreateAnalysisMetricDto[],
    @Req() req: RequestWithUser,
  ): Promise<AnalysisMetricResponseDto[]> {
    return this.analysisService.createBatch(
      sessionId,
      createAnalysisMetricDtos,
      req.user.id,
    );
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get analysis metrics for a session' })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiQuery({ name: 'types', required: false, type: String, description: 'Comma-separated list of metric types to filter by' })
  @ApiQuery({ name: 'startTime', required: false, type: Number, description: 'Start time filter (timestamp in ms)' })
  @ApiQuery({ name: 'endTime', required: false, type: Number, description: 'End time filter (timestamp in ms)' })
  @ApiResponse({
    status: 200,
    description: 'Array of analysis metrics',
    type: [AnalysisMetricResponseDto],
  })
  async findMetrics(
    @Req() req: RequestWithUser,
    @Param('sessionId') sessionId: string,
    @Query('types') types?: string,
    @Query('startTime') startTime?: number,
    @Query('endTime') endTime?: number,
  ): Promise<AnalysisMetricResponseDto[]> {
    const typeArray = types ? types.split(',') : undefined;
    return this.analysisService.findBySession(
      req.user.id,
      sessionId,
      typeArray,
      startTime ? Number(startTime) : undefined,
      endTime ? Number(endTime) : undefined,
    );
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get metrics summary for a session' })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiResponse({
    status: 200,
    description: 'Metrics summary',
  })
  async getMetricsSummary(
    @Param('sessionId') sessionId: string,
    @Req() req: RequestWithUser,
  ): Promise<any> {
    return this.analysisService.getMetricsSummary(sessionId, req.user.id);
  }

  @Delete('metrics/:id')
  @ApiOperation({ summary: 'Delete an analysis metric' })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiParam({ name: 'id', description: 'Metric ID' })
  @ApiResponse({
    status: 200,
    description: 'The analysis metric has been deleted.',
  })
  @ApiResponse({
    status: 404,
    description: 'Analysis metric not found or not authorized.',
  })
  async remove(
    @Param('id') id: string,
    @Param('sessionId') sessionId: string,
    @Req() req: RequestWithUser,
  ): Promise<void> {
    await this.analysisService.remove(id, req.user.id);
  }
}
