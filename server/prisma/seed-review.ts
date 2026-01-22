
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('Seeding a test review...');

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not defined');
  }

  // Strip sslmode from the connection string as we configure it manually
  const connectionString = databaseUrl.replace(/\?sslmode=.*$/, '');
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter }) as unknown as PrismaClient;

  try {
    // 1. Get the first product
    const product = await prisma.product.findFirst();

    if (!product) {
      console.log('No products found. Cannot create review.');
      return;
    }

    console.log(`Found product: ${product.name} (${product.id})`);

    // 2. Create a review
    const review = await prisma.review.create({
      data: {
        cafeId: product.cafeId,
        productId: product.id,
        rating: 5,
        comment: 'Harika bir lezzet! Kesinlikle tavsiye ederim.',
        customerName: 'Test Müşteri',
      },
    });

    console.log('Review created:', review);

    // 3. Update product stats
    const aggregate = await prisma.review.aggregate({
      where: { productId: product.id },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.product.update({
      where: { id: product.id },
      data: {
        averageRating: aggregate._avg.rating || 0,
        reviewCount: aggregate._count.rating || 0,
      },
    });

    console.log('Product stats updated.');
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
