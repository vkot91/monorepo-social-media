import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseInterceptors,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import {
  ConversationSchema,
  ConversationsSchema,
  type ListMessagesQueryInput,
  listMessagesQuerySchema,
  MessageSchema,
  PaginatedMessagesSchema,
  type SendMessageInput,
  sendMessageSchema,
  type StartConversationInput,
  startConversationSchema,
} from "@social/contracts";

import { ZodResponseInterceptor } from "#common/interceptors/response.interceptor";
import { ZodValidationPipe } from "#common/pipes/zod-validation.pipe";
import { CurrentUser } from "#modules/auth/decorators/current-user.decorator";
import type { AuthTokenPayload } from "#modules/auth/types/auth-token-payload";
import { WRITE_THROTTLE } from "#modules/rate-limit/rate-limit.constants";

import { MessagingGateway } from "./messaging.gateway";
import { MessagingService } from "./messaging.service";

@Controller()
export class ConversationsController {
  constructor(
    private readonly messagingService: MessagingService,
    private readonly gateway: MessagingGateway,
  ) {}

  @Get("conversations")
  @UseInterceptors(ZodResponseInterceptor(ConversationsSchema))
  listConversations(@CurrentUser() user: AuthTokenPayload) {
    return this.messagingService.listConversations(user.sub);
  }

  @Throttle(WRITE_THROTTLE)
  @Post("conversations")
  @UseInterceptors(ZodResponseInterceptor(ConversationSchema))
  startConversation(
    @CurrentUser() user: AuthTokenPayload,
    @Body(new ZodValidationPipe(startConversationSchema)) input: StartConversationInput,
  ) {
    return this.messagingService.startConversation(user.sub, input.recipientId);
  }

  @Get("conversations/:id/messages")
  @UseInterceptors(ZodResponseInterceptor(PaginatedMessagesSchema))
  listMessages(
    @CurrentUser() user: AuthTokenPayload,
    @Param("id") conversationId: string,
    @Query(new ZodValidationPipe(listMessagesQuerySchema)) query: ListMessagesQueryInput,
  ) {
    return this.messagingService.listMessages(user.sub, conversationId, query);
  }

  @Throttle(WRITE_THROTTLE)
  @Post("conversations/:id/messages")
  @UseInterceptors(ZodResponseInterceptor(MessageSchema))
  async sendMessage(
    @CurrentUser() user: AuthTokenPayload,
    @Param("id") conversationId: string,
    @Body(new ZodValidationPipe(sendMessageSchema)) input: SendMessageInput,
  ) {
    const message = await this.messagingService.sendMessage(user.sub, conversationId, input.content);
    const counterpartId = await this.messagingService.getCounterpartId(conversationId, user.sub);

    this.gateway.emitNewMessage([counterpartId, user.sub], message);

    return message;
  }

  @HttpCode(HttpStatus.OK)
  @Post("conversations/:id/read")
  async markRead(@CurrentUser() user: AuthTokenPayload, @Param("id") conversationId: string) {
    const event = await this.messagingService.markRead(user.sub, conversationId);
    const counterpartId = await this.messagingService.getCounterpartId(conversationId, user.sub);

    this.gateway.emitMessageRead(counterpartId, event);

    return event;
  }

  @UseInterceptors(ZodResponseInterceptor(MessageSchema))
  @Delete("messages/:id")
  async deleteMessage(@CurrentUser() user: AuthTokenPayload, @Param("id") messageId: string) {
    const message = await this.messagingService.deleteMessage(user.sub, messageId);
    const counterpartId = await this.messagingService.getCounterpartId(message.conversationId, user.sub);

    this.gateway.emitMessageDeleted([counterpartId, user.sub], message);

    return message;
  }
}
