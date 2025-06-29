import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          // Check for token in cookies first
          if (request?.cookies?.Authentication) {
            return request.cookies.Authentication;
          }
          // Fall back to Authorization header
          const authHeader = request?.headers?.authorization;
          if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
          }
          return null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(request: Request, payload: JwtPayload) {
    const user = { 
      id: payload.sub, 
      email: payload.email, 
      role: payload.role,
      isGuest: payload.isGuest 
    };
    
    // Attach user to request object
    (request as any).user = user;
    return user;
  }
}
