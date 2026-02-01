import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const cafes = await prisma.cafe.findMany({
    select: {
      id: true,
      name: true,
      logoUrl: true,
      coverImageUrl: true,
    },
  });

  console.log('Cafes:', JSON.stringify(cafes, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });