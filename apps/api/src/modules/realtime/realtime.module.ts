import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { PresenceService } from "./presence.service";
import { RealtimeGateway } from "./realtime.gateway";

@Module({
  imports: [JwtModule.register({})],
  providers: [RealtimeGateway, PresenceService],
})
export class RealtimeModule {}
