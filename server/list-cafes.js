
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const cafes = await prisma.cafe.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    console.log('--- AVAILABLE CAFES ---');
    cafes.forEach(cafe => {
      console.log(`Name: ${cafe.name}`);
      console.log(`ID: ${cafe.id}`);
      console.log(`Test URL: http://localhost:3000/tr/menu/${cafe.id}`);
      console.log('-------------------');
    });
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
