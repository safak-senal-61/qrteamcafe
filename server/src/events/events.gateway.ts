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
  }

  handleDisconnect(client: Socket) {
    const info = this.clientMap.get(client.id);
    if (info) {
      if (info.role === 'client' && info.tableId) {
        // İstemci bir masadan ayrıldıysa
        // Not: Gerçek hayatta kullanıcı sayfayı yenilediğinde hemen düşmemesi için
        // bir timeout veya debounce mekanizması kullanılabilir.
        // Şimdilik basitleştirilmiş mantık:

        // Bu masada başka client var mı kontrol et (basitlik için şimdilik etmiyoruz, direkt siliyoruz gibi düşünebiliriz ama
        // doğrusu bu cafeId ve tableId'ye sahip başka socket var mı diye bakmak)

        // Şimdilik basit activeTables mantığı yerine, o masadaki kişi sayısını tutmak daha doğru olabilir.
        // Ama istek "aktif masa sayısı" olduğu için, bir masada en az 1 kişi varsa aktiftir.

        this.checkAndRemoveTable(info.cafeId, info.tableId, client.id);
      }
      this.clientMap.delete(client.id);
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
    }
  }

  @SubscribeMessage('joinTable')
  handleJoinTable(
    client: Socket,
    payload: { cafeId: string; tableId: string },
  ) {
    const { cafeId, tableId } = payload;

    // Client bilgisini kaydet
    this.clientMap.set(client.id, { cafeId, tableId, role: 'client' });

    // Cafe odasına katıl (client'a özel mesaj atmak gerekirse diye)
    client.join(`cafe_${cafeId}`);
    // Masa odasına katıl (Sipariş güncellemeleri için)
    client.join(`table_${tableId}`);

    // Aktif masalara ekle
    if (!this.activeTables.has(cafeId)) {
      this.activeTables.set(cafeId, new Set());
    }
    this.activeTables.get(cafeId)?.add(tableId);

    // Adminlere güncelleme gönder
    this.emitActiveTablesUpdate(cafeId);
  }

  @SubscribeMessage('joinAdmin')
  handleJoinAdmin(client: Socket, payload: { cafeId: string }) {
    const { cafeId } = payload;
    this.clientMap.set(client.id, { cafeId, role: 'admin' });
    client.join(`cafe_${cafeId}_admin`);

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

  notifyOrderStatusUpdate(cafeId: string, order: any) {
    // İlgili masaya bildir
    if (order.tableId) {
      this.server.to(`table_${order.tableId}`).emit('orderStatusUpdate', order);
    }
    // Adminlere de bildir
    this.server.to(`cafe_${cafeId}_admin`).emit('orderStatusUpdate', order);
  }
}
