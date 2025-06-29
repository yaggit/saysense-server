import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsJwtGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    const client = context.switchToWs().getClient();
    
    // For WebSockets, we'll use the handshake query parameters for the token
    const token = client.handshake?.query?.token;
    
    if (!token) {
      throw new WsException('Missing token');
    }

    // Create a fake request object with the authorization header
    return {
      headers: {
        authorization: `Bearer ${token}`,
      },
    };
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new WsException('Unauthorized');
    }
    return user;
  }
}
