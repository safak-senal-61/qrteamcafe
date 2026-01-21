import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  async create(cafeId: string, createOrderDto: CreateOrderDto) {
    return this.prisma.$transaction(async (prisma) => {
      // 0. Masa durumunu güncelle (Eğer masa boşsa, dolu yap ve süreyi başlat)
      if (createOrderDto.tableId) {
        const table = await prisma.table.findUnique({
          where: { id: createOrderDto.tableId },
        });

        if (table && !table.isOccupied) {
          await prisma.table.update({
            where: { id: createOrderDto.tableId },
            data: {
              isOccupied: true,
              lastOccupiedAt: new Date(),
            },
          });
        }
      }

      // 1. Stok kontrolü ve düşümü
      for (const item of createOrderDto.items) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new BadRequestException(`Ürün bulunamadı: ${item.productId}`);
        }

        if (product.stock < item.quantity) {
          throw new BadRequestException(`${product.name} için yeterli stok yok. Mevcut: ${product.stock}`);
        }

        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // 2. Siparişi oluştur
      const order = await prisma.order.create({
        data: {
          cafeId,
          tableId: createOrderDto.tableId,
          totalAmount: createOrderDto.totalAmount,
          status: 'PENDING',
          items: {
            create: createOrderDto.items.map(
              (item: { productId: string; quantity: number; price: number }) => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.price,
                totalPrice: item.price * item.quantity,
              }),
            ),
          },
        },
        include: {
          table: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // 3. Adminlere socket bildirimi gönder
      // Note: eventsGateway is outside transaction, but that's fine.
      this.eventsGateway.notifyNewOrder(cafeId, order);

      return order;
    });
  }

  // ... diğer metodlar (findAll, findOne, etc.)
  // Basitlik için sadece create'i implemente ettim, diğerlerini olduğu gibi bırakabiliriz
  // veya daha önce varsa koruyabiliriz. Şimdilik create önemli.

  findAll(cafeId: string) {
    return this.prisma.order.findMany({
      where: { cafeId },
      include: {
        table: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.$transaction(async (prisma) => {
      const order = await prisma.order.findUnique({
        where: { id },
        include: { items: { include: { product: true } } },
      });

      if (!order) throw new Error('Sipariş bulunamadı');

      // İptal edilmek isteniyorsa, sadece PENDING ise iptal edilebilir
      if (status === 'CANCELLED' && order.status !== 'PENDING') {
        throw new BadRequestException('Sadece onay bekleyen siparişler iptal edilebilir.');
      }

      // PENDING -> PREPARING geçişinde stok düş (ARTIK GEREKSİZ, OLUŞTURURKEN DÜŞTÜK)
      // Ancak CANCELLED durumunda stoğu iade etmeliyiz
      if (status === 'CANCELLED') {
        for (const item of order.items) {
          await prisma.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }

      const updatedOrder = await prisma.order.update({
        where: { id },
        data: { status },
        include: { 
          table: true,
          items: {
            include: {
              product: true
            }
          }
        },
      });

      // Durum güncellemesini socket ile bildir
      this.eventsGateway.notifyOrderStatusUpdate(updatedOrder.cafeId, updatedOrder);

      return updatedOrder;
    });
  }

  async closeTable(tableId: string) {
    // 1. Masadaki ödenmemiş siparişleri bul
    const orders = await this.prisma.order.findMany({
      where: {
        tableId,
        status: { not: 'PAID' },
      },
    });

    if (orders.length === 0) {
      throw new Error('Bu masada açık sipariş yok.');
    }

    // 2. Tüm siparişleri PAID yap
    await this.prisma.order.updateMany({
      where: {
        tableId,
        status: { not: 'PAID' },
      },
      data: {
        status: 'PAID',
      },
    });

    // 3. Masayı boşalt (isteğe bağlı, bazı sistemlerde masa hep occupied kalır)
    // Ama QR sisteminde masa boşalmalı ki yeni müşteri gelince sıfırdan başlasın
    // Ancak burada 'isOccupied' flag'ini sadece masa fiziksel olarak boşaldığında mı yoksa hesap ödenince mi kaldıracağız?
    // Kullanıcı "başkası oturduğunda yeniden hesaplama" dedi.
    // Hesap ödenince masa boşalmış sayılır.
    await this.prisma.table.update({
      where: { id: tableId },
      data: { isOccupied: false },
    });

    // 4. Toplam tutarı hesapla
    const totalAmount = orders.reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0,
    );

    return { message: 'Hesap kapatıldı', totalAmount };
  }
}
