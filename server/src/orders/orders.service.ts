import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { EventsGateway } from '../events/events.gateway';
import { getProductImage } from '../products/product-images.util';
import { OrderItem, Product, Category } from '@prisma/client';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
    private auditLogsService: AuditLogsService,
  ) {}

  private mapOrderWithImages<
    T extends {
      items: (OrderItem & {
        product: (Product & { category: Category | null }) | null;
      })[];
    },
  >(order: T) {
    if (!order) return order;

    const mappedItems = order.items.map((item) => ({
      ...item,
      product: item.product
        ? {
            ...item.product,
            imageUrl: getProductImage(
              item.product.name,
              item.product.category?.name,
              item.product.imageUrl,
            ),
          }
        : null,
    }));

    return {
      ...order,
      items: mappedItems,
    };
  }

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

        if ((product.stock || 0) < item.quantity) {
          throw new BadRequestException(
            `${product.name} için yeterli stok yok. Mevcut: ${product.stock}`,
          );
        }

        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // Calculate total amount
      const totalAmount = createOrderDto.items.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0,
      );

      // 2. Siparişi oluştur
      const order = await prisma.order.create({
        data: {
          cafeId,
          tableId: createOrderDto.tableId,
          customerId: createOrderDto.customerId,
          waiterId: createOrderDto.waiterId,
          totalAmount: totalAmount,
          status: 'PENDING',
          items: {
            create: createOrderDto.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.unitPrice * item.quantity,
              note: item.note,
            })),
          },
        },
        include: {
          table: true,
          items: {
            include: {
              product: {
                include: { category: true },
              },
            },
          },
        },
      });

      // 3. Adminlere socket bildirimi gönder
      // Note: eventsGateway is outside transaction, but that's fine.
      const orderWithImages = this.mapOrderWithImages(order);
      this.eventsGateway.notifyNewOrder(cafeId, orderWithImages);

      return orderWithImages;
    });
  }

  // ... diğer metodlar (findAll, findOne, etc.)
  // Basitlik için sadece create'i implemente ettim, diğerlerini olduğu gibi bırakabiliriz
  // veya daha önce varsa koruyabiliriz. Şimdilik create önemli.

  async findAllByCustomer(customerId: string) {
    const orders = await this.prisma.order.findMany({
      where: { customerId },
      include: {
        table: true,
        reviews: true,
        items: {
          include: {
            product: {
              include: { category: true },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return orders.map((order) => this.mapOrderWithImages(order));
  }

  async findActive(cafeId: string) {
    const orders = await this.prisma.order.findMany({
      where: {
        cafeId,
        status: {
          in: ['PENDING', 'PREPARING', 'READY', 'DELIVERED'],
        },
      },
      include: {
        table: true,
        items: {
          include: {
            product: {
              include: { category: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((order) => this.mapOrderWithImages(order));
  }

  async findAll(cafeId: string) {
    const orders = await this.prisma.order.findMany({
      where: { cafeId },
      include: {
        table: true,
        reviews: true,
        items: {
          include: {
            product: {
              include: { category: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((order) => this.mapOrderWithImages(order));
  }

  async updateStatus(id: string, status: string, user?: any) {
    return this.prisma.$transaction(async (prisma) => {
      const order = await prisma.order.findUnique({
        where: { id },
        include: { items: { include: { product: true } } },
      });

      if (!order) throw new Error('Sipariş bulunamadı');

      // Suspicious Action Logging
      if (status === 'CANCELLED') {
        const actorId = user?.id as string;
        const actorType =
          user?.type === 'waiter'
            ? 'WAITER'
            : user?.role === 'CAFE_ADMIN'
              ? 'ADMIN'
              : null;

        if (actorId && actorType) {
          await this.auditLogsService.logAction(
            order.cafeId,
            'ORDER_CANCELLED',
            `Order #${order.id} cancelled by ${actorType} ${user.firstName || ''} ${user.lastName || ''}. Amount: ${order.totalAmount}`,
            actorId,
            actorType,
            order.id,
          );
        }
      }

      // İptal edilmek isteniyorsa, sadece PENDING ise iptal edilebilir
      if (status === 'CANCELLED' && order.status !== 'PENDING') {
        throw new BadRequestException(
          'Sadece onay bekleyen siparişler iptal edilebilir.',
        );
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

      // Update deliveredAt if status is DELIVERED or other final states
      // Use explicit type to avoid unsafe assignment warning
      const updateData: { status: string; deliveredAt?: Date } = { status };
      if (
        ['DELIVERED', 'COMPLETED', 'PAID'].includes(status) &&
        !order.deliveredAt
      ) {
        updateData.deliveredAt = new Date();
      }

      const updatedOrder = await prisma.order.update({
        where: { id },
        data: updateData,
        include: {
          table: true,
          items: {
            include: {
              product: {
                include: { category: true },
              },
            },
          },
        },
      });

      // Durum güncellemesini socket ile bildir
      const updatedOrderWithImages = this.mapOrderWithImages(updatedOrder);
      this.eventsGateway.notifyOrderStatusUpdate(
        updatedOrderWithImages.cafeId,
        updatedOrderWithImages,
      );

      return updatedOrderWithImages;
    });
  }

  async closeTable(tableId: string, paymentMethod: string, user?: any) {
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
    // a) deliveredAt olanlar: sadece status update (mevcut teslimat zamanını koru)
    await this.prisma.order.updateMany({
      where: {
        tableId,
        status: { not: 'PAID' },
        deliveredAt: { not: null },
      },
      data: {
        status: 'PAID',
        paymentStatus: 'PAID',
        paymentMethod,
        updatedAt: new Date(),
      },
    });

    // b) deliveredAt olmayanlar: status update + deliveredAt set (şimdi teslim edilmiş say)
    await this.prisma.order.updateMany({
      where: {
        tableId,
        status: { not: 'PAID' },
        deliveredAt: null,
      },
      data: {
        status: 'PAID',
        paymentStatus: 'PAID',
        paymentMethod,
        deliveredAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // 3. Masayı boşalt
    await this.prisma.table.update({
      where: { id: tableId },
      data: {
        isOccupied: false,
        lastOccupiedAt: null,
      },
    });

    // 4. Toplam tutarı hesapla
    const totalAmount = orders.reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0,
    );

    // Audit Log
    if (user) {
      const actorId = user.id as string;
      const actorType =
        user.type === 'waiter'
          ? 'WAITER'
          : user.role === 'CAFE_ADMIN'
            ? 'ADMIN'
            : null;

      if (actorId && actorType) {
        await this.auditLogsService.logAction(
          orders[0].cafeId,
          'TABLE_CLOSE_PAYMENT',
          `Table closed with payment (${paymentMethod}). Total: ${totalAmount}`,
          actorId,
          actorType,
          tableId,
        );
      }
    }

    // Socket Notifications
    this.eventsGateway.server.to(orders[0].cafeId).emit('tableUpdate', {
      tableId,
      isOccupied: false,
    });
    this.eventsGateway.server.to(orders[0].cafeId).emit('ordersUpdated');

    return { message: 'Hesap kapatıldı', totalAmount };
  }
}
