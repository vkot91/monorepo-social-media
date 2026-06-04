import type { z } from "zod";

import type { mediaUploadPurposeSchema, uploadedMediaAssetSchema } from "./schemas";

export type MediaUploadPurpose = z.infer<typeof mediaUploadPurposeSchema>;

export type UploadedMediaAssetDto = z.infer<typeof uploadedMediaAssetSchema>;
