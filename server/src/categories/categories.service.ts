import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(cafeId: string, createCategoryDto: CreateCategoryDto) {
    const existingCategory = await this.prisma.category.findFirst({
      where: {
        cafeId,
        name: {
          equals: createCategoryDto.name,
          mode: 'insensitive', // Case insensitive check
        },
      },
    });

    if (existingCategory) {
      throw new BadRequestException('Bu isimde bir kategori zaten mevcut.');
    }

    return this.prisma.category.create({
      data: {
        ...createCategoryDto,
        cafeId,
      },
    });
  }

  async findAll(cafeId: string) {
    return this.prisma.category.findMany({
      where: { cafeId },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  }

  async reorder(items: { id: string; sortOrder: number }[]) {
    // Toplu güncelleme işlemi
    return this.prisma.$transaction(
      items.map((item) =>
        this.prisma.category.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        }),
      ),
    );
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });
    if (!category) throw new NotFoundException('Kategori bulunamadı');
    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.findOne(id);

    if (updateCategoryDto.name) {
      const existingCategory = await this.prisma.category.findFirst({
        where: {
          cafeId: category.cafeId,
          name: {
            equals: updateCategoryDto.name,
            mode: 'insensitive',
          },
          id: { not: id }, // Exclude current category
        },
      });

      if (existingCategory) {
        throw new BadRequestException('Bu isimde bir kategori zaten mevcut.');
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });
  }

  async remove(id: string) {
    const category = await this.findOne(id);
    return this.prisma.category.delete({
      where: { id },
    });
  }
}
