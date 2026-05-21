import { z } from "zod";

export const targetUserSchema = z.object({
  targetUserId: z.string().uuid(),
});

export const friendshipRequestStatusSchema = z.object({
  status: z.enum(["ACCEPTED", "REJECTED", "CANCELED"]),
});
