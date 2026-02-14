const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const waiters = await prisma.waiter.findMany();
  console.log(JSON.stringify(waiters, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
