import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  ParseUUIDPipe,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TranscriptService } from './transcript.service';
import { CreateTranscriptSegmentDto } from './dto/create-transcript-segment.dto';
import { TranscriptSegmentResponseDto } from './dto/transcript-segment-response.dto';
import { RequestWithUser } from 'src/auth/interfaces/request-with-user.interface';

@ApiTags('transcripts')
@Controller('sessions/:sessionId/transcripts')
@ApiBearerAuth()
export class TranscriptController {
  constructor(private readonly transcriptService: TranscriptService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new transcript segment' })
  @ApiResponse({
    status: 201,
    description: 'The transcript segment has been successfully created.',
    type: TranscriptSegmentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Session not found.' })
  async create(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() createTranscriptSegmentDto: CreateTranscriptSegmentDto,
    @Req() req: RequestWithUser,
  ): Promise<TranscriptSegmentResponseDto> {
    if (createTranscriptSegmentDto.sessionId !== sessionId) {
      throw new BadRequestException('Session ID in path does not match the one in the request body');
    }
    
    return this.transcriptService.create(
      createTranscriptSegmentDto,
      req.user.id,
    );
  }

  @Post('batch')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create multiple transcript segments in a batch' })
  @ApiResponse({
    status: 201,
    description: 'The transcript segments have been successfully created.',
    type: [TranscriptSegmentResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Session not found.' })
  async createBatch(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() createDtos: CreateTranscriptSegmentDto[],
    @Req() req: RequestWithUser,
  ): Promise<TranscriptSegmentResponseDto[]> {
    // Ensure all segments belong to the same session as in the URL
    if (!createDtos.every((dto) => dto.sessionId === sessionId)) {
      throw new BadRequestException('All transcript segments must belong to the same session as specified in the URL');
    }
    
    return this.transcriptService.createBatch(createDtos, req.user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all transcript segments for a session' })
  @ApiResponse({
    status: 200,
    description: 'Return all transcript segments for the session.',
    type: [TranscriptSegmentResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Session not found.' })
  async findAll(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
    @Query('speaker') speaker?: string,
    @Query('isFinal') isFinal?: string,
    @Req() req?: RequestWithUser,
  ): Promise<TranscriptSegmentResponseDto[]> {
    const options: {
      startTime?: number;
      endTime?: number;
      speaker?: string;
      isFinal?: boolean;
    } = {};

    if (startTime) options.startTime = parseInt(startTime, 10);
    if (endTime) options.endTime = parseInt(endTime, 10);
    if (speaker) options.speaker = speaker;
    if (isFinal) options.isFinal = isFinal.toLowerCase() === 'true';

    if (!req) {
      throw new UnauthorizedException('User not authenticated');
    }

    return this.transcriptService.findAllBySession(sessionId, req.user.id, options);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get a specific transcript segment by ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the transcript segment with the specified ID.',
    type: TranscriptSegmentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Transcript segment not found or access denied.' })
  async findOne(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ): Promise<TranscriptSegmentResponseDto> {
    return this.transcriptService.findOne(id, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a transcript segment' })
  @ApiResponse({
    status: 200,
    description: 'The transcript segment has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Transcript segment not found or access denied.' })
  async remove(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ): Promise<void> {
    await this.transcriptService.remove(id, req.user.id);
  }
}
