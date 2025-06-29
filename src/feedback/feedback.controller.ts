import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Patch,
  Delete,
  UseGuards,
  Req,
  ForbiddenException,
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
import { FeedbackService } from './feedback.service';
import { CreateFeedbackSuggestionDto } from './dto/create-feedback-suggestion.dto';
import { FeedbackSuggestionResponseDto } from './dto/feedback-suggestion-response.dto';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@ApiTags('feedback')
@Controller('sessions/:sessionId/feedback')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post('suggestions')
  @ApiOperation({ summary: 'Create a new feedback suggestion' })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiResponse({
    status: 201,
    description: 'The feedback suggestion has been successfully created.',
    type: FeedbackSuggestionResponseDto,
  })
  async create(
    @Param('sessionId') sessionId: string,
    @Body() createFeedbackSuggestionDto: CreateFeedbackSuggestionDto,
    @Req() req: RequestWithUser,
  ): Promise<FeedbackSuggestionResponseDto> {
    return this.feedbackService.create(
      sessionId,
      createFeedbackSuggestionDto,
      req.user.id,
    );
  }

  @Post('suggestions/batch')
  @ApiOperation({ summary: 'Create multiple feedback suggestions in bulk' })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiResponse({
    status: 201,
    description: 'The feedback suggestions have been successfully created.',
    type: [FeedbackSuggestionResponseDto],
  })
  async createBatch(
    @Param('sessionId') sessionId: string,
    @Body() createFeedbackSuggestionDtos: CreateFeedbackSuggestionDto[],
    @Req() req: RequestWithUser,
  ): Promise<FeedbackSuggestionResponseDto[]> {
    return this.feedbackService.createBatch(
      sessionId,
      createFeedbackSuggestionDtos.map(dto => ({ ...dto, userId: req.user.id })),
      req.user.id,
    );
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get all feedback suggestions for a session' })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiQuery({
    name: 'types',
    required: false,
    description: 'Filter by suggestion types (comma-separated)',
  })
  @ApiQuery({
    name: 'severities',
    required: false,
    description: 'Filter by severities (comma-separated)',
  })
  @ApiQuery({
    name: 'isResolved',
    required: false,
    description: 'Filter by resolved status',
  })
  @ApiQuery({
    name: 'startTime',
    required: false,
    description: 'Filter suggestions after this timestamp (in seconds)',
  })
  @ApiQuery({
    name: 'endTime',
    required: false,
    description: 'Filter suggestions before this timestamp (in seconds)',
  })
  @ApiResponse({
    status: 200,
    description: 'Return all feedback suggestions for the session.',
    type: [FeedbackSuggestionResponseDto],
  })
  async findAll(
    @Param('sessionId') sessionId: string,
    @Query('types') types?: string,
    @Query('severities') severities?: string,
    @Query('isResolved') isResolved?: boolean,
    @Query('startTime') startTime?: number,
    @Query('endTime') endTime?: number,
    @Req() req?: RequestWithUser,
  ): Promise<FeedbackSuggestionResponseDto[]> {
    const filter: any = {};
    if (types) filter.types = types.split(',');
    if (severities) filter.severities = severities.split(',');
    if (isResolved !== undefined) filter.isResolved = isResolved === true;
    if (startTime !== undefined) filter.startTime = Number(startTime);
    if (endTime !== undefined) filter.endTime = Number(endTime);

    if (!req?.user?.id) {
      throw new ForbiddenException('User not authenticated');
    }
    
    return this.feedbackService.findAll(
      sessionId,
      req.user.id,
      filter,
    );
  }

  @Get('suggestions/:id')
  @ApiOperation({ summary: 'Get a specific feedback suggestion by ID' })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiParam({ name: 'id', description: 'Suggestion ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the feedback suggestion with the specified ID.',
    type: FeedbackSuggestionResponseDto,
  })
  async findOne(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<FeedbackSuggestionResponseDto> {
    return this.feedbackService.findOne(id, req.user.id);
  }

  @Patch('suggestions/:id')
  @ApiOperation({ summary: 'Update a feedback suggestion' })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiParam({ name: 'id', description: 'Suggestion ID' })
  @ApiResponse({
    status: 200,
    description: 'The feedback suggestion has been updated.',
    type: FeedbackSuggestionResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body() updateData: any,
    @Req() req: RequestWithUser,
  ): Promise<FeedbackSuggestionResponseDto> {
    return this.feedbackService.update(id, updateData, req.user.id);
  }

  @Delete('suggestions/:id')
  @ApiOperation({ summary: 'Delete a feedback suggestion' })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiParam({ name: 'id', description: 'Suggestion ID' })
  @ApiResponse({
    status: 200,
    description: 'The feedback suggestion has been deleted.',
  })
  async remove(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<void> {
    return this.feedbackService.remove(id, req.user.id);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get a summary of feedback suggestions for a session' })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiResponse({
    status: 200,
    description: 'Return a summary of feedback suggestions by type and severity.',
  })
  async getSummary(
    @Param('sessionId') sessionId: string,
    @Req() req: RequestWithUser,
  ): Promise<any> {
    return this.feedbackService.getSuggestionsSummary(sessionId, req.user.id);
  }
}
