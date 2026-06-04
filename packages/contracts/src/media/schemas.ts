import { z } from "zod";

export const mediaUploadPurposeSchema = z.enum(["post-image", "profile-avatar", "profile-background"]);

export const uploadedMediaAssetSchema = z.object({
  id: z.string().uuid(),
  kind: z.literal("IMAGE"),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  sizeBytes: z.number().int().positive(),
  storageKey: z.string(),
  url: z.string().url(),
});
