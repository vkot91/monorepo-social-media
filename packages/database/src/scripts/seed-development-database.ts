import { prisma, seedDevelopmentDatabase } from "../index";

async function main() {
  await seedDevelopmentDatabase();
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
    process.exitCode = 1;
  });
