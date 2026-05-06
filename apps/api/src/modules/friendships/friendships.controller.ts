import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import {
  friendshipRequestStatusSchema,
  targetUserSchema,
  type FriendshipRequestStatusInput,
  type TargetUserInput,
} from "@social/contracts";

import { ZodValidationPipe } from "#common/pipes/zod-validation.pipe";
import { CurrentUser } from "#modules/auth/decorators/current-user.decorator";
import type { AuthTokenPayload } from "#modules/auth/types/auth-token-payload";
import { FriendshipsService } from "./friendships.service";

@Controller("friendships")
export class FriendshipsController {
  constructor(private readonly friendshipsService: FriendshipsService) {}

  @Post("requests")
  sendRequest(
    @CurrentUser() user: AuthTokenPayload,
    @Body(new ZodValidationPipe(targetUserSchema)) input: TargetUserInput,
  ) {
    return this.friendshipsService.sendRequest(user.sub, input);
  }

  @Patch("requests/:id")
  updateRequest(
    @CurrentUser() user: AuthTokenPayload,
    @Param("id") friendshipId: string,
    @Query(new ZodValidationPipe(friendshipRequestStatusSchema))
    query: FriendshipRequestStatusInput,
  ) {
    return this.friendshipsService.updateRequest(user.sub, friendshipId, query.status);
  }

  @Post("blocks")
  blockUser(
    @CurrentUser() user: AuthTokenPayload,
    @Body(new ZodValidationPipe(targetUserSchema)) input: TargetUserInput,
  ) {
    return this.friendshipsService.blockUser(user.sub, input);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete("blocks/:targetUserId")
  unblockUser(@CurrentUser() user: AuthTokenPayload, @Param("targetUserId") targetUserId: string) {
    return this.friendshipsService.unblockUser(user.sub, targetUserId);
  }
}
