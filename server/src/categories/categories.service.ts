import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

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

    const created = await this.prisma.category.create({
      data: {
        ...createCategoryDto,
        cafeId,
      },
    });
    await Promise.all([
      this.cache.del(`categories:${cafeId}`),
      this.cache.del(`products:${cafeId}`),
    ]);
    return created;
  }

  async findAll(cafeId: string) {
    const cacheKey = `categories:${cafeId}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const categories = await this.prisma.category.findMany({
      where: { cafeId },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    await this.cache.set(cacheKey, categories, 300 * 1000); // 5 dakika
    return categories;
  }

  async reorder(items: { id: string; sortOrder: number }[]) {
    const affected = await this.prisma.category.findMany({
      where: { id: { in: items.map((i) => i.id) } },
      select: { cafeId: true },
    });
    const cafeIds = Array.from(new Set(affected.map((c) => c.cafeId)));

    // Toplu güncelleme işlemi
    const result = await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.category.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        }),
      ),
    );
    await Promise.all(
      cafeIds.map((cafeId) => this.cache.del(`categories:${cafeId}`)),
    );
    return result;
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

    const updated = await this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });
    await Promise.all([
      this.cache.del(`categories:${category.cafeId}`),
      this.cache.del(`products:${category.cafeId}`),
    ]);
    return updated;
  }

  async remove(id: string) {
    const category = await this.findOne(id);
    const deleted = await this.prisma.category.delete({
      where: { id },
    });
    await Promise.all([
      this.cache.del(`categories:${category.cafeId}`),
      this.cache.del(`products:${category.cafeId}`),
    ]);
    return deleted;
  }
}
