import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CAFE_ID = '2ea6acce-7d77-4a0b-910f-56a05666d89d';
const PRODUCT_NAME_PART = 'Serpme';
const IMAGE_URL = 'https://images.unsplash.com/photo-1626202158548-e87f7a755947?q=80&w=2000&auto=format&fit=crop';

async function main() {
  console.log(`Searching for products containing "${PRODUCT_NAME_PART}" in cafe ${CAFE_ID}...`);

  const products = await prisma.product.findMany({
    where: {
      cafeId: CAFE_ID,
      name: {
        contains: PRODUCT_NAME_PART,
        mode: 'insensitive',
      },
    },
  });

  console.log(`Found ${products.length} products.`);

  for (const product of products) {
    console.log(`Updating product: ${product.name} (ID: ${product.id})`);
    
    const updated = await prisma.product.update({
      where: { id: product.id },
      data: {
        imageUrl: IMAGE_URL,
      },
    });

    console.log(`Updated image URL for ${updated.name}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
