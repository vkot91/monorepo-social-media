import type { z } from "zod";

import type {
  CursorPageInfoSchema,
  OffsetPageInfoSchema,
  PageInfoSchema,
  paginationModeSchema,
  paginationQuerySchema,
} from "./schemas";

export type PaginationMode = z.infer<typeof paginationModeSchema>;

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export type PaginationQueryInput = {
  cursor?: string;
  limit?: number;
  mode?: PaginationMode;
  page?: number;
};

export type CursorPageInfo = z.infer<typeof CursorPageInfoSchema>;

export type OffsetPageInfo = z.infer<typeof OffsetPageInfoSchema>;

export type PageInfo = z.infer<typeof PageInfoSchema>;

export type PaginatedResponse<TItem> = {
  items: TItem[];
  pageInfo: PageInfo;
};
