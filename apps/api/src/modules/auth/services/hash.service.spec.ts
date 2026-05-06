import { HashService } from "./hash.service";

describe("HashService", () => {
  const service = new HashService();

  it("hashes and compares values with bcrypt", async () => {
    const hash: string = await service.hash("password123");

    await expect(service.compare("password123", hash)).resolves.toBe(true);
    await expect(service.compare("different-password", hash)).resolves.toBe(false);
  });
});
