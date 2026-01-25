import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private activeTables;
    private clientMap;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    private checkAndRemoveTable;
    handleJoinTable(client: Socket, payload: {
        cafeId: string;
        tableId: string;
    }): Promise<void>;
    handleJoinAdmin(client: Socket, payload: {
        cafeId: string;
    }): Promise<void>;
    private emitActiveTablesUpdate;
    notifyNewOrder(cafeId: string, order: any): void;
    notifyOrderStatusUpdate(cafeId: string, order: {
        tableId?: string | null;
        [key: string]: any;
    }): void;
}
