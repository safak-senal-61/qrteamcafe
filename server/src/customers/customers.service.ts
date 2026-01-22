import { Injectable } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  create(createCustomerDto: CreateCustomerDto) {
    return 'This action adds a new customer';
  }

  findAll() {
    return this.prisma.customer.findMany();
  }

  findOne(id: string) {
    return this.prisma.customer.findUnique({
      where: { id },
    });
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto) {
    const data: any = { ...updateCustomerDto };
    
    if (data.password) {
      const salt = await bcrypt.genSalt(10);
      data.passwordHash = await bcrypt.hash(data.password, salt);
      delete data.password;
    }

    return this.prisma.customer.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.customer.delete({
      where: { id },
    });
  }
}
