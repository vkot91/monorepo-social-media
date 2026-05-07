import { mockReset } from "jest-mock-extended";

import { mockedPrisma } from "#test/prisma.mock";

jest.mock("@social/database", () => ({
  ...jest.requireActual("@social/database"),
  prisma: mockedPrisma,
}));

beforeEach(() => {
  mockReset(mockedPrisma);
});
