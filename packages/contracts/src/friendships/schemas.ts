import { z } from "zod";

import { SchemaShape } from "../utils/schemaShape.type";
import type { FriendshipRequestStatusInput, TargetUserInput } from "./types";

export const targetUserSchema = z.object({
  targetUserId: z.string().uuid(),
} satisfies SchemaShape<TargetUserInput>);

export const friendshipRequestStatusSchema = z.object({
  status: z.enum(["ACCEPTED", "REJECTED", "CANCELED"]),
} satisfies SchemaShape<FriendshipRequestStatusInput>);
