import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../common/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (user && !user.isGuest && (await bcrypt.compare(password, user.passwordHash))) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const { email, password, googleToken } = loginDto;
    
    if (googleToken) {
      // Handle Google OAuth login
      return this.loginWithGoogle(googleToken);
    }
    if (!email || !password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  async register(registerDto: RegisterDto) {
    const { email, password, name, googleToken } = registerDto;
    
    // Check if user already exists
    const existingUser = await this.usersRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new Error('User already exists');
    }

    let user: User;
    
    if (googleToken) {
      // Handle Google OAuth registration
      user = this.usersRepository.create({
        email,
        name,
        isGuest: false,
      });
    } else {
      // Regular email/password registration
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(password, salt);
      
      user = this.usersRepository.create({
        email,
        name,
        passwordHash: hashedPassword,
        isGuest: false,
      });
    }

    await this.usersRepository.save(user);
    return this.generateTokens(user);
  }

  async createGuestUser() {
    const guestUser = this.usersRepository.create({
      email: `guest-${uuidv4()}@saysense.app`,
      name: 'Guest User',
      isGuest: true,
    });

    const savedUser = await this.usersRepository.save(guestUser);
    return this.generateTokens(savedUser);
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // In a real app, you might want to validate the refresh token against a whitelist
    // For simplicity, we'll just generate new tokens
    return this.generateTokens(user);
  }

  private async generateTokens(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      isGuest: user.isGuest,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRES_IN', '1h'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('REFRESH_TOKEN_SECRET'),
        expiresIn: this.configService.get('REFRESH_TOKEN_EXPIRES_IN', '7d'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isGuest: user.isGuest,
        preferredLang: user.preferredLang,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  private async loginWithGoogle(googleToken: string) {
    // In a real implementation, you would validate the Google token
    // and fetch user info from Google's API
    // This is a simplified example
    throw new Error('Google OAuth implementation needed');
  }
}
