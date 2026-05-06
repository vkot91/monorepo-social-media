import { createParamDecorator, type ExecutionContext } from "@nestjs/common";

import type { AuthTokenPayload } from "../types/auth-token-payload";
import type { AuthenticatedRequest } from "../types/authenticated-request";

export function currentUserFactory(_data: unknown, context: ExecutionContext): AuthTokenPayload {
  const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

  return request.user!;
}

export const CurrentUser = createParamDecorator<unknown, ExecutionContext, AuthTokenPayload>(
  currentUserFactory,
);
