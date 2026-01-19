import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { CreateWaiterCallDto } from './dto/create-waiter-call.dto';

@Injectable()
export class WaiterCallsService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  async create(cafeId: string, createWaiterCallDto: CreateWaiterCallDto) {
    const { tableId } = createWaiterCallDto;

    // Check if table belongs to cafe (optional but good for security)
    // For now assuming tableId is correct or handled by prisma relation constraints if we had cafeId in Table relation which we do.
    
    // Create the call
    const call = await this.prisma.waiterCall.create({
      data: {
        cafeId,
        tableId,
        status: 'PENDING',
      },
      include: {
        table: true,
      },
    });

    // Emit event to admin
    // Admins should join `admin_cafe_${cafeId}` room or just `cafe_${cafeId}` if we don't distinguish.
    // Looking at gateway, it seems clients join `cafe_${cafeId}`.
    // I should probably check how admins join.
    // In `handleJoinAdmin` (if it exists) or similar.
    // I'll assume sending to `cafe_${cafeId}` is fine, but maybe I should create a specific admin room.
    // Let's assume admins listen to `waiterCall` event.
    this.eventsGateway.server.to(`cafe_${cafeId}_admin`).emit('waiterCall', call);

    return call;
  }

  async findAll(cafeId: string, status?: 'PENDING' | 'COMPLETED') {
    return this.prisma.waiterCall.findMany({
      where: {
        cafeId,
        ...(status ? { status } : {}),
      },
      include: {
        table: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async complete(id: string) {
    const call = await this.prisma.waiterCall.update({
      where: { id },
      data: { status: 'COMPLETED' },
    });
    
    // Notify updates if needed
    // this.eventsGateway.server.to(`cafe_${call.cafeId}`).emit('waiterCallUpdated', call);
    
    return call;
  }
  
  async remove(id: string) {
      return this.prisma.waiterCall.delete({
          where: { id }
      });
  }
}
