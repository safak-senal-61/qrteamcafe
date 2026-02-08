import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { getProductImage } from './product-images.util';
import { S3Service } from '../common/s3.service';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private readonly s3Service: S3Service,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  async getGalleryImages(query?: string) {
    try {
      // Changed cache key to invalidate old cache and reflect the scope change (all images)
      const cacheKey = 's3:list:all'; 
      let urls = (await this.cache.get(cacheKey)) as string[] | undefined;
      if (!urls) {
        // List from root to find manually uploaded files as well
        urls = await this.s3Service.listImages(''); 
        await this.cache.set(cacheKey, urls, 60);
      }

      let images = urls.map((url) => ({
        filename: url.split('/').pop() || '',
        url: url,
      }));

      // Eğer arama sorgusu varsa filtrele
      if (query) {
        const lowerQuery = query.toLowerCase();
        images = images.filter((img) =>
          img.filename.toLowerCase().includes(lowerQuery),
        );
      }

      return images;
    } catch (error) {
      console.error('Error listing S3 images:', error);
      return [];
    }
  }

  async create(cafeId: string, createProductDto: CreateProductDto) {
    const { recommendationIds, ...rest } = createProductDto;

    const product = await this.prisma.product.create({
      data: {
        ...rest,
        cafeId,
        recommendations: recommendationIds
          ? {
              connect: recommendationIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: {
        category: true,
      },
    });

    await Promise.all([
      this.cache.del(`products:${cafeId}`),
      this.cache.del(`categories:${cafeId}`),
    ]);

    return {
      ...product,
      imageUrl: getProductImage(
        product.name,
        product.category?.name,
        product.imageUrl,
      ),
    };
  }

  async findAll(cafeId: string) {
    const cacheKey = `products:${cafeId}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const products = await this.prisma.product.findMany({
      where: { cafeId },
      include: {
        category: true,
        recommendations: {
          select: { id: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    const mapped = products.map((product) => ({
      ...product,
      imageUrl: getProductImage(
        product.name,
        product.category?.name,
        product.imageUrl,
      ),
    }));

    await this.cache.set(cacheKey, mapped, 300);
    return mapped;
  }

  async reorder(items: { id: string; sortOrder: number }[]) {
    const affected = await this.prisma.product.findMany({
      where: { id: { in: items.map((i) => i.id) } },
      select: { cafeId: true },
    });
    const cafeIds = Array.from(new Set(affected.map((p) => p.cafeId)));

    // Toplu güncelleme işlemi
    const result = await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.product.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        }),
      ),
    );

    await Promise.all(
      cafeIds.map((cafeId) => this.cache.del(`products:${cafeId}`)),
    );
    return result;
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!product) throw new NotFoundException('Ürün bulunamadı');

    return {
      ...product,
      imageUrl: getProductImage(
        product.name,
        product.category?.name,
        product.imageUrl,
      ),
    };
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    // First verify product exists
    await this.findOne(id);

    // Validate prices if either price or originalPrice is being updated
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Ürün bulunamadı');

    const newPrice =
      updateProductDto.price !== undefined
        ? updateProductDto.price
        : product.price;
    const newOriginalPrice =
      updateProductDto.originalPrice !== undefined
        ? updateProductDto.originalPrice
        : product.originalPrice;

    if (newOriginalPrice !== null && newOriginalPrice !== undefined) {
      if (newOriginalPrice < newPrice) {
        throw new BadRequestException(
          'İndirimsiz fiyat, satış fiyatından küçük olamaz.',
        );
      }
    }

    const { recommendationIds, ...rest } = updateProductDto;

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: {
        ...rest,
        recommendations: recommendationIds
          ? {
              set: recommendationIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: { category: true },
    });

    await Promise.all([
      this.cache.del(`products:${product.cafeId}`),
      this.cache.del(`categories:${product.cafeId}`),
    ]);

    return {
      ...updatedProduct,
      imageUrl: getProductImage(
        updatedProduct.name,
        updatedProduct.category?.name,
        updatedProduct.imageUrl,
      ),
    };
  }

  async updateStock(id: string, quantity: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: { cafeId: true },
    });
    if (!product) throw new NotFoundException('Ürün bulunamadı');
    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        stock: {
          increment: quantity,
        },
      },
    });
    await this.cache.del(`products:${product.cafeId}`);
    return updated;
  }

  async remove(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: { cafeId: true },
    });
    if (!product) throw new NotFoundException('Ürün bulunamadı');
    const deleted = await this.prisma.product.delete({
      where: { id },
    });
    await Promise.all([
      this.cache.del(`products:${product.cafeId}`),
      this.cache.del(`categories:${product.cafeId}`),
    ]);
    return deleted;
  }

  async getRecommendations(productId: string, limit = 3) {
    // 1. Get manually recommended products
    const productWithRecommendations = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        recommendations: {
          where: { isAvailable: true },
          include: { category: true },
          take: limit,
        },
      },
    });

    let manualRecommendations =
      productWithRecommendations?.recommendations || [];

    // Add imageUrl to manual recommendations
    manualRecommendations = manualRecommendations.map((product) => ({
      ...product,
      imageUrl: getProductImage(
        product.name,
        product.category?.name,
        product.imageUrl,
      ),
    }));

    return manualRecommendations;
  }

  async toggleChefRecommendation(id: string, isChefRecommended: boolean) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: { cafeId: true },
    });
    if (!product) throw new NotFoundException('Ürün bulunamadı');
    const updated = await this.prisma.product.update({
      where: { id },
      data: { isChefRecommended },
    });
    await this.cache.del(`products:${product.cafeId}`);
    return updated;
  }
}
