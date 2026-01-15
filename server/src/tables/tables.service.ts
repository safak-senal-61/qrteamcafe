import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTableDto } from './dto/create-table.dto';

@Injectable()
export class TablesService {
  constructor(private prisma: PrismaService) {}

  async create(cafeId: string, createTableDto: CreateTableDto) {
    const existingTable = await this.prisma.table.findUnique({
      where: {
        cafeId_tableNumber: {
          cafeId,
          tableNumber: createTableDto.tableNumber,
        },
      },
    });

    if (existingTable) {
      throw new ConflictException('Bu masa numarası zaten mevcut.');
    }

    return this.prisma.table.create({
      data: {
        ...createTableDto,
        cafeId,
      },
    });
  }

  async findAll(cafeId: string) {
    return this.prisma.table.findMany({
      where: { cafeId },
      orderBy: { tableNumber: 'asc' },
    });
  }

  async remove(id: string) {
    return this.prisma.table.delete({
      where: { id },
    });
  }
}
