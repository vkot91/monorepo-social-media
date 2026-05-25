import { z } from "zod";

const integerQueryParamSchema = (fieldName: string, max?: number) =>
  z.preprocess((value) => {
    if (typeof value === "string" && value.trim() !== "") {
      return Number(value);
    }

    return value;
  }, z.number({ invalid_type_error: `${fieldName} must be a number` }).int().positive().max(max ?? Number.MAX_SAFE_INTEGER));

export const paginationModeSchema = z.enum(["cursor", "offset"]);

export const paginationQueryShape = {
  cursor: z.string().min(1).optional(),
  limit: integerQueryParamSchema("limit", 100).optional(),
  mode: paginationModeSchema.optional(),
  page: integerQueryParamSchema("page").optional(),
};

export const validatePaginationQuery = (input: Record<string, unknown>, context: z.RefinementCtx) => {
  const mode = input.mode === "offset" ? "offset" : "cursor";
  const cursor = typeof input.cursor === "string" ? input.cursor : undefined;
  const limit = typeof input.limit === "number" ? input.limit : undefined;
  const page = typeof input.page === "number" ? input.page : undefined;

  if (mode === "cursor" && page !== undefined) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "page can only be used with offset pagination",
      path: ["page"],
    });
  }

  if (mode === "offset" && cursor !== undefined) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "cursor can only be used with cursor pagination",
      path: ["cursor"],
    });
  }

  if (mode === "cursor" && limit !== undefined && limit > 50) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Cursor pagination limit cannot exceed 50",
      path: ["limit"],
    });
  }
};

export const paginationQuerySchema = z.object(paginationQueryShape).superRefine(validatePaginationQuery);

export const CursorPageInfoSchema = z.object({
  hasNextPage: z.boolean(),
  limit: z.number().int().positive(),
  mode: z.literal("cursor"),
  nextCursor: z.string().nullable(),
});

export const OffsetPageInfoSchema = z.object({
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
  limit: z.number().int().positive(),
  mode: z.literal("offset"),
  page: z.number().int().positive(),
  totalItems: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

export const PageInfoSchema = z.discriminatedUnion("mode", [CursorPageInfoSchema, OffsetPageInfoSchema]);

export const paginatedResponseSchema = <TItemSchema extends z.ZodTypeAny>(itemSchema: TItemSchema) =>
  z.object({
    items: z.array(itemSchema),
    pageInfo: PageInfoSchema,
  });
