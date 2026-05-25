import { BadRequestException, Injectable } from "@nestjs/common";
import type { CursorPageInfo, OffsetPageInfo, PaginatedResponse, PaginationQueryInput } from "@social/contracts";
import type { ZodType } from "zod";

const DEFAULT_LIMIT = 20;
const MAX_CURSOR_LIMIT = 50;
const MAX_OFFSET_LIMIT = 100;

@Injectable()
export class PaginationService {
  resolveCursorQuery(query: PaginationQueryInput) {
    return {
      cursor: query.cursor,
      limit: this.resolveLimit(query.limit, MAX_CURSOR_LIMIT),
      mode: "cursor" as const,
    };
  }

  resolveOffsetQuery(query: PaginationQueryInput) {
    return {
      limit: this.resolveLimit(query.limit, MAX_OFFSET_LIMIT),
      mode: "offset" as const,
      page: query.page ?? 1,
    };
  }

  decodeCursor<TPayload>(cursor: string, schema: ZodType<TPayload>): TPayload {
    try {
      const json = Buffer.from(cursor, "base64url").toString("utf8");
      const result = schema.safeParse(JSON.parse(json));

      if (!result.success) {
        throw new Error("Cursor payload failed validation");
      }

      return result.data;
    } catch {
      throw new BadRequestException("Invalid pagination cursor");
    }
  }

  encodeCursor<TPayload extends Record<string, unknown>>(payload: TPayload): string {
    return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  }

  buildCursorPage<TItem, TPayload extends Record<string, unknown>>(
    items: TItem[],
    limit: number,
    getCursorPayload: (item: TItem) => TPayload,
  ): PaginatedResponse<TItem> {
    const pageItems = items.slice(0, limit);
    const hasNextPage = items.length > limit;
    const lastItem = pageItems.at(-1);

    const pageInfo: CursorPageInfo = {
      hasNextPage,
      limit,
      mode: "cursor",
      nextCursor: hasNextPage && lastItem ? this.encodeCursor(getCursorPayload(lastItem)) : null,
    };

    return {
      items: pageItems,
      pageInfo,
    };
  }

  buildOffsetPage<TItem>(
    items: TItem[],
    options: {
      limit: number;
      page: number;
      totalItems: number;
    },
  ): PaginatedResponse<TItem> {
    const totalPages = Math.ceil(options.totalItems / options.limit);
    const pageInfo: OffsetPageInfo = {
      hasNextPage: options.page < totalPages,
      hasPreviousPage: options.page > 1 && totalPages > 0,
      limit: options.limit,
      mode: "offset",
      page: options.page,
      totalItems: options.totalItems,
      totalPages,
    };

    return {
      items,
      pageInfo,
    };
  }

  private resolveLimit(limit: number | undefined, maxLimit: number) {
    const resolvedLimit = limit ?? DEFAULT_LIMIT;

    return Math.min(resolvedLimit, maxLimit);
  }
}
