import { afterEach, describe, expect, it, vi } from "vitest";

import type { PrismaClient } from "../generated/prisma/client";

const readdirMock = vi.hoisted(() => vi.fn());

vi.mock("node:fs/promises", () => ({
  readdir: readdirMock,
}));

const prismaMock = vi.hoisted(() => ({
  $queryRawUnsafe: vi.fn(),
}));

vi.mock("../client", () => ({
  prisma: prismaMock,
}));

const createClientMock = () =>
  ({
    $queryRawUnsafe: vi.fn(),
  }) as unknown as PrismaClient;

const makeDirents = (names: string[]) =>
  names.map((name) => ({ name, isDirectory: () => true }));

afterEach(() => {
  vi.clearAllMocks();
});

describe("assertTestMigrationsApplied", () => {
  it("resolves when every migration on disk has been applied", async () => {
    const client = createClientMock();
    readdirMock.mockResolvedValue(makeDirents(["20240101_init", "20240202_add_users"]));
    vi.mocked(client.$queryRawUnsafe).mockResolvedValue([
      { migration_name: "20240101_init" },
      { migration_name: "20240202_add_users" },
    ]);

    const { assertTestMigrationsApplied } = await import("./migration-status");

    await expect(assertTestMigrationsApplied(client)).resolves.toBeUndefined();
  });

  it("throws listing pending migrations when some are not applied", async () => {
    const client = createClientMock();
    readdirMock.mockResolvedValue(
      makeDirents(["20240101_init", "20240202_add_users", "20240303_add_posts"]),
    );
    vi.mocked(client.$queryRawUnsafe).mockResolvedValue([{ migration_name: "20240101_init" }]);

    const { assertTestMigrationsApplied } = await import("./migration-status");

    await expect(assertTestMigrationsApplied(client)).rejects.toThrow(
      "Test database is missing 2 migration(s): 20240202_add_users, 20240303_add_posts",
    );
  });

  it("includes a remediation hint in the error message", async () => {
    const client = createClientMock();
    readdirMock.mockResolvedValue(makeDirents(["20240101_init"]));
    vi.mocked(client.$queryRawUnsafe).mockResolvedValue([]);

    const { assertTestMigrationsApplied } = await import("./migration-status");

    await expect(assertTestMigrationsApplied(client)).rejects.toThrow(
      "Run `pnpm test:db:migrate` before running the tests.",
    );
  });

  it("treats all disk migrations as pending when the migrations table is missing", async () => {
    const client = createClientMock();
    readdirMock.mockResolvedValue(makeDirents(["20240101_init", "20240202_add_users"]));
    vi.mocked(client.$queryRawUnsafe).mockRejectedValue(new Error('relation "_prisma_migrations" does not exist'));

    const { assertTestMigrationsApplied } = await import("./migration-status");

    await expect(assertTestMigrationsApplied(client)).rejects.toThrow(
      "Test database is missing 2 migration(s): 20240101_init, 20240202_add_users",
    );
  });

  it("ignores non-directory entries in the migrations folder", async () => {
    const client = createClientMock();
    readdirMock.mockResolvedValue([
      { name: "20240101_init", isDirectory: () => true },
      { name: "README.md", isDirectory: () => false },
    ]);
    vi.mocked(client.$queryRawUnsafe).mockResolvedValue([{ migration_name: "20240101_init" }]);

    const { assertTestMigrationsApplied } = await import("./migration-status");

    await expect(assertTestMigrationsApplied(client)).resolves.toBeUndefined();
  });

  it("uses the shared Prisma client when no client is provided", async () => {
    readdirMock.mockResolvedValue(makeDirents(["20240101_init"]));
    prismaMock.$queryRawUnsafe.mockResolvedValue([{ migration_name: "20240101_init" }]);

    const { assertTestMigrationsApplied } = await import("./migration-status");

    await expect(assertTestMigrationsApplied()).resolves.toBeUndefined();
    expect(prismaMock.$queryRawUnsafe).toHaveBeenCalled();
  });
});
