import { Body, Controller, Delete, HttpCode, HttpStatus, Param, Patch, Post } from "@nestjs/common";
import {
  type FriendshipRequestStatusInput,
  friendshipRequestStatusSchema,
  type TargetUserInput,
  targetUserSchema,
} from "@social/contracts";

import { FriendshipsService } from "./friendships.service";

import { ZodValidationPipe } from "#common/pipes/zod-validation.pipe";
import { CurrentUser } from "#modules/auth/decorators/current-user.decorator";
import type { AuthTokenPayload } from "#modules/auth/types/auth-token-payload";

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
    @Body(new ZodValidationPipe(friendshipRequestStatusSchema)) input: FriendshipRequestStatusInput,
  ) {
    return this.friendshipsService.updateRequest(user.sub, friendshipId, input.status);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(":id")
  removeFriendship(@CurrentUser() user: AuthTokenPayload, @Param("id") friendshipId: string) {
    return this.friendshipsService.removeFriendship(user.sub, friendshipId);
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
