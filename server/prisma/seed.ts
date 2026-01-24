
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
    // First, let's clear existing categories/products for demo cafe to ensure fresh rich data
    // Be careful in production, but for demo seed this is fine to ensure we have the latest structure
    const categoryCount = await prisma.category.count({ where: { cafeId } });
    
    // If we want to force refresh, we could delete, but let's stick to "add if empty" or just add missing ones.
    // For now, I will just add the new categories if they don't exist by name.
    
    const categories = [
      { name: 'Kahvaltı', sortOrder: 1 },
      { name: 'Ana Yemekler', sortOrder: 2 },
      { name: 'Atıştırmalıklar', sortOrder: 3 },
      { name: 'Tatlılar', sortOrder: 4 },
      { name: 'Sıcak İçecekler', sortOrder: 5 },
      { name: 'Soğuk İçecekler', sortOrder: 6 },
    ];

    for (const catData of categories) {
      let category = await prisma.category.findFirst({
        where: { 
          cafeId: cafeId!,
          name: catData.name
        }
      });

      if (category) {
        category = await prisma.category.update({
          where: { id: category.id },
          data: { sortOrder: catData.sortOrder }
        });
      } else {
        category = await prisma.category.create({
          data: {
            cafeId: cafeId!,
            name: catData.name,
            sortOrder: catData.sortOrder,
          },
        });
      }

      // Populate products for this category
      let products: any[] = [];

      if (catData.name === 'Kahvaltı') {
        products = [
          {
            name: 'Serpme Kahvaltı (2 Kişilik)',
            description: 'Ezine peyniri, kaşar, tulum, siyah/yeşil zeytin, bal-kaymak, tereyağı, reçel çeşitleri, domates, salatalık, yeşillik, sahanda yumurta, pişi, sınırsız çay.',
            price: 850,
            imageUrl: 'https://images.unsplash.com/photo-1533089862017-5614ec95e214?w=800&q=80',
            isAvailable: true,
            preparationTime: 20,
            isChefRecommended: true,
          },
          {
            name: 'Sucuklu Yumurta',
            description: 'Köy yumurtası ve kasap sucuk ile hazırlanan lezzet.',
            price: 220,
            imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414395d8?w=800&q=80',
            isAvailable: true,
            preparationTime: 15,
          },
          {
            name: 'Avokado Tost',
            description: 'Ekşi mayalı ekmek üzerine avokado püresi, poşe yumurta, çeri domates.',
            price: 280,
            imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414395d8?w=800&q=80', // Placeholder, let's find a better one if possible or reuse
            isAvailable: true,
            preparationTime: 12,
            averageRating: 4.8,
            reviewCount: 12,
          }
        ];
        // Fix image for Avocado Toast
        products[2].imageUrl = 'https://images.unsplash.com/photo-1588137372308-15f75323ca8d?w=800&q=80';
      } else if (catData.name === 'Ana Yemekler') {
        products = [
          {
            name: 'Izgara Köfte',
            description: 'Dana kıymadan özel baharatlarla, pilav ve közlenmiş sebzeler ile.',
            price: 380,
            imageUrl: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=800&q=80',
            isAvailable: true,
            preparationTime: 20,
            isChefRecommended: true,
          },
          {
            name: 'Cheeseburger',
            description: '180gr dana burger köftesi, cheddar peyniri, karamelize soğan, turşu, özel sos, patates kızartması ile.',
            price: 350,
            imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
            isAvailable: true,
            preparationTime: 15,
            averageRating: 4.7,
            reviewCount: 25,
          },
          {
            name: 'Tavuk Schnitzel',
            description: 'Panelenmiş tavuk göğsü, patates salatası ve limon ile.',
            price: 320,
            imageUrl: 'https://images.unsplash.com/photo-1599921841143-819065a55cc6?w=800&q=80',
            isAvailable: true,
            preparationTime: 18,
          }
        ];
      } else if (catData.name === 'Atıştırmalıklar') {
        products = [
          {
            name: 'Patates Kızartması',
            description: 'Kajun baharatlı, özel sos ile.',
            price: 120,
            imageUrl: 'https://images.unsplash.com/photo-1573080496987-a199f8cd4058?w=800&q=80',
            isAvailable: true,
            preparationTime: 10,
          },
          {
            name: 'Soğan Halkası',
            description: '8 adet çıtır soğan halkası, ranch sos ile.',
            price: 140,
            imageUrl: 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=800&q=80',
            isAvailable: true,
            preparationTime: 10,
          },
          {
            name: 'Nachos',
            description: 'Mısır cipsi, cheddar sos, jalepeno, meksika fasulyesi, salsa sos.',
            price: 240,
            imageUrl: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=800&q=80',
            isAvailable: true,
            preparationTime: 15,
            averageRating: 4.5,
            reviewCount: 8,
          }
        ];
      } else if (catData.name === 'Tatlılar') {
        products = [
          {
            name: 'San Sebastian Cheesecake',
            description: 'Akışkan kıvamlı, yanında çikolata sos ile.',
            price: 210,
            imageUrl: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=800&q=80',
            isAvailable: true,
            preparationTime: 0,
            isChefRecommended: true,
          },
          {
            name: 'Çikolatalı Sufle',
            description: 'Sıcak akışkan çikolatalı, yanında vanilyalı dondurma ile.',
            price: 200,
            imageUrl: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=800&q=80',
            isAvailable: true,
            preparationTime: 15,
          },
          {
            name: 'Tiramisu',
            description: 'Mascarpone peyniri ve espresso ile hazırlanan İtalyan tatlısı.',
            price: 190,
            imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&q=80',
            isAvailable: true,
            preparationTime: 0,
          }
        ];
      } else if (catData.name === 'Sıcak İçecekler') {
        products = [
          {
            name: 'Latte',
            description: 'Espresso ve sıcak süt, yumuşak içim.',
            price: 110,
            imageUrl: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=800&q=80',
            isAvailable: true,
            preparationTime: 5,
          },
          {
            name: 'Türk Kahvesi',
            description: 'Geleneksel lezzet, çifte kavrulmuş.',
            price: 90,
            imageUrl: 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=800&q=80',
            isAvailable: true,
            preparationTime: 5,
          },
          {
            name: 'Filtre Kahve',
            description: '%100 Arabica çekirdeklerinden.',
            price: 95,
            imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80',
            isAvailable: true,
            preparationTime: 2,
          }
        ];
      } else if (catData.name === 'Soğuk İçecekler') {
        products = [
          {
            name: 'Ev Yapımı Limonata',
            description: 'Taze nane yaprakları ile.',
            price: 110,
            imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&q=80',
            isAvailable: true,
            preparationTime: 5,
          },
          {
            name: 'Iced Latte',
            description: 'Espresso, soğuk süt ve buz.',
            price: 120,
            imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b5c7fa69?w=800&q=80',
            isAvailable: true,
            preparationTime: 5,
          },
          {
            name: 'Churchill',
            description: 'Soda, limon suyu ve tuz.',
            price: 80,
            imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&q=80', // Reuse lemonade image or similar
            isAvailable: true,
            preparationTime: 3,
          }
        ];
      }

      for (const prod of products) {
        // Check if product exists in this category
        const existingProduct = await prisma.product.findFirst({
          where: {
            cafeId: cafeId!,
            categoryId: category.id,
            name: prod.name
          }
        });

        if (!existingProduct) {
          await prisma.product.create({
            data: {
              cafeId: cafeId!,
              categoryId: category.id,
              ...prod
            }
          });
        }
      }
    }
    
    console.log('Categories and Products created/updated');



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
