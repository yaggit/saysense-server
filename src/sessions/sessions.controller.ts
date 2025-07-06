import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import {
  SessionResponseDto,
  SessionWithMetricResponseDto,
} from './dto/session-response.dto';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@ApiTags('sessions')
@Controller('sessions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get('/filter')
  @ApiOperation({ summary: 'Get sessions by date range and filter' })
  @ApiResponse({
    status: 200,
    description: 'Return sessions by date range and filter.',
    type: [SessionResponseDto],
  })
  async filter(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Req() req: RequestWithUser,
    @Query('status') status?: string,
  ): Promise<SessionResponseDto[]> {
    return this.sessionsService.filter(
      startDate,
      endDate,
      req.user.id,
      status || '',
    );
  }

  @Post()
  @ApiOperation({ summary: 'Create a new session' })
  @ApiResponse({
    status: 201,
    description: 'The session has been successfully created.',
    type: SessionResponseDto,
  })
  async create(
    @Body() createSessionDto: CreateSessionDto,
    @Req() req: RequestWithUser,
  ): Promise<SessionResponseDto> {
    return this.sessionsService.create(createSessionDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all sessions for the current user' })
  @ApiResponse({
    status: 200,
    description: 'Return all sessions for the current user.',
    type: [SessionResponseDto],
  })
  async findAll(@Req() req: RequestWithUser): Promise<SessionResponseDto[]> {
    return this.sessionsService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a session by ID' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the session with the specified ID.',
    type: SessionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Session not found.' })
  async findOne(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<SessionWithMetricResponseDto> {
    return this.sessionsService.findOne(id, req.user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a session' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiResponse({
    status: 200,
    description: 'The session has been successfully updated.',
    type: SessionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Session not found.' })
  async update(
    @Param('id') id: string,
    @Body() updateSessionDto: UpdateSessionDto,
    @Req() req: RequestWithUser,
  ): Promise<SessionResponseDto> {
    return this.sessionsService.update(id, updateSessionDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a session' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiResponse({
    status: 200,
    description: 'The session has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Session not found.' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.sessionsService.remove(id);
  }

  // create presigned URL for file upload
  @Post('/presignedUrl')
  @ApiOperation({ summary: 'Create a presigned URL for file upload' })
  @ApiResponse({
    status: 201,
    description: 'Presigned URL created successfully.',
    type: String,
  })
  async createPresignedUrl(
    @Body() body: { fileName: string; fileType: string },
  ): Promise<{ url: string; key: string }> {
    return this.sessionsService.createPresignedUrl(
      body.fileName,
      body.fileType,
    );
  }
}
