
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcryptjs';

dotenv.config();

async function main() {
  console.log('Seeding database...');

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
    // 1. Create Super Admin
    const superAdminEmail = 'admin@qrteamcafe.com';
    const superAdminPassword = await bcrypt.hash('admin123', 10);
    
    await prisma.superAdmin.upsert({
      where: { email: superAdminEmail },
      update: {},
      create: {
        email: superAdminEmail,
        passwordHash: superAdminPassword,
        name: 'Super Admin',
      },
    });
    console.log('Super Admin created');

    // 2. Create Demo Cafe
    const demoCafeSlug = 'demo-cafe';
    
    const existingCafe = await prisma.cafe.findUnique({
      where: { slug: demoCafeSlug },
    });

    let cafeId = existingCafe?.id;

    if (!existingCafe) {
      const cafe = await prisma.cafe.create({
        data: {
          name: 'Demo Cafe',
          slug: demoCafeSlug,
          description: 'En lezzetli kahve ve tatlılar burada!',
          type: 'cafe',
          city: 'İstanbul',
          district: 'Kadıköy',
          address: 'Moda Caddesi No:1',
          phone: '05551234567',
          email: 'info@democafe.com',
          website: 'democafe.com',
          status: 'APPROVED',
          isActive: true,
          logoUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200&h=200&fit=crop',
          coverImageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200&h=400&fit=crop',
          wifiSsid: 'DemoCafe_Guest',
          wifiPassword: 'coffeeiloveyou',
          welcomeMessage: 'Hoş geldiniz! Siparişinizi masadan verebilirsiniz.',
          workingHours: '09:00 - 23:00',
          preparationTime: 15,
          templateId: 'modern',
          brandColor: '#e11d48', // Rose-600
        },
      });
      cafeId = cafe.id;
      console.log('Demo Cafe created');

      // 3. Create Cafe Admin
      const cafeAdminPassword = await bcrypt.hash('123456', 10);
      await prisma.cafeAdmin.create({
        data: {
          cafeId: cafe.id,
          name: 'Demo Yöneticisi',
          email: 'demo@qrteamcafe.com',
          passwordHash: cafeAdminPassword,
          isActive: true,
          isApproved: true,
        },
      });
      console.log('Cafe Admin created');
    } else {
      console.log('Demo Cafe already exists');
    }

    if (!cafeId) return;

    // 4. Create Categories and Products if not exist
    const categoryCount = await prisma.category.count({ where: { cafeId } });
    
    if (categoryCount === 0) {
      // Breakfast
      const breakfast = await prisma.category.create({
        data: {
          cafeId,
          name: 'Kahvaltı',
          sortOrder: 1,
        },
      });

      await prisma.product.createMany({
        data: [
          {
            cafeId,
            categoryId: breakfast.id,
            name: 'Serpme Kahvaltı',
            description: 'Peynir çeşitleri, zeytin, bal-kaymak, yumurta, domates, salatalık, sınırsız çay.',
            price: 450,
            imageUrl: 'https://images.unsplash.com/photo-1533089862017-5614ec95e214?w=500',
            isAvailable: true,
            preparationTime: 20,
            isChefRecommended: true,
          },
          {
            cafeId,
            categoryId: breakfast.id,
            name: 'Menemen',
            description: 'Taze domates ve biberle hazırlanan klasik lezzet.',
            price: 180,
            imageUrl: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=500',
            isAvailable: true,
            preparationTime: 15,
          },
        ],
      });

      // Coffee
      const coffee = await prisma.category.create({
        data: {
          cafeId,
          name: 'Kahveler',
          sortOrder: 2,
        },
      });

      await prisma.product.createMany({
        data: [
          {
            cafeId,
            categoryId: coffee.id,
            name: 'Latte',
            description: 'Espresso ve sıcak süt.',
            price: 120,
            imageUrl: 'https://images.unsplash.com/photo-1570968992193-96a2927406a1?w=500',
            isAvailable: true,
            preparationTime: 5,
            stock: 500,
          },
          {
            cafeId,
            categoryId: coffee.id,
            name: 'Americano',
            description: 'Sıcak su ile inceltilmiş espresso.',
            price: 100,
            imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500',
            isAvailable: true,
            preparationTime: 5,
          },
          {
            cafeId,
            categoryId: coffee.id,
            name: 'Türk Kahvesi',
            description: 'Geleneksel lezzet, lokum ile.',
            price: 90,
            imageUrl: 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=500',
            isAvailable: true,
            preparationTime: 10,
          },
        ],
      });

      // Desserts
      const dessert = await prisma.category.create({
        data: {
          cafeId,
          name: 'Tatlılar',
          sortOrder: 3,
        },
      });

      await prisma.product.createMany({
        data: [
          {
            cafeId,
            categoryId: dessert.id,
            name: 'Cheesecake',
            description: 'Limonlu veya frambuazlı.',
            price: 160,
            imageUrl: 'https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=500',
            isAvailable: true,
            preparationTime: 0,
            stock: 20,
          },
          {
            cafeId,
            categoryId: dessert.id,
            name: 'Brownie',
            description: 'Sıcak çikolatalı, dondurma ile.',
            price: 180,
            imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500',
            isAvailable: true,
            preparationTime: 10,
            isChefRecommended: true,
          },
        ],
      });
      
      console.log('Categories and Products created');
    }

    // 5. Create Tables
    const tableCount = await prisma.table.count({ where: { cafeId } });
    if (tableCount === 0) {
      await prisma.table.createMany({
        data: Array.from({ length: 10 }, (_, i) => ({
          cafeId: cafeId!,
          tableNumber: i + 1,
          qrCode: `https://qrteamcafe.com/menu/${demoCafeSlug}?table=${i + 1}`,
        })),
      });
      console.log('Tables created');
    }

  } catch (error) {
    console.error('Seed error:', error);
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
