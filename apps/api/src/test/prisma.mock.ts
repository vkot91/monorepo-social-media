import type { PrismaClient } from "@social/database";
import { type DeepMockProxy, mockDeep } from "jest-mock-extended";

export type PrismaMock = DeepMockProxy<PrismaClient>;

const prismaMockImplementation = {
  friendship: mockDeep<PrismaClient["friendship"]>(),
  post: mockDeep<PrismaClient["post"]>(),
  refreshToken: mockDeep<PrismaClient["refreshToken"]>(),
  user: mockDeep<PrismaClient["user"]>(),
  userBlock: mockDeep<PrismaClient["userBlock"]>(),
} satisfies Partial<PrismaClient>;

export const mockedPrisma = mockDeep<PrismaClient>(prismaMockImplementation);
