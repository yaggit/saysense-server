import { Module } from '@nestjs/common';
import { AppWebSocketGateway } from './websocket.gateway';
import { AuthModule } from '../auth/auth.module';

export const WebSocketModuleConfig = {
  imports: [AuthModule],
  providers: [AppWebSocketGateway],
  exports: [AppWebSocketGateway],
};

@Module(WebSocketModuleConfig)
export class WebsocketModule {}

// Export as WebSocketModule for backward compatibility
export { WebsocketModule as WebSocketModule } from './websocket.module';
