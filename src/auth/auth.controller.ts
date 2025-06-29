import { Controller, Post, Body, UseGuards, Req, Res, Get, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthResponseDto } from './dto/auth-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiBody({ type: LoginDto })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({ status: 201, description: 'Registration successful', type: AuthResponseDto })
  @ApiResponse({ status: 400, description: 'User already exists' })
  @ApiBody({ type: RegisterDto })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('guest')
  @ApiOperation({ summary: 'Create a guest user session' })
  @ApiResponse({ status: 201, description: 'Guest session created', type: AuthResponseDto })
  async createGuest() {
    return this.authService.createGuestUser();
  }

  @Post('refresh')
  @UseGuards(AuthGuard('jwt-refresh'))
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Req() req: any) {
    return this.authService.refreshTokens(req.user.id, req.user.refreshToken);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth flow' })
  @ApiResponse({ status: 302, description: 'Redirects to Google OAuth consent screen' })
  async googleAuth() {
    // This will redirect to Google OAuth consent screen
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiResponse({ status: 200, description: 'OAuth successful', type: AuthResponseDto })
  @ApiResponse({ status: 400, description: 'OAuth failed' })
  async googleAuthRedirect(@Req() req: any, @Res() res: Response) {
    // This is a simplified example - in a real app, you'd want to:
    // 1. Check if user exists
    // 2. Create user if not exists
    // 3. Generate tokens
    // 4. Redirect to frontend with tokens
    
    // For now, just return the user info
    res.status(HttpStatus.OK).json(req.user);
  }

  // Add more auth endpoints as needed
}
