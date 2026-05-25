import { BadRequestException } from "@nestjs/common";
import { z } from "zod";

import { PaginationService } from "./pagination.service";

describe("PaginationService", () => {
  const service = new PaginationService();

  it("resolves cursor query defaults", () => {
    expect(service.resolveCursorQuery({})).toEqual({
      cursor: undefined,
      limit: 20,
      mode: "cursor",
    });
  });

  it("caps cursor limits", () => {
    expect(service.resolveCursorQuery({ limit: 75 })).toMatchObject({
      limit: 50,
    });
  });

  it("resolves offset query defaults", () => {
    expect(service.resolveOffsetQuery({})).toEqual({
      limit: 20,
      mode: "offset",
      page: 1,
    });
  });

  it("round-trips validated cursors", () => {
    const schema = z.object({
      createdAt: z.string(),
      id: z.string(),
      version: z.literal(1),
    });

    const cursor = service.encodeCursor({
      createdAt: "2026-05-01T12:00:00.000Z",
      id: "post-1",
      version: 1,
    });

    expect(service.decodeCursor(cursor, schema)).toEqual({
      createdAt: "2026-05-01T12:00:00.000Z",
      id: "post-1",
      version: 1,
    });
  });

  it("throws a bad request for invalid cursors", () => {
    expect(() => service.decodeCursor("not-json", z.object({ id: z.string() }))).toThrow(
      BadRequestException,
    );
  });

  it("builds a cursor page with the extra record removed", () => {
    const page = service.buildCursorPage(
      [
        { id: "post-1" },
        { id: "post-2" },
        { id: "post-3" },
      ],
      2,
      (item) => ({
        id: item.id,
        version: 1,
      }),
    );

    expect(page.items).toEqual([{ id: "post-1" }, { id: "post-2" }]);
    expect(page.pageInfo).toMatchObject({
      hasNextPage: true,
      limit: 2,
      mode: "cursor",
    });

    if (page.pageInfo.mode !== "cursor") {
      throw new Error("Expected cursor page info");
    }

    expect(page.pageInfo.nextCursor).toEqual(expect.any(String));
  });

  it("builds offset page metadata", () => {
    expect(
      service.buildOffsetPage([{ id: "post-1" }], {
        limit: 10,
        page: 2,
        totalItems: 25,
      }),
    ).toEqual({
      items: [{ id: "post-1" }],
      pageInfo: {
        hasNextPage: true,
        hasPreviousPage: true,
        limit: 10,
        mode: "offset",
        page: 2,
        totalItems: 25,
        totalPages: 3,
      },
    });
  });
});
