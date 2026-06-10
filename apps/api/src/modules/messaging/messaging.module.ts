import { Module } from "@nestjs/common";

import { PaginationModule } from "#common/pagination/pagination.module";
import { RateLimitModule } from "#modules/rate-limit/rate-limit.module";

import { ConversationMembershipService } from "./conversation-membership.service";
import { ConversationsController } from "./conversations.controller";
import { MessagingGateway } from "./messaging.gateway";
import { MessagingService } from "./messaging.service";

@Module({
  controllers: [ConversationsController],
  exports: [MessagingService],
  imports: [PaginationModule, RateLimitModule],
  providers: [MessagingGateway, MessagingService, ConversationMembershipService],
})
export class MessagingModule {}
