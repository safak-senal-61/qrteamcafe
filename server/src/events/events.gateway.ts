import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // cafeId -> Set<tableId> (Aktif masaları tutar)
  private activeTables = new Map<string, Set<string>>();

  // socketId -> { cafeId, tableId } (Hangi socket hangi masada)
  private clientMap = new Map<
    string,
    { cafeId: string; tableId?: string; role: 'client' | 'admin' }
  >();

  handleConnection(client: Socket) {
    // Bağlantı logu eklenebilir
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const info = this.clientMap.get(client.id);
    if (info) {
      if (info.role === 'client' && info.tableId) {
        // İstemci bir masadan ayrıldıysa
        // Kullanıcı sayfayı yenilediğinde veya kısa süreli kopmalarda hemen düşmemesi için
        // 10 saniyelik bir bekleme süresi (grace period) ekliyoruz.
        console.log(
          `Client ${client.id} disconnected from table ${info.tableId}. Waiting 10s before removal.`,
        );

        // Socket'i map'ten hemen siliyoruz ki checkAndRemoveTable doğru çalışsın
        this.clientMap.delete(client.id);

        setTimeout(() => {
          this.checkAndRemoveTable(info.cafeId, info.tableId!, client.id);
        }, 10000);
      } else {
        // Admin veya masa bilgisi olmayan client ise direkt sil
        this.clientMap.delete(client.id);
      }
    }
  }

  private checkAndRemoveTable(
    cafeId: string,
    tableId: string,
    leavingSocketId: string,
  ) {
    // Bu masada hala bağlı olan başka socket var mı?
    let isTableStillActive = false;
    for (const [sId, info] of this.clientMap.entries()) {
      if (
        sId !== leavingSocketId &&
        info.cafeId === cafeId &&
        info.tableId === tableId
      ) {
        isTableStillActive = true;
        break;
      }
    }

    if (!isTableStillActive) {
      console.log(
        `Table ${tableId} in cafe ${cafeId} is empty. Removing from active tables.`,
      );
      const tables = this.activeTables.get(cafeId);
      if (tables) {
        tables.delete(tableId);
        if (tables.size === 0) {
          this.activeTables.delete(cafeId);
        } else {
          this.activeTables.set(cafeId, tables);
        }
        // Adminlere güncel sayıyı gönder
        this.emitActiveTablesUpdate(cafeId);
      }
    } else {
      console.log(
        `Table ${tableId} in cafe ${cafeId} is still active. Keeping.`,
      );
    }
  }

  @SubscribeMessage('joinTable')
  async handleJoinTable(
    client: Socket,
    payload: { cafeId: string; tableId: string },
  ) {
    const { cafeId, tableId } = payload;

    // Client bilgisini kaydet
    this.clientMap.set(client.id, { cafeId, tableId, role: 'client' });

    // Cafe odasına katıl (client'a özel mesaj atmak gerekirse diye)
    await client.join(`cafe_${cafeId}`);
    // Masa odasına katıl (Sipariş güncellemeleri için)
    await client.join(`table_${tableId}`);

    // Aktif masalara ekle
    if (!this.activeTables.has(cafeId)) {
      this.activeTables.set(cafeId, new Set());
    }
    this.activeTables.get(cafeId)?.add(tableId);

    // Adminlere güncelleme gönder
    this.emitActiveTablesUpdate(cafeId);
  }

  @SubscribeMessage('joinAdmin')
  async handleJoinAdmin(client: Socket, payload: { cafeId: string }) {
    const { cafeId } = payload;
    this.clientMap.set(client.id, { cafeId, role: 'admin' });
    await client.join(`cafe_${cafeId}_admin`);

    // Admin bağlanınca hemen mevcut durumu gönder
    this.emitActiveTablesUpdate(cafeId);
  }

  private emitActiveTablesUpdate(cafeId: string) {
    const tables = this.activeTables.get(cafeId);
    const count = tables ? tables.size : 0;
    this.server.to(`cafe_${cafeId}_admin`).emit('activeTablesUpdate', count);
  }

  notifyNewOrder(cafeId: string, order: any) {
    // Adminlere bildir
    this.server.to(`cafe_${cafeId}_admin`).emit('newOrder', order);
  }

  notifyOrderStatusUpdate(
    cafeId: string,
    order: { tableId?: string | null; [key: string]: any },
  ) {
    // İlgili masaya bildir
    if (order.tableId) {
      this.server.to(`table_${order.tableId}`).emit('orderStatusUpdate', order);
    }
    // Adminlere de bildir
    this.server.to(`cafe_${cafeId}_admin`).emit('orderStatusUpdate', order);
  }
}
